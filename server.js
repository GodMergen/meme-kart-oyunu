// server.js - 70 Görsel Destekli Kararlı Sürüm
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static(__dirname));

// 70 Adet Görsel Destekli Meme Kütüphanesi
const MEME_KUTUPHANESI = Array.from({ length: 70 }, (_, i) => ({
    id: i + 1,
    color: "#222222",
    type: "image",
    url: `https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-${i + 1}.jpg`,
    text: `Meme Kartı #${i + 1}`
}));

const rooms = {};

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function startRoomTimer(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.timerInterval) clearInterval(room.timerInterval);
    room.timeLeft = 15; 

    io.to(roomCode).emit('timerTick', { timeLeft: room.timeLeft });

    room.timerInterval = setInterval(() => {
        room.timeLeft--;
        io.to(roomCode).emit('timerTick', { timeLeft: room.timeLeft });

        if (room.timeLeft <= 0) {
            clearInterval(room.timerInterval);
            revealCardsAndStartVoting(roomCode);
        }
    }, 1000);
}

function revealCardsAndStartVoting(roomCode) {
    const room = rooms[roomCode];
    if (!room || room.gameState !== "PLAYING") return;

    room.players.forEach(player => {
        if (room.isDuelRound && !room.duelists.includes(player.id)) return;

        const hasSubmitted = room.submittedCards.some(c => c.playerId === player.id);
        if (!hasSubmitted && player.cards.length > 0) {
            const autoCard = player.cards[0];
            room.submittedCards.push({
                submitId: "SUB-" + Math.floor(Math.random() * 1000000),
                playerId: player.id,
                playerName: player.name,
                card: autoCard,
                playerVotes: 0,
                spectatorVotes: 0
            });
            player.cards = player.cards.filter(c => c.id !== autoCard.id);
            io.to(player.id).emit('yourHandUpdated', { cards: player.cards });
        }
    });

    room.gameState = "VOTING";
    room.shuffledVotingCards = shuffle(room.submittedCards.map(c => {
        return { submitId: c.submitId, card: c.card, ownerId: c.playerId };
    }));
    sendTableState(roomCode);
}

function sendTableState(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    io.to(roomCode).emit('tableStateUpdated', {
        gameState: room.gameState,
        roundCount: room.roundCount,
        situation: room.currentSituation,
        players: room.players,
        spectators: room.spectators,
        creatorId: room.creator,
        submittedCardsCount: room.submittedCards.length,
        submittedCardPlayerIds: room.submittedCards.map(c => c.playerId),
        votingCards: room.gameState === "VOTING" || room.gameState === "RESULTS" ? room.shuffledVotingCards : [],
        winnerData: room.winnerData || null,
        leaderboardData: room.leaderboardData || null,
        isDuelRound: room.isDuelRound || false,
        duelists: room.duelists || [],
        duelData: room.duelData || null
    });
}

io.on('connection', (socket) => {

    socket.on('createRoom', (data) => {
        const roomCode = String(Math.floor(1000 + Math.random() * 9000));
        rooms[roomCode] = {
            id: roomCode,
            creator: socket.id,
            players: [{ id: socket.id, name: data.playerName, score: 0, cards: [], hasDrawnThisRound: false }],
            spectators: [],
            gameState: "LOBBY",
            submittedCards: [],
            submittedVotes: 0,
            votedPlayers: [], 
            roundCount: 0,    
            timeLeft: 15,
            winnerData: null,
            leaderboardData: null,
            isDuelRound: false,
            duelists: []
        };
        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode: roomCode });
    });

    socket.on('joinRoom', (data) => {
        const roomCode = data.roomCode;
        if (rooms[roomCode]) {
            if (!data.asSpectator && rooms[roomCode].players.length >= 6) {
                socket.emit('roomFullError');
                return; 
            }

            if (data.asSpectator) {
                rooms[roomCode].spectators.push({ id: socket.id, name: data.playerName + " (İzleyici)" });
                socket.join(roomCode);
                socket.emit('joinedRoom', { roomCode: roomCode, role: 'spectator' });
            } else {
                rooms[roomCode].players.push({ id: socket.id, name: data.playerName, score: 0, cards: [], hasDrawnThisRound: false });
                socket.join(roomCode);
                socket.emit('joinedRoom', { roomCode: roomCode, role: 'player' });
            }
            io.to(roomCode).emit('roomUpdated', rooms[roomCode]);
            
            if (rooms[roomCode].gameState !== "LOBBY") {
                socket.emit('gameStartedDirect', { roomCode: roomCode });
                sendTableState(roomCode);
            }
        } else {
            socket.emit('error', { message: "Oda bulunamadi!" });
        }
    });

    socket.on('startGame', (data) => {
        const room = rooms[data.roomCode];
        if (!room) return;
        if (room.creator !== socket.id) return;

        if (room.gameState !== "DUEL_ANNOUNCEMENT") {
            room.roundCount += 1; 
        }

        room.gameState = "PLAYING";
        room.submittedCards = [];
        room.submittedVotes = 0;
        room.votedPlayers = []; 
        room.winnerData = null;
        room.leaderboardData = null;

        const situationPool = [
            "Sabah alarmı kapatıp 5 dakika daha uyuyunca geçen o yarım saat...",
            "Tam banyodan çıkmışken birinin ıslak terliğine basmışımdır...",
            "Önemli bir şey anlatırken karşımdakinin esnediğini görmüşümdür...",
            "Bilgisayara format attıktan sonra yedeklemeyi unuttuğum dosyayı hatırlayınca...",
            "Valorant'ta arkasından bıçak atmaya çalışırken adamın aniden arkasına dönmesi..."
        ];
        room.currentSituation = situationPool[Math.floor(Math.random() * situationPool.length)];

        io.to(data.roomCode).emit('gameStartedDirect', { roomCode: room.id });

        room.players.forEach(player => {
            if (!player.cards) player.cards = [];
            player.hasDrawnThisRound = false; 
            
            if (player.cards.length === 0) {
                let shuffledDeck = shuffle([...MEME_KUTUPHANESI]);
                player.cards = shuffledDeck.slice(0, 5).map((card, idx) => {
                    return { id: Date.now() + idx + Math.random(), color: card.color, type: card.type, url: card.url, text: card.text };
                });
            } 
            io.to(player.id).emit('yourHandUpdated', { cards: player.cards });
        });

        sendTableState(data.roomCode);
        startRoomTimer(data.roomCode);
    });

    socket.on('drawCard', (data) => {
        const room = rooms[data.roomCode];
        if (!room || room.gameState !== "PLAYING") return;
        
        if (room.isDuelRound && !room.duelists.includes(socket.id)) {
            socket.emit('localError', { message: "Uzatma düellosundasınız! Sadece düellocular kart çekebilir." }); return;
        }

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        if (player.hasDrawnThisRound) {
            socket.emit('localError', { message: "Bu tur zaten kart çektin!" }); return;
        }
        if (player.cards.length >= 5) {
            socket.emit('localError', { message: "Eliniz dolu!" }); return;
        }

        const templateCard = MEME_KUTUPHANESI[Math.floor(Math.random() * MEME_KUTUPHANESI.length)];
        player.cards.push({ id: Date.now() + Math.random(), color: templateCard.color, type: templateCard.type, url: templateCard.url, text: templateCard.text });
        player.hasDrawnThisRound = true; 
        
        socket.emit('yourHandUpdated', { cards: player.cards });
    });

    socket.on('playCard', (data) => {
        const room = rooms[data.roomCode];
        if (!room || room.gameState !== "PLAYING") return;
        
        if (room.isDuelRound && !room.duelists.includes(socket.id)) {
            socket.emit('localError', { message: "Bu bir düello!" }); return;
        }

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;
        if (room.submittedCards.some(c => c.playerId === socket.id)) return;

        const playedCardDetail = player.cards.find(c => c.id === data.cardId);
        if (!playedCardDetail) return;

        player.cards = player.cards.filter(c => c.id !== data.cardId);

        room.submittedCards.push({
            submitId: "SUB-" + Math.floor(Math.random() * 1000000), 
            playerId: socket.id,
            playerName: player.name,
            card: playedCardDetail,
            playerVotes: 0,
            spectatorVotes: 0
        });

        socket.emit('yourHandUpdated', { cards: player.cards });
        sendTableState(data.roomCode);

        const expectedCards = room.isDuelRound ? room.duelists.length : room.players.length;
        if (room.submittedCards.length === expectedCards) {
            clearInterval(room.timerInterval);
            revealCardsAndStartVoting(data.roomCode);
        }
    });

    socket.on('castVote', (data) => {
        const room = rooms[data.roomCode];
        if (!room || room.gameState !== "VOTING") return;
        if (room.votedPlayers.includes(socket.id)) return;

        const isPlayer = room.players.some(p => p.id === socket.id);
        const isSpectator = room.spectators.some(s => s.id === socket.id);
        if (!isPlayer && !isSpectator) return;

        room.votedPlayers.push(socket.id);

        const votedCard = room.submittedCards.find(c => c.submitId === data.submitId);
        if (votedCard) {
            if (isPlayer) votedCard.playerVotes += 1;
            if (isSpectator) votedCard.spectatorVotes += 1;
        }

        room.submittedVotes += 1;
        const expectedVotes = room.players.length + room.spectators.length;

        if (room.submittedVotes >= expectedVotes) {
            let maxPVotes = 0;
            let maxSVotes = 0;

            room.submittedCards.forEach(c => { 
                if (c.playerVotes > maxPVotes) maxPVotes = c.playerVotes; 
                if (c.spectatorVotes > maxSVotes) maxSVotes = c.spectatorVotes; 
            });

            let pWinningCards = room.submittedCards.filter(c => c.playerVotes === maxPVotes && maxPVotes > 0);
            let sWinningCards = room.submittedCards.filter(c => c.spectatorVotes === maxSVotes && maxSVotes > 0);

            pWinningCards.forEach(wCard => {
                const winnerPlayer = room.players.find(p => p.id === wCard.playerId);
                if (winnerPlayer) winnerPlayer.score += 1;
            });
            sWinningCards.forEach(wCard => {
                const winnerPlayer = room.players.find(p => p.id === wCard.playerId);
                if (winnerPlayer) winnerPlayer.score += 1;
            });

            room.winnerData = {
                pWinnerName: pWinningCards.map(c => c.playerName).join(" ve ") || null,
                pVotes: maxPVotes,
                sWinnerName: sWinningCards.map(c => c.playerName).join(" ve ") || null,
                sVotes: maxSVotes
            };

            let sorted = [...room.players].sort((a, b) => b.score - a.score);
            let topScore = sorted[0].score;
            let tiedPlayers = sorted.filter(p => p.score === topScore);

            if ((room.roundCount % 10 === 0 || room.isDuelRound) && tiedPlayers.length > 1) {
                room.gameState = "DUEL_ANNOUNCEMENT";
                room.isDuelRound = true;
                room.duelists = tiedPlayers.map(p => p.id);
                room.duelData = { names: tiedPlayers.map(p => p.name) };
            } else if (room.roundCount % 10 === 0 || room.isDuelRound) {
                room.gameState = "LEADERBOARD";
                room.leaderboardData = sorted;
                room.isDuelRound = false; 
                room.duelists = [];
            } else {
                room.gameState = "RESULTS";
            }

            sendTableState(data.roomCode);
        }
    });

    socket.on('sendReaction', (data) => {
        const roomCode = data.roomCode;
        const room = rooms[roomCode];
        if (!room) return;
        let senderName = "Biri";
        const foundP = room.players.find(p => p.id === socket.id);
        const foundS = room.spectators.find(s => s.id === socket.id);
        if (foundP) senderName = foundP.name;
        else if (foundS) senderName = foundS.name;

        io.to(roomCode).emit('receiveReaction', {
            senderId: socket.id,
            senderName: senderName,
            type: data.type,
            value: data.value 
        });
    });

    socket.on('returnToLobby', (data) => {
        const room = rooms[data.roomCode];
        if (!room || room.creator !== socket.id) return;
        room.gameState = "LOBBY";
        room.roundCount = 0;
        room.isDuelRound = false;
        room.players.forEach(p => { p.score = 0; p.cards = []; });
        io.to(data.roomCode).emit('roomUpdated', room);
        sendTableState(data.roomCode);
    });
});

http.listen(3000, () => {
    console.log('=== 70 GÖRSEL DESTEKLİ SUNUCU AKTİF ===');
});