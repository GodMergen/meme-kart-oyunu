// server.js - 70 Görsel Kesin Eşleme Sürümü
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static(__dirname));

// 70 Adet Görsel Kütüphanesi (Doğrudan GitHub URL leri ile)
const MEME_KUTUPHANESI = [
    { id: 1, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-1.jpg", text: "ben öyle uygun gördüm" },
    { id: 2, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-2.jpg", text: "YAŞASIN KAFEİN" },
    { id: 3, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-3.jpg", text: "Kavga anı / Tutmayın beni" },
    { id: 4, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-4.jpg", text: "Plan vs Gerçekleşen" },
    { id: 5, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-5.jpg", text: "AUTOCAT" },
    { id: 6, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-6.jpg", text: "My Project / My Laptop" },
    { id: 7, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-7.jpg", text: "Şu şekil takılıyoruz" },
    { id: 8, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-8.jpg", text: "CAHİL" },
    { id: 9, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-9.jpg", text: "Utandırmasana" },
    { id: 10, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-10.jpg", text: "Hayattan bezmiş eşgalim" },
    { id: 11, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-11.jpg", text: "Taam Taam inandım inandım Taam" },
    { id: 12, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-12.jpg", text: "BÖYLE DEVAM EDERSE İNTİHAR EDECEĞİM" },
    { id: 13, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-13.jpg", text: "Kafayı yememe çeyrek kala" },
    { id: 14, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-14.jpg", text: "Duymak istemiyorum" },
    { id: 15, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-15.jpg", text: "Programlar vs *My Laptop" },
    { id: 16, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-16.jpg", text: "Uykudan yeni uyanmışım" },
    { id: 17, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-17.jpg", text: "Masa başında sızmak" },
    { id: 18, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-18.jpg", text: "Onaylıyorum mükemmel" },
    { id: 19, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-19.jpg", text: "Masum masum bakarken" },
    { id: 20, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-20.jpg", text: "Saçımı başımı yolucam" },
    { id: 21, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-21.jpg", text: "KUDURUN" },
    { id: 22, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-22.jpg", text: "Asabiyet var ama duygusalım" },
    { id: 23, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-23.jpg", text: "\"Ben demistim\"" },
    { id: 24, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-24.jpg", text: "Baş ağrısı yemin ederim" },
    { id: 25, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-25.jpg", text: "Ya sen ne anlation be abla gözünü sevim be abi" },
    { id: 26, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-26.jpg", text: "- DELİRDİM BİLİYOR MUSUN?" },
    { id: 27, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-27.jpg", text: "Tırnaklarımı yiyorum sinirden" },
    { id: 28, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-28.jpg", text: "ANYTHING BUT THE PROJECT" },
    { id: 29, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-29.jpg", text: "Relax olcan baba" },
    { id: 30, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-30.jpg", text: "kısmet bakalım hayırlısı nasip belki kader" },
    { id: 31, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-31.jpg", text: "evet sıkıntılı bir durum, ama dersini çalışmana engel değil." },
    { id: 32, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-32.jpg", text: "ÖMRÜMMMM" },
    { id: 33, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-33.jpg", text: "Battaniye modu" },
    { id: 34, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-34.jpg", text: "Sade olsun" },
    { id: 35, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-35.jpg", text: "sadece Üniversite okumak istemiştim" },
    { id: 36, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-36.jpg", text: "ARCHITECURE STUDENTS ON VACATION" },
    { id: 37, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-37.jpg", text: "Büyük hüsran" },
    { id: 38, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-38.jpg", text: "Bizim ortam" },
    { id: 39, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-39.jpg", text: "Sinirden bilgisayarı ısırmak" },
    { id: 40, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-40.jpg", text: "Alkışlıyorum helal olsun" },
    { id: 41, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-41.jpg", text: "Ders çalışmaya TİPİM MÜSAİT DEĞİL." },
    { id: 42, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-42.jpg", text: "Sabahlamışım ekrana bakıyorum" },
    { id: 43, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-43.jpg", text: "What did you study? Architecture." },
    { id: 44, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-44.jpg", text: "Sinsi sinsi plan yaparken" },
    { id: 45, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-45.jpg", text: "Otobüs camından bakıp ağlamak" },
    { id: 46, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-46.jpg", text: "Bana mı diyorsun?" },
    { id: 47, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-47.jpg", text: "Göz deviriyorum anla işte" },
    { id: 48, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-48.jpg", text: "Öf öf ! Yeter" },
    { id: 49, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-49.jpg", text: "Uzaklara dalıp gitmek" },
    { id: 50, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-50.jpg", text: "Kız Allah seni kahretmesin" },
    { id: 51, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-51.jpg", text: "Laptop soğutma taktiği" },
    { id: 52, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-52.jpg", text: "Dinliyoruz Ama Yargılamıyoruz" },
    { id: 53, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-53.jpg", text: "Hayattan bezmiş kahvaltı" },
    { id: 54, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-54.jpg", text: "Nağlet Gelsin" },
    { id: 55, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-55.jpg", text: "Ağlamıycam" },
    { id: 56, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-56.jpg", text: "Yine hüsran" },
    { id: 57, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-57.jpg", text: "Keyfime diyecek yok" },
    { id: 58, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-58.jpg", text: "neyse tecrübe oldu" },
    { id: 59, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-59.jpg", text: "ABART" },
    { id: 60, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-60.jpg", text: "Koymuşum" },
    { id: 61, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-61.jpg", text: "Amin inşallah" },
    { id: 62, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-62.jpg", text: "Sabah dedikodusu" },
    { id: 63, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-63.jpg", text: "Kafayı yiyorum" },
    { id: 64, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-64.jpg", text: "Sabır çekiyorum" },
    { id: 65, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-65.jpg", text: "Final haftası eşgalim" },
    { id: 66, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-66.jpg", text: "architecture students vs other students" },
    { id: 67, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-67.jpg", text: "Bunalım" },
    { id: 68, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-68.jpg", text: "EVET BİZ DE BURADA BULUNARAK ONLARI RAHATSIZ EDECEĞİZ" },
    { id: 69, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-69.jpg", text: "Çıldırıyorum" }
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