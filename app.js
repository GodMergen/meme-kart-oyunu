const socket = io();
let currentRoomCode = "";
let myRole = "player";
let myCurrentCards = [];
let currentGameState = "LOBBY";
let previousGameState = "LOBBY"; // Seslerin tekrar tekrar çalmasını önlemek için
let iHaveSubmittedCard = false; 
let isCreator = false; 

// 🎵 WEB AUDIO API - KOD İLE ÜRETİLEN 0 HATALI SES MOTORU
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    if (type === 'throw') {
        // Tok bir kart fırlatma sesi
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'tick') {
        // Son saniyeler için dijital tik-tak sesi
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'win') {
        // Zafer melodisi (Gümüş parlamaya eşlik eden temiz bir ses)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A
        osc.frequency.setValueAtTime(554, now + 0.1); // C#
        osc.frequency.setValueAtTime(659, now + 0.2); // E
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    }
}

function showSection(sectionId) {
    document.getElementById('create').style.display = 'none';
    document.getElementById('join').style.display = 'none';
    document.getElementById('rules').style.display = 'none';
    document.getElementById('credits').style.display = 'none';
    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';
}

function createRoom() {
    const playerName = document.getElementById('createPlayerName').value;
    if (!playerName) { alert("Lütfen bir isim girin!"); return; }
    myRole = "player";
    socket.emit('createRoom', { playerName: playerName });
}

socket.on('roomCreated', (data) => {
    currentRoomCode = data.roomCode;
    isCreator = true; 
    document.body.innerHTML = `
        <div class="welcome-container" style="width: 500px;">
            <h2>Oda Başarıyla Kuruldu! 🎉</h2>
            <h1 style="background: #2a2a2a; padding: 10px; border-radius: 5px; color: #ffc107; letter-spacing: 2px;">${data.roomCode}</h1>
            <hr>
            <h3>Lobi Odasındaki Oyuncular (Maks 6)</h3>
            <ul id="playerList" style="list-style: none; padding: 0; text-align: left;"></ul>
            <button class="action-btn" style="background-color: #28a745;" onclick="startGame()">Oyunu Başlat 🚀</button>
        </div>
    `;
});

function joinRoom() {
    const playerName = document.getElementById('joinPlayerName').value;
    const roomCode = document.getElementById('joinRoomCode').value.trim().toUpperCase();
    const roleRadio = document.querySelector('input[name="playerRole"]:checked').value;

    if (!playerName || !roomCode) { alert("Lütfen tüm alanları doldurun!"); return; }
    currentRoomCode = roomCode;
    myRole = roleRadio;
    
    // Ses motorunu tarayıcıda uyandırmak için ilk tıklamada tetikliyoruz
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    socket.emit('joinRoom', { roomCode: roomCode, playerName: playerName, asSpectator: (myRole === 'spectator') });
}

socket.on('roomFullError', () => {
    const wantSpectator = confirm("Bu oyun masası maksimum oyuncu sınırına (6) ulaştı! \n\nOyuna 'Canlı İzleyici/Jüri' olarak katılıp oylamalara yön vermek ister misin?");
    if (wantSpectator) {
        myRole = "spectator"; 
        const playerName = document.getElementById('joinPlayerName').value;
        socket.emit('joinRoom', { roomCode: currentRoomCode, playerName: playerName, asSpectator: true });
    }
});

socket.on('joinedRoom', (data) => {
    isCreator = false; 
    document.body.innerHTML = `
        <div class="welcome-container" style="width: 500px;">
            <h2>Odaya Giriş Yapıldı! 🎉</h2>
            <p>Oda Kodu: <strong style="color: #ffc107;">${data.roomCode}</strong></p>
            <p>Rolünüz: <strong>${myRole === 'spectator' ? '🎥 İzleyici / Jüri' : '🎮 Oyuncu'}</strong></p>
            <hr>
            <h3>Lobideki Oyuncular</h3>
            <ul id="playerList" style="list-style: none; padding: 0; text-align: left;"></ul>
            <p style="color: #888; font-size: 14px; margin-top: 15px;">Kurucunun oyunu başlatması bekleniyor...</p>
        </div>
    `;
});

socket.on('roomUpdated', (room) => {
    const playerListUl = document.getElementById('playerList');
    if (playerListUl) {
        playerListUl.innerHTML = ''; 
        room.players.forEach((p, idx) => {
            playerListUl.innerHTML += `<li>${idx === 0 ? '👑' : '🎮'} ${p.name}</li>`;
        });
        room.spectators.forEach(s => { playerListUl.innerHTML += `<li style="color:#888;">🎥 ${s.name}</li>`; });
    }
});

function startGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    socket.emit('startGame', { roomCode: currentRoomCode });
}

socket.on('gameStartedDirect', (data) => {
    if (data.initialCards) {
        myCurrentCards = data.initialCards;
    }

    if (document.querySelector('.studio-layer')) {
        renderMyHand();
        return;
    }

    document.body.innerHTML = `
        <div class="studio-layer">
            <div class="timer-banner" id="liveTimer">⏳ Kalan Süre: 30s</div>

            <div class="poker-table">
                <div class="main-deck-pile" onclick="drawCardFromDeck()">
                    <span>DESTE</span>
                    <span style="font-size:9px; color:#333; margin-top:4px;">🃏 (Sıra Beklerken Çek)</span>
                </div>

                <div class="table-center">
                    <!-- Başlangıçta Boş Olacak, tableStateUpdated Dolduracak -->
                </div>
                
                <div id="seatsAndSlotsPool"></div>
            </div>

            <div class="player-hand-dock" id="handDockZone"></div>
        </div>
    `;
    renderMyHand();
});

socket.on('yourHandUpdated', (data) => {
    myCurrentCards = data.cards;
    renderMyHand();
});

function drawCardFromDeck() {
    if(myRole !== 'player') return;
    playSound('throw');
    socket.emit('drawCard', { roomCode: currentRoomCode });
}

socket.on('localError', (data) => {
    alert(data.message);
});

socket.on('tableStateUpdated', (state) => {
    currentGameState = state.gameState; 
    iHaveSubmittedCard = state.submittedCardPlayerIds.includes(socket.id); 

    // Oylama başladığında bir kere flip sesi ve zafer açıklandığında win sesi çalalım
    if (currentGameState === "VOTING" && previousGameState === "PLAYING") {
        playSound('throw'); 
    } else if (currentGameState === "RESULTS" && previousGameState === "VOTING") {
        playSound('win');
    }
    previousGameState = currentGameState;

    const center = document.querySelector('.table-center');
    if (center) {
        if (state.gameState === "RESULTS" && state.winnerData) {
            // Şık gümüş ve siyah parlamayı ekliyoruz
            center.classList.add("winner-silver-glow");
            
            let resHtml = `<h2 style="color:#c0c0c0; font-size:12px; margin:0; margin-bottom:5px;">🏆 TURUN KAZANANLARI 🏆</h2>`;
            
            if (state.winnerData.pWinnerName) {
                resHtml += `<div style="margin-bottom:4px;">
                    <span style="font-size:10px; color:#aaa;">🎮 Oyuncu Oyu (${state.winnerData.pVotes})</span><br>
                    <span style="font-size:13px; font-weight:bold; color:#fff;">${state.winnerData.pWinnerName}</span>
                </div>`;
            }
            if (state.winnerData.sWinnerName) {
                resHtml += `<div style="margin-bottom:4px;">
                    <span style="font-size:10px; color:#aaa;">🎥 İzleyici Oyu (${state.winnerData.sVotes})</span><br>
                    <span style="font-size:13px; font-weight:bold; color:#fff;">${state.winnerData.sWinnerName}</span>
                </div>`;
            }

            if (isCreator) {
                resHtml += `<button onclick="nextRoundTrigger()" style="margin-top:8px; background:#e0e0e0; color:black; border:none; padding:5px 12px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">Sıradaki Tur 🚀</button>`;
            } else {
                resHtml += `<p style="font-size:9px; color:#aaa; margin-top:5px;">Kurucunun yeni turu başlatması bekleniyor...</p>`;
            }
            center.innerHTML = resHtml;
        } else {
            // Yeni tura geçildiğinde parlama efektini kaldır
            center.classList.remove("winner-silver-glow");
            
            let title = state.gameState === 'VOTING' ? '🔥 OYLAMA AŞAMASI 🔥' : 'BU TURUN DURUMU';
            center.innerHTML = `
                <h2 id="centerTitle">${title}</h2>
                <p id="tableSituation">"${state.situation}"</p>
            `;
        }
    }

    const pool = document.getElementById('seatsAndSlotsPool');
    if (!pool) return;
    
    pool.style.pointerEvents = 'auto';
    pool.style.opacity = '1';
    pool.innerHTML = '';

    const total = state.players.length;
    const radiusSeat = 240; 
    const radiusCard = 140; 

    state.players.forEach((player, index) => {
        const angle = (index * (360 / total)) * (Math.PI / 180);
        
        const sX = Math.round(280 + radiusSeat * Math.cos(angle) - 50); 
        const sY = Math.round(280 + radiusSeat * Math.sin(angle) - 20);
        const cX = Math.round(270 + radiusCard * Math.cos(angle) - 40);
        const cY = Math.round(260 + radiusCard * Math.sin(angle) - 57);

        let seatClass = "player-seat";
        const hasSubmitted = state.submittedCardPlayerIds.includes(player.id);
        if (hasSubmitted) seatClass += " submitted";
        
        pool.innerHTML += `
            <div class="${seatClass}" style="left: ${sX}px; top: ${sY}px;">
                <div style="font-size:10px; color:#ffc107;">${player.score} Puan</div>
                <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${player.name}</div>
            </div>
        `;

        let slotHtml = "";
        
        if (state.gameState === "PLAYING") {
            if (hasSubmitted) {
                slotHtml = `<div class="table-card-slot back-flipped" style="left: ${cX}px; top: ${cY}px; width: 80px; height: 115px;"></div>`;
            } else {
                slotHtml = `<div class="table-card-slot" style="left: ${cX}px; top: ${cY}px; width: 80px; height: 115px;"></div>`;
            }
        } 
        else if (state.gameState === "VOTING" || state.gameState === "RESULTS") {
            const vCard = state.votingCards[index];
            if (vCard) {
                // Flip animasyonunu karta uyguluyoruz
                slotHtml = `
                    <div class="table-card-slot has-card flip-animation" style="left: ${cX}px; top: ${cY}px; width: 80px; height: 115px; cursor: pointer; border: 2px solid #007bff;" 
                         onclick="${state.gameState === 'VOTING' ? `voteForCardOnTable('${vCard.submitId}')` : ''}">
                        <div style="width: 100%; height: 80px; background: ${vCard.card.color}; display: flex; align-items: center; justify-content: center; font-size: 32px;">
                            ${vCard.card.icon}
                        </div>
                        <div class="card-caption" style="font-size: 10px; padding: 4px;">${vCard.card.text}</div>
                    </div>
                `;
            }
        }
        pool.innerHTML += slotHtml;
    });

    renderMyHand(); 
});

function renderMyHand() {
    const dock = document.getElementById('handDockZone');
    if (!dock) return;

    if (myRole !== 'player') {
        let specMsg = "Masadaki hareketleri yukardan izliyorsunuz.";
        if (currentGameState === "VOTING") specMsg = "✨ OYLAMA BAŞLADI! Masadaki kartlara tıklayarak oy verin!";
        
        dock.innerHTML = `
            <h3 style="color: #ffc107; margin:0;">🎥 Canlı İzleyici Stüdyosu</h3>
            <p style="margin:0; font-size:12px; color:#aaa; margin-top:5px;">${specMsg}</p>
        `;
        return;
    }

    dock.innerHTML = `
        <h4 style="margin: 0; color: #ffc107; font-size:13px;">🃏 Senin Kartların - Kart Sayısı: ${myCurrentCards.length}/5</h4>
        <div class="cards-flex">
            ${myCurrentCards.map(card => `
                <div class="meme-card" onclick="playCardDirect(${card.id})">
                    <div style="width: 100%; height: 85px; background: ${card.color}; display: flex; align-items: center; justify-content: center; font-size: 32px;">
                        ${card.icon}
                    </div>
                    <div class="card-text-node">${card.text}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    if (currentGameState !== "PLAYING" || iHaveSubmittedCard) {
        dock.style.pointerEvents = 'none';
        dock.style.opacity = '0.4';
    } else {
        dock.style.pointerEvents = 'auto';
        dock.style.opacity = '1';
    }
}

function playCardDirect(cardId) {
    if(document.getElementById('handDockZone')) {
        document.getElementById('handDockZone').style.pointerEvents = 'none';
        document.getElementById('handDockZone').style.opacity = '0.4';
    }
    playSound('throw'); // Fırlatma Sesi
    socket.emit('playCard', { roomCode: currentRoomCode, cardId: cardId });
}

function voteForCardOnTable(submitId) {
    const pool = document.getElementById('seatsAndSlotsPool');
    if(pool) {
        pool.style.pointerEvents = 'none';
        pool.style.opacity = '0.7';
    }
    playSound('throw'); // Oylamada ufak bir tıklama hissi
    socket.emit('castVote', { roomCode: currentRoomCode, submitId: submitId });
}

function nextRoundTrigger() {
    socket.emit('startGame', { roomCode: currentRoomCode });
}

socket.on('timerTick', (data) => {
    const tBox = document.getElementById('liveTimer');
    if (tBox) {
        tBox.innerText = `⏳ Kalan Süre: ${data.timeLeft}s`;
        if(data.timeLeft <= 10) {
            tBox.style.background = "#bd2130";
            tBox.style.transform = "scale(1.1)";
            playSound('tick'); // Son 10 saniye kala kalp atışı gibi vurur
        } else {
            tBox.style.background = "#dc3545";
            tBox.style.transform = "scale(1)";
        }
    }
});