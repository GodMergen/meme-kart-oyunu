// app.js - 70 Görsel Uyumlu İstemci Sürümü
const socket = io();
let currentRoomCode = "";
let isRoomCodeHidden = false;
let myRole = "player";
let myCurrentCards = [];
let currentGameState = "LOBBY";
let previousGameState = "LOBBY"; 
let iHaveSubmittedCard = false; 
let isCreator = false; 
let leaderboardTimerInterval = null;

let emojiCountThisRound = 0;
let soundCountThisRound = 0;
let lastSoundTime = 0;

function getMaxQuota() {
    return (myRole === 'spectator') ? 1 : 3;
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function setTheme(themeName) {
    document.body.classList.remove('theme-classic-green', 'theme-cyberpunk-neon', 'theme-obsidian-silver');
    document.body.classList.add(`theme-${themeName}`);
    localStorage.setItem('memeGameTheme', themeName);
}
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('memeGameTheme') || 'classic-green';
    setTheme(savedTheme);
});

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    
    if (type === 'throw') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'tick') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'win') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); 
        osc.frequency.setValueAtTime(554, now + 0.1); 
        osc.frequency.setValueAtTime(659, now + 0.2); 
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    } else if (type === 'trol-bruh') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (type === 'trol-airhorn') {
        const audio = new Audio('https://www.myinstants.com/media/sounds/mlg-airhorn.mp3');
        audio.volume = 1.0;
        audio.play().catch(e => console.log("Ses hatası:", e));
    } else if (type === 'trol-laugh') {
        const laughNotes = [350, 480, 400, 550, 420, 600, 450, 650];
        laughNotes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
            const startTime = now + (idx * 0.08);
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.4, startTime);
            gain.gain.linearRampToValueAtTime(0.01, startTime + 0.09);
            osc.start(startTime);
            osc.stop(startTime + 0.09);
        });
    }
}

function showSection(sectionId) {
    const createSec = document.getElementById('create');
    const joinSec = document.getElementById('join');
    const rulesSec = document.getElementById('rules');
    const creditsSec = document.getElementById('credits');

    if (createSec) createSec.style.display = 'none';
    if (joinSec) joinSec.style.display = 'none';
    if (rulesSec) rulesSec.style.display = 'none';
    if (creditsSec) creditsSec.style.display = 'none';

    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';
}

function createRoom() {
    const playerName = document.getElementById('createPlayerName').value;
    if (!playerName) { alert("Lütfen bir isim girin!"); return; }
    myRole = "player";
    socket.emit('createRoom', { playerName: playerName });
}

function toggleRoomCode() {
    isRoomCodeHidden = !isRoomCodeHidden;
    const codeDisplay = document.getElementById("lobbyRoomCodeText");
    if(codeDisplay) {
        codeDisplay.innerText = isRoomCodeHidden ? "****" : currentRoomCode;
    }
}

socket.on('roomCreated', (data) => {
    currentRoomCode = data.roomCode;
    isRoomCodeHidden = false;
    isCreator = true; 
    document.body.innerHTML = `
        <div class="welcome-container" style="width: 500px;">
            <h2>Oda Başarıyla Kuruldu! 🎉</h2>
            <div style="background: #2a2a2a; padding: 10px; border-radius: 5px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                <h1 id="lobbyRoomCodeText" style="color: #ffc107; margin:0; letter-spacing: 2px;">${currentRoomCode}</h1>
                <button onclick="toggleRoomCode()" style="background:transparent; border:none; color:#fff; cursor:pointer; font-size:18px;" title="Kodu Gizle/Göster">👁️</button>
            </div>
            <p style="font-size:10px; color:#888;">Yayıncılar için odayı gizleme butonu aktiftir.</p>
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
    
    if (audioCtx.state === 'suspended') audioCtx.resume();
    socket.emit('joinRoom', { roomCode: roomCode, playerName: playerName, asSpectator: (myRole === 'spectator') });
}

socket.on('roomFullError', () => {
    const wantSpectator = confirm("Bu oyun masası maksimum oyuncu sınırına (6) ulaştı! \n\nOyuna 'İzleyici' olarak katılıp oylamalara yön vermek ister misin?");
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
            <p>Oda Kodu: <strong style="color: #ffc107;">**** (Gizli)</strong></p>
            <p>Rolünüz: <strong>${myRole === 'spectator' ? '🎥 İzleyici' : '🎮 Oyuncu'}</strong></p>
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
        room.players.forEach(p => {
            let icon = (p.id === room.creator) ? '👑' : '🎮';
            playerListUl.innerHTML += `<li>${icon} ${p.name}</li>`;
        });
        room.spectators.forEach(s => { playerListUl.innerHTML += `<li style="color:#888;">🎥 ${s.name}</li>`; });
    }
});

function startGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (leaderboardTimerInterval) clearInterval(leaderboardTimerInterval);
    socket.emit('startGame', { roomCode: currentRoomCode });
}

socket.on('gameStartedDirect', (data) => {
    if (leaderboardTimerInterval) clearInterval(leaderboardTimerInterval);
    
    emojiCountThisRound = 0;
    soundCountThisRound = 0;

    if (document.querySelector('.studio-layer')) {
        updateReactionPanelUI();
        return;
    }

    document.body.innerHTML = `
        <div class="studio-layer">
            <div class="timer-banner" id="liveTimer">⏳ Kalan Süre: 15s</div>

            <div class="reaction-panel" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.8); padding: 8px 12px; border-radius: 8px; border: 1px solid #444; z-index: 999; text-align: center;">
                <div style="font-size: 10px; color: #ffc107; margin-bottom: 4px; font-weight:bold;">🎭 TROL PANELİ</div>
                <div style="display: flex; gap: 5px; margin-bottom: 5px;" id="emojiButtonsBox">
                    <button onclick="sendReaction('emoji', '🤡')" class="react-btn">🤡</button>
                    <button onclick="sendReaction('emoji', '💀')" class="react-btn">💀</button>
                    <button onclick="sendReaction('emoji', '🔥')" class="react-btn">🔥</button>
                </div>
                <div style="display: flex; gap: 4px;" id="soundButtonsBox">
                    <button onclick="sendReaction('sound', 'trol-bruh')" class="sound-btn">📢 Bruh</button>
                    <button onclick="sendReaction('sound', 'trol-airhorn')" class="sound-btn">🚨 Tır Korna</button>
                    <button onclick="sendReaction('sound', 'trol-laugh')" class="sound-btn">😂 Kahkaha</button>
                </div>
                <div id="reactionQuotaInfo" style="font-size: 9px; color: #aaa; margin-top: 4px;">Hak: Emoji (3/3) | Ses (3/3)</div>
            </div>

            <div id="floatingReactionsContainer" style="position: absolute; top: 130px; right: 25px; pointer-events: none; z-index: 1000; display: flex; flex-direction: column; align-items: flex-end;"></div>

            <div class="poker-table">
                <div class="main-deck-pile" onclick="drawCardFromDeck()">
                    <span>DESTE</span>
                    <span style="font-size:9px; color:#333; margin-top:4px;">🃏 (Sıra Beklerken Çek)</span>
                </div>

                <div class="table-center"></div>
                <div id="seatsAndSlotsPool"></div>
            </div>

            <div class="player-hand-dock" id="handDockZone"></div>
        </div>
    `;
    updateReactionPanelUI();
});

function sendReaction(type, value) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const maxLimit = getMaxQuota();
    
    if (type === 'emoji') {
        if (emojiCountThisRound >= maxLimit) { alert(`Bu tur için emoji hakkın bitti!`); return; }
        emojiCountThisRound++;
    } else if (type === 'sound') {
        if (soundCountThisRound >= maxLimit) { alert(`Bu tur için ses hakkın bitti!`); return; }
        const now = Date.now();
        if (now - lastSoundTime < 2000) { alert("Sesler arasında 2 saniye beklemelisin!"); return; }
        soundCountThisRound++;
        lastSoundTime = now;
    }
    updateReactionPanelUI();
    socket.emit('sendReaction', { roomCode: currentRoomCode, type: type, value: value });
}

function updateReactionPanelUI() {
    const quotaEl = document.getElementById('reactionQuotaInfo');
    if (quotaEl) {
        const maxLimit = getMaxQuota();
        quotaEl.innerText = `Hak: Emoji (${maxLimit - emojiCountThisRound}/${maxLimit}) | Ses (${maxLimit - soundCountThisRound}/${maxLimit})`;
    }
}

socket.on('receiveReaction', (data) => {
    if (data.type === 'sound') playSound(data.value);

    const container = document.getElementById('floatingReactionsContainer');
    if (container) {
        const bubble = document.createElement('div');
        bubble.style.background = "rgba(0, 0, 0, 0.85)";
        bubble.style.color = "#fff";
        bubble.style.padding = "6px 12px";
        bubble.style.borderRadius = "8px";
        bubble.style.marginBottom = "6px";
        bubble.style.border = "1px solid #ffc107";
        bubble.style.boxShadow = "0 4px 10px rgba(0,0,0,0.6)";
        bubble.style.animation = "fadeInOut 2.5s forwards";

        let displayVal = data.value;
        if (data.type === 'emoji') {
            displayVal = `<span style="font-size: 2.5em; vertical-align: middle;">${data.value}</span>`;
        } else if (data.type === 'sound') {
            let soundName = data.value === 'trol-bruh' ? "📢 BRUH" : (data.value === 'trol-airhorn' ? "🚨 TIR KORNA" : "😂 KAHKAHA");
            displayVal = `<strong style="color: #00f5d4;">${soundName}</strong>`;
        }

        bubble.innerHTML = `<span style="font-size: 11px; color:#ffc107; font-weight:bold;">${data.senderName}:</span> ${displayVal}`;
        container.appendChild(bubble);

        setTimeout(() => bubble.remove(), 2500);
    }
});

socket.on('yourHandUpdated', (data) => {
    myCurrentCards = data.cards;
});

function drawCardFromDeck() {
    if(myRole !== 'player') return;
    playSound('throw');
    socket.emit('drawCard', { roomCode: currentRoomCode });
}

socket.on('localError', (data) => { alert(data.message); });

socket.on('tableStateUpdated', (state) => {
    currentGameState = state.gameState; 
    iHaveSubmittedCard = state.submittedCardPlayerIds.includes(socket.id); 

    if (currentGameState === "VOTING" && previousGameState === "PLAYING") playSound('throw'); 
    else if ((currentGameState === "RESULTS" || currentGameState === "LEADERBOARD") && previousGameState === "VOTING") playSound('win');
    previousGameState = currentGameState;

    const center = document.querySelector('.table-center');
    if (center) {
        if (state.gameState === "DUEL_ANNOUNCEMENT") {
            if (leaderboardTimerInterval) clearInterval(leaderboardTimerInterval);
            center.classList.add("winner-silver-glow");
            
            let duelHtml = `
                <h2 style="color:#dc3545; font-size:16px; margin:0; margin-bottom:5px; text-shadow: 0 0 10px red;">⚔️ UZATMA DÜELLOSU! ⚔️</h2>
                <p style="font-size:11px; color:#fff;">Puanlar berabere! Şampiyonu belirlemek için son kapışma!</p>
                <p style="font-size:13px; color:#ffc107; font-weight:bold;">${state.duelData.names.join(' <span style="color:white;">vs</span> ')}</p>
            `;
            if (isCreator) {
                duelHtml += `<button onclick="nextRoundTrigger()" style="margin-top:8px; background:#dc3545; color:white; border:none; padding:5px 12px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold;">Düelloyu Başlat ⚔️</button>`;
            } else {
                duelHtml += `<p style="font-size:9px; color:#aaa; margin-top:5px;">Kurucunun düelloyu başlatması bekleniyor...</p>`;
            }
            center.innerHTML = duelHtml;

        } else if (state.gameState === "LEADERBOARD" && state.leaderboardData) {
            center.classList.add("winner-silver-glow");
            if (leaderboardTimerInterval) clearInterval(leaderboardTimerInterval);
            let lbTime = 15;

            let lbHtml = `
                <h2 style="color:#ffc107; font-size:12px; margin:0; margin-bottom:4px;">🏆 MAÇ SONU SKOR TABLOSU 🏆</h2>
                <div style="max-height: 90px; overflow-y: auto; width: 100%; padding: 2px;">
                    <table style="width:100%; font-size:11px; color:#fff; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #444; color:#aaa;">
                            <th style="text-align:left; padding:2px;">Sıra</th>
                            <th style="text-align:left; padding:2px;">Oyuncu</th>
                            <th style="text-align:right; padding:2px;">Toplam Puan</th>
                        </tr>
                        ${state.leaderboardData.map((p, i) => `
                            <tr style="border-bottom: 1px dotted #333; ${i === 0 ? 'color: #ffc107; font-weight:bold;' : ''}">
                                <td style="padding:2px;">${i === 0 ? '👑 1.' : (i+1)+'.'}</td>
                                <td style="padding:2px; text-overflow:ellipsis; overflow:hidden; max-width:90px;">${p.name}</td>
                                <td style="text-align:right; padding:2px;">${p.score} P</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `;
            if (isCreator) {
                lbHtml += `
                    <div style="margin-top:6px; display: flex; gap: 5px; justify-content: center; align-items:center;">
                        <button onclick="startGame()" style="background:#28a745; color:white; border:none; padding:4px 10px; border-radius:4px; font-size:10px; cursor:pointer; font-weight:bold;">Devam Et (Yeni Seri) 🚀</button>
                        <button onclick="returnToLobby()" style="background:#dc3545; color:white; border:none; padding:4px 10px; border-radius:4px; font-size:10px; cursor:pointer; font-weight:bold;">Lobiye Dön 🏠</button>
                    </div>
                    <div id="lbTimerText" style="font-size:9px; color:#ffc107; margin-top:3px;">Otomatik Devam Sayaç: 15s</div>
                `;
            } else {
                lbHtml += `<p style="font-size:10px; color:#aaa; margin-top:5px;">Kurucunun kararı bekleniyor (15s)...</p>`;
            }
            center.innerHTML = lbHtml;

            if (isCreator) {
                leaderboardTimerInterval = setInterval(() => {
                    lbTime--;
                    const tEl = document.getElementById('lbTimerText');
                    if (tEl) tEl.innerText = `Otomatik Devam Sayaç: ${lbTime}s`;
                    if (lbTime <= 0) { clearInterval(leaderboardTimerInterval); startGame(); }
                }, 1000);
            }

        } else if (state.gameState === "RESULTS" && state.winnerData) {
            center.classList.add("winner-silver-glow");
            let resHtml = `<h2 style="color:#c0c0c0; font-size:12px; margin:0; margin-bottom:5px;">🏆 ${state.isDuelRound ? 'DÜELLO' : state.roundCount + '. TUR'} KAZANANI 🏆</h2>`;
            
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
                resHtml += `<button onclick="nextRoundTrigger()" style="margin-top:8px; background:#e0e0e0; color:black; border:none; padding:5px 12px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold;">Sıradaki Tur 🚀</button>`;
            } else {
                resHtml += `<p style="font-size:9px; color:#aaa; margin-top:5px;">Kurucunun yeni turu başlatması bekleniyor...</p>`;
            }
            center.innerHTML = resHtml;
        } else {
            if (leaderboardTimerInterval) clearInterval(leaderboardTimerInterval);
            center.classList.remove("winner-silver-glow");
            
            let title = state.gameState === 'VOTING' ? '🔥 OYLAMA AŞAMASI 🔥' : (state.isDuelRound ? '⚔️ DÜELLO TURU ⚔️' : `TUR ${state.roundCount}`);
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

        const isVIP = (player.id === state.creatorId);
        let seatClass = "player-seat";
        
        if (state.submittedCardPlayerIds.includes(player.id)) seatClass += " submitted";
        if (state.isDuelRound && !state.duelists.includes(player.id)) seatClass += " non-duelist";

        let vipStyle = isVIP ? 'border: 2px solid #ffc107; box-shadow: 0 0 15px rgba(255, 193, 7, 0.6);' : '';
        let vipBadge = isVIP ? '<div style="position:absolute; top:-12px; right:-10px; font-size:18px; filter: drop-shadow(0 0 5px #ffc107);" title="VIP Kurucu">👑</div>' : '';

        pool.innerHTML += `
            <div class="${seatClass}" style="left: ${sX}px; top: ${sY}px; ${vipStyle}">
                ${vipBadge}
                <div style="font-size:10px; color:#ffc107;">${player.score} Puan</div>
                <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${player.name}</div>
            </div>
        `;

        let slotHtml = "";
        if (state.gameState === "PLAYING") {
            if (!(state.isDuelRound && !state.duelists.includes(player.id))) {
                if (state.submittedCardPlayerIds.includes(player.id)) {
                    slotHtml = `<div class="table-card-slot back-flipped" style="left: ${cX}px; top: ${cY}px; width: 80px; height: 115px;"></div>`;
                } else {
                    slotHtml = `<div class="table-card-slot" style="left: ${cX}px; top: ${cY}px; width: 80px; height: 115px;"></div>`;
                }
            }
        } 
        else if (state.gameState === "VOTING" || state.gameState === "RESULTS") {
            const vCard = state.votingCards[index];
            if (vCard) {
                slotHtml = `
                    <div class="table-card-slot has-card flip-animation" style="left: ${cX}px; top: ${cY}px; width: 80px; height: 115px; cursor: pointer; border: 2px solid #007bff;" 
                         onclick="${state.gameState === 'VOTING' ? `voteForCardOnTable('${vCard.submitId}')` : ''}">
                        <div style="width: 100%; height: 80px; background: ${vCard.card.color}; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            <img src="${vCard.card.url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/80?text=Meme'">
                        </div>
                        <div class="card-caption" style="font-size: 9px; padding: 2px; height: 32px; overflow: hidden;">${vCard.card.text}</div>
                    </div>
                `;
            }
        }
        pool.innerHTML += slotHtml;
    });

    renderMyHand(state.isDuelRound, state.duelists); 
});

function renderMyHand(isDuelRound = false, duelists = []) {
    const dock = document.getElementById('handDockZone');
    if (!dock) return;

    if (myRole !== 'player') {
        let specMsg = "Masadaki hareketleri yukardan izliyorsunuz.";
        if (currentGameState === "VOTING") specMsg = "✨ OYLAMA BAŞLADI! Masadaki kartlara tıklayarak oy verin!";
        dock.innerHTML = `<h3 style="color: #ffc107; margin:0;">🎥 Canlı İzleyici Stüdyosu</h3><p style="margin:0; font-size:12px; color:#aaa; margin-top:5px;">${specMsg}</p>`;
        return;
    }

    if (currentGameState === "PLAYING" && isDuelRound && !duelists.includes(socket.id)) {
        dock.innerHTML = `<h3 style="color: #dc3545; margin:0;">⚔️ UZATMA DÜELLOSUNU İZLİYORSUNUZ!</h3><p style="margin:0; font-size:12px; color:#aaa; margin-top:5px;">Sadece düellocular kart atabilir.</p>`;
        dock.style.pointerEvents = 'none';
        dock.style.opacity = '0.5';
        return;
    }

    dock.innerHTML = `
        <h4 style="margin: 0; color: #ffc107; font-size:13px;">🃏 Senin Kartların - Kart Sayısı: ${myCurrentCards.length}/5</h4>
        <div class="cards-flex">
            ${myCurrentCards.map(card => `
                <div class="meme-card" onclick="playCardDirect(${card.id})" style="cursor:pointer; width:80px; height:115px; background:#222; border-radius:5px; overflow:hidden; display:inline-block; border:1px solid #444; text-align:center;">
                    <div style="width: 100%; height: 75px; background: ${card.color}; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        <img src="${card.url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/80?text=Meme'">
                    </div>
                    <div class="card-text-node" style="font-size:9px; color:#fff; padding:2px; height:34px; overflow:hidden;">${card.text}</div>
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
    playSound('throw'); 
    socket.emit('playCard', { roomCode: currentRoomCode, cardId: cardId });
}

function voteForCardOnTable(submitId) {
    const pool = document.getElementById('seatsAndSlotsPool');
    if(pool) {
        pool.style.pointerEvents = 'none';
        pool.style.opacity = '0.7';
    }
    playSound('throw'); 
    socket.emit('castVote', { roomCode: currentRoomCode, submitId: submitId });
}

function nextRoundTrigger() {
    socket.emit('startGame', { roomCode: currentRoomCode });
}

function returnToLobby() {
    socket.emit('returnToLobby', { roomCode: currentRoomCode });
}

socket.on('timerTick', (data) => {
    const tBox = document.getElementById('liveTimer');
    if (tBox) {
        tBox.innerText = `⏳ Kalan Süre: ${data.timeLeft}s`;
        if(data.timeLeft <= 5) { 
            tBox.style.background = "#bd2130";
            tBox.style.transform = "scale(1.1)";
            playSound('tick'); 
        } else {
            tBox.style.background = "#dc3545";
            tBox.style.transform = "scale(1)";
        }
    }
});