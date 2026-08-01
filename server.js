// server.js - 70 Görsel Kesin Eşleme Sürümü
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static(__dirname));

// 70 Adet Görsel Kütüphanesi (Doğrudan GitHub URL leri ile)
const MEME_KUTUPHANESI = [
    { id: 1, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-1.jpg", text: "O sırada benim sıfat" },
    { id: 2, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-2.jpg", text: "Beklenmedik hata anı" },
    { id: 3, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-3.jpg", text: "Ciddi misin kanka?" },
    { id: 4, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-4.jpg", text: "İçten ağlarken dışa gülen ben" },
    { id: 5, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-5.jpg", text: "Şoktayım, ne diyeceğimi bilmiyorum" },
    { id: 6, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-6.jpg", text: "Projeyi tekte çalıştırınca ben" },
    { id: 7, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-7.jpg", text: "Sabah terliğe basan o ayak" },
    { id: 8, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-8.jpg", text: "Hoca en kritik yeri yazarken ben" },
    { id: 9, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-9.jpg", text: "Gece 3'te akla gelen fikir" },
    { id: 10, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-10.jpg", text: "İçinde bulunduğum durum" },
    { id: 11, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-11.jpg", text: "Plan vs Gerçekleşen" },
    { id: 12, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-12.jpg", text: "Dramayı izliyorum" },
    { id: 13, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-13.jpg", text: "Mutlu mesut takılıyorum" },
    { id: 14, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-14.jpg", text: "Sırf sussun diye onay" },
    { id: 15, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-15.jpg", text: "Yapma derken yaptığım" },
    { id: 16, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-16.jpg", text: "Özgüvenle hata yapma" },
    { id: 17, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-17.jpg", text: "Saçmalamasını izliyorum" },
    { id: 18, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-18.jpg", text: "Toparlamaya çalışırken batırmak" },
    { id: 19, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-19.jpg", text: "Buraya geleceğini biliyordum" },
    { id: 20, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-20.jpg", text: "Sabrımın son sınırları" },
    { id: 21, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-21.jpg", text: "Gözden yaş gelene kadar" },
    { id: 22, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-22.jpg", text: "Gizli tehlikeli plan" },
    { id: 23, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-23.jpg", text: "Ortalığı ateşe verip izlemek" },
    { id: 24, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-24.jpg", text: "Kontrol altındaymış gibi" },
    { id: 25, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-25.jpg", text: "Hiçbir şey anlamadım ama kararlıyım" },
    { id: 26, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-26.jpg", text: "Cevap bulamayınca ben" },
    { id: 27, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-27.jpg", text: "Ciddiyetle saçmalamak" },
    { id: 28, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-28.jpg", text: "Köşede kriz geçirmek" },
    { id: 29, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-29.jpg", text: "Hayatımı sorgulama" },
    { id: 30, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-30.jpg", text: "Mutluluğun kısa sürdüğü an" },
    { id: 31, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-31.jpg", text: "Alakasız konuya dahil olmam" },
    { id: 32, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-32.jpg", text: "Beklentiler vs Gerçekler" },
    { id: 33, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-33.jpg", text: "Derin nefes alıp sakinleşme" },
    { id: 34, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-34.jpg", text: "İşler yoluna girdi derken" },
    { id: 35, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-35.jpg", text: "İçimdeki çocuk sustu" },
    { id: 36, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-36.jpg", text: "Şaşırma yeteneğimi kaybettim" },
    { id: 37, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-37.jpg", text: "Kendi hatamı görmezden gelme" },
    { id: 38, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-38.jpg", text: "Bu kafayla nasıl yaşıyorum" },
    { id: 39, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-39.jpg", text: "Konuşana bakış açım" },
    { id: 40, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-40.jpg", text: "Gereksiz özgüven patlaması" },
    { id: 41, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-41.jpg", text: "Tuhaflık karşısında donakalmak" },
    { id: 42, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-42.jpg", text: "Muazzam mantık hatası" },
    { id: 43, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-43.jpg", text: "Gizli işler peşinde suçüstü" },
    { id: 44, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-44.jpg", text: "Dünyanın en rahat insanı" },
    { id: 45, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-45.jpg", text: "Bu anı ölümsüzleştirmek lazım" },
    { id: 46, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-46.jpg", text: "Sorumluluktan kaçış şeklim" },
    { id: 47, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-47.jpg", text: "Bütün enerjimi harcıyorum" },
    { id: 48, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-48.jpg", text: "Karanlık mizah seansı" },
    { id: 49, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-49.jpg", text: "Plan tutmayınca surat ifadesi" },
    { id: 50, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-50.jpg", text: "Mantıklı bir bahanem var" },
    { id: 51, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-51.jpg", text: "Ortamın kalitesini düşürmek" },
    { id: 52, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-52.jpg", text: "Hatamı gururla savunuyorum" },
    { id: 53, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-53.jpg", text: "Gözlerimden alev çıkarken" },
    { id: 54, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-54.jpg", text: "Hayatın sillesini yiyince" },
    { id: 55, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-55.jpg", text: "Arka plandaki dramatik müzik" },
    { id: 56, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-56.jpg", text: "Cevap vermeyip gülmek" },
    { id: 57, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-57.jpg", text: "Kurtaracak tek kişi olup batırmak" },
    { id: 58, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-58.jpg", text: "Normal insan gibi davranma" },
    { id: 59, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-59.jpg", text: "Destansı hata yapma anı" },
    { id: 60, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-60.jpg", text: "Kazanan yine şaşırtmıyor" },
    { id: 61, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-61.jpg", text: "Epic fail anı" },
    { id: 62, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-62.jpg", text: "Gözlerimi kapatıyorum" },
    { id: 63, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-63.jpg", text: "Zeka akıyor gruptan" },
    { id: 64, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-64.jpg", text: "İçimdeki kaos sesleri" },
    { id: 65, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-65.jpg", text: "Sakin kalma çabaları" },
    { id: 66, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-66.jpg", text: "Bunu da mı yaptım" },
    { id: 67, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-67.jpg", text: "İfşa olmuşum gibiyim" },
    { id: 68, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-68.jpg", text: "Mükemmel zamanlama" },
    { id: 69, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-69.jpg", text: "Olaylar olaylar" },
    { id: 70, color: "#222222", type: "image", url: "https://raw.githubusercontent.com/GodMergen/memes-kart-oyunu/main/images/meme-70.jpg", text: "Ve kapanış" }
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