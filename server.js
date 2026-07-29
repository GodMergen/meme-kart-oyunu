// server.js - Oyunun Canlı Beyni
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static(__dirname));

const MEME_KUTUPHANESI = [
    { id: 1, color: "#e63946", icon: "💥", text: "O sırada benim sıfat" },
    { id: 2, color: "#f1faee", icon: "🤡", text: "Beklenmedik hata anı" },
    { id: 3, color: "#a8dadc", icon: "🤔", text: "Ciddi misin kanka?" },
    { id: 4, color: "#457b9d", icon: "😭", text: "İçten ağlarken dışa gülen ben" },
    { id: 5, color: "#1d3557", icon: "😳", text: "Şoktayım, ne diyeceğimi bilmiyorum" },
    { id: 6, color: "#ffb703", icon: "😎", text: "Projeyi tekte çalıştırınca ben" },
    { id: 7, color: "#fb8500", icon: "💀", text: "Sabah terliğe basan o ayak" }
];

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
    room.timeLeft = 30;

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
        return { submitId: c.submitId, card: c.card };
    }));
    sendTableState(roomCode);
}

function sendTableState(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    io.to(roomCode).emit('tableStateUpdated', {
        gameState: room.gameState,
        situation: room.currentSituation,
        players: room.players,
        submittedCardsCount: room.submittedCards.length,
        submittedCardPlayerIds: room.submittedCards.map(c => c.playerId),
        votingCards: room.gameState === "VOTING" || room.gameState === "RESULTS" ? room.shuffledVotingCards : [],
        winnerData: room.winnerData || null
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
            timeLeft: 30,
            winnerData: null
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

        // 🎯 YENİ GÜVENLİK DUVARI: Sadece oda kurucusu yeni tur başlatabilir!
        if (room.creator !== socket.id) return;

        room.gameState = "PLAYING";
        room.submittedCards = [];
        room.submittedVotes = 0;
        room.votedPlayers = []; 
        room.winnerData = null;
        room.roundCount += 1; 

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
            
            if (room.roundCount === 1) {
                let shuffledDeck = shuffle([...MEME_KUTUPHANESI]);
                player.cards = shuffledDeck.slice(0, 5); 
            } 
            io.to(player.id).emit('yourHandUpdated', { cards: player.cards });
        });

        sendTableState(data.roomCode);
        startRoomTimer(data.roomCode);
    });

    socket.on('drawCard', (data) => {
        const room = rooms[data.roomCode];
        if (!room || room.gameState !== "PLAYING") return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        if (player.hasDrawnThisRound) {
            socket.emit('localError', { message: "Bu tur zaten kart çektin! Diğer turu bekle." }); return;
        }
        if (player.cards.length >= 5) {
            socket.emit('localError', { message: "Eliniz dolu! Önce bir kart atmalısınız." }); return;
        }

        player.cards.push(MEME_KUTUPHANESI[Math.floor(Math.random() * MEME_KUTUPHANESI.length)]);
        player.hasDrawnThisRound = true; 
        socket.emit('yourHandUpdated', { cards: player.cards });
    });

    socket.on('playCard', (data) => {
        const room = rooms[data.roomCode];
        if (!room || room.gameState !== "PLAYING") return;
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

        if (room.submittedCards.length === room.players.length) {
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

            room.gameState = "RESULTS";
            room.winnerData = {
                pWinnerName: pWinningCards.map(c => c.playerName).join(" ve ") || null,
                pVotes: maxPVotes,
                sWinnerName: sWinningCards.map(c => c.playerName).join(" ve ") || null,
                sVotes: maxSVotes
            };

            sendTableState(data.roomCode);
        }
    });
});

http.listen(3000, () => {
    console.log('=== MOTOR YENIDEN CALISTI ===');
});