import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { clone as cloneSkinnedMesh } from 'three/examples/jsm/utils/SkeletonUtils.js';

const UI_FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
document.title = 'Dino vs Kettle';

const style = document.createElement('style');
style.textContent = [
    '.dino-menu-button {',
    'position: relative;',
    'overflow: hidden;',
    'border: 1px solid rgba(255,255,255,0.22);',
    'color: #fff;',
    'font-family: ' + UI_FONT + ';',
    'font-size: 18px;',
    'font-weight: 900;',
    'padding: 13px 19px;',
    'border-radius: 8px;',
    'cursor: pointer;',
    'min-height: 48px;',
    'box-shadow: 0 10px 20px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.22);',
    'transition: transform 120ms ease, filter 120ms ease, box-shadow 120ms ease;',
    'text-shadow: 0 1px 2px rgba(0,0,0,0.5);',
    '}',
    '.dino-menu-button:hover { transform: translateY(-2px); filter: saturate(1.18) brightness(1.08); box-shadow: 0 14px 26px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3); }',
    '.dino-menu-button:active { transform: translateY(1px) scale(0.99); }',
    '.dino-field-label { color: #fff; font-family: ' + UI_FONT + '; font-weight: 900; text-shadow: 0 1px 2px rgba(0,0,0,0.45); }',
    '@keyframes scorePulse { 0% { transform: scale(1); } 35% { transform: scale(1.13); } 100% { transform: scale(1); } }',
    '@keyframes scoreFloat { 0% { opacity: 0; transform: translate(-50%, 18px) scale(0.72); } 18% { opacity: 1; transform: translate(-50%, 0) scale(1.16); } 74% { opacity: 1; transform: translate(-50%, -28px) scale(1); } 100% { opacity: 0; transform: translate(-50%, -70px) scale(0.92); } }',
    '@keyframes hitFlash { 0% { opacity: 0; } 18% { opacity: 1; } 100% { opacity: 0; } }',
    '@keyframes crosshairKick { 0% { transform: translate(-50%, -50%) scale(1); } 30% { transform: translate(-50%, -50%) scale(1.75); filter: brightness(1.8); } 100% { transform: translate(-50%, -50%) scale(1); } }',
    '@keyframes tutorialPulse { 0%,100% { box-shadow: 0 0 0 4px rgba(102,247,255,0.45),0 0 22px rgba(102,247,255,0.55); } 50% { box-shadow: 0 0 0 10px rgba(102,247,255,0.08),0 0 38px rgba(102,247,255,0.9); transform: scale(1.04); } }',
    '@keyframes upgradeDust { 0% { opacity: 0; transform: translate(0,0) scale(0.35); } 24% { opacity: 0.95; } 100% { opacity: 0; transform: translate(var(--dust-x),var(--dust-y)) scale(1.6); } }',
    '.mobile-control { position: fixed; z-index: 24; touch-action: none; user-select: none; -webkit-user-select: none; }',
    '.mobile-stick { left: max(18px, env(safe-area-inset-left)); bottom: max(22px, env(safe-area-inset-bottom)); width: 132px; height: 132px; border-radius: 50%; border: 2px solid rgba(255,255,255,.55); background: rgba(12,15,25,.48); }',
    '.mobile-stick-knob { position:absolute; left:42px; top:42px; width:48px; height:48px; border-radius:50%; background:#38d9ff; box-shadow:0 0 18px rgba(56,217,255,.65); }',
    '.mobile-look { right:0; bottom:0; width:50vw; height:72vh; }',
    '.mobile-action { width:68px; height:68px; border-radius:50%; border:2px solid rgba(255,255,255,.7); color:#fff; font:900 12px ' + UI_FONT + '; background:rgba(255,55,105,.82); }',
    '.mobile-fire { right:max(94px, calc(env(safe-area-inset-right) + 94px)); bottom:max(30px, env(safe-area-inset-bottom)); }',
    '.mobile-toggle { right:max(174px, calc(env(safe-area-inset-right) + 174px)); bottom:max(46px, calc(env(safe-area-inset-bottom) + 46px)); width:52px; height:52px; background:rgba(35,184,255,.82); }',
    '@media (max-width: 700px), (max-height: 430px) { .score-hint { display: none !important; } .game-score { top: 12px !important; left: 12px !important; } .game-room-status { top: 58px !important; } .game-leaderboard { left: 12px !important; max-height: calc(100vh - 178px) !important; } .weapon-status { right: 12px !important; bottom: 112px !important; } }'
].join('\n');
document.head.appendChild(style);

// 1. Setup UI Score Overlay
const scoreBoard = document.createElement('div');
scoreBoard.style.position = 'absolute';
scoreBoard.style.top = '20px';
scoreBoard.style.left = '20px';
scoreBoard.style.color = '#ffffff';
scoreBoard.style.fontFamily = UI_FONT;
scoreBoard.style.fontSize = '24px';
scoreBoard.style.fontWeight = 'bold';
scoreBoard.style.textShadow = '2px 2px 0px #000000, 0 0 16px rgba(255, 224, 120, 0.24)';
scoreBoard.style.userSelect = 'none';
scoreBoard.style.zIndex = '10';
scoreBoard.style.transformOrigin = 'left top';
scoreBoard.className = 'game-score';
scoreBoard.innerHTML = 'SCORE: 0 &nbsp; COINS: 0<br><span class="score-hint" style="font-size:13px;font-weight:normal;opacity:0.8;">[WASD/Arrows] Move • [Space/Enter] Throw Kettle</span>';
document.body.appendChild(scoreBoard);

const scoreBurstLayer = document.createElement('div');
scoreBurstLayer.style.position = 'absolute';
scoreBurstLayer.style.inset = '0';
scoreBurstLayer.style.zIndex = '11';
scoreBurstLayer.style.pointerEvents = 'none';
scoreBurstLayer.style.fontFamily = UI_FONT;
scoreBurstLayer.style.display = 'none';
document.body.appendChild(scoreBurstLayer);

const hitFlashLayer = document.createElement('div');
hitFlashLayer.style.position = 'absolute';
hitFlashLayer.style.inset = '0';
hitFlashLayer.style.pointerEvents = 'none';
hitFlashLayer.style.zIndex = '8';
hitFlashLayer.style.opacity = '0';
document.body.appendChild(hitFlashLayer);

const weaponStatus = document.createElement('div');
weaponStatus.style.position = 'absolute';
weaponStatus.style.right = '18px';
weaponStatus.style.bottom = '18px';
weaponStatus.style.zIndex = '13';
weaponStatus.style.padding = '9px 12px';
weaponStatus.style.border = '1px solid rgba(255,255,255,0.28)';
weaponStatus.style.borderRadius = '6px';
weaponStatus.style.background = 'rgba(18,15,25,0.82)';
weaponStatus.style.color = '#ffffff';
weaponStatus.style.fontFamily = UI_FONT;
weaponStatus.style.fontSize = '13px';
weaponStatus.style.fontWeight = '900';
weaponStatus.style.pointerEvents = 'none';
weaponStatus.style.display = 'none';
weaponStatus.className = 'weapon-status';
document.body.appendChild(weaponStatus);

let score = 0;
let gameStarted = false;
let advancedKettleAmmo = 0;
let advancedKettleSelected = false;
let lastLaunchAt = 0;

function updateWeaponStatus() {
    if (!gameStarted) {
        weaponStatus.style.display = 'none';
        return;
    }
    weaponStatus.style.display = 'block';
    weaponStatus.style.borderColor = advancedKettleSelected ? '#45f3ff' : 'rgba(255,255,255,0.28)';
    weaponStatus.style.color = advancedKettleSelected ? '#8ffaff' : '#ffffff';
    weaponStatus.textContent = advancedKettleSelected
        ? 'BOMB  x' + advancedKettleAmmo + '  [T]'
        : 'STANDARD KETTLE  |  Bombs x' + advancedKettleAmmo + '  [T]';
}

const roomStatus = document.createElement('div');
roomStatus.style.position = 'absolute';
roomStatus.style.top = '18px';
roomStatus.style.left = '50%';
roomStatus.style.transform = 'translateX(-50%)';
roomStatus.style.color = '#ffffff';
roomStatus.style.fontFamily = UI_FONT;
roomStatus.style.fontSize = '16px';
roomStatus.style.fontWeight = 'bold';
roomStatus.style.textShadow = '2px 2px 0px #000000';
roomStatus.style.zIndex = '10';
roomStatus.style.userSelect = 'none';
roomStatus.className = 'game-room-status';
roomStatus.textContent = 'Group: 1 player';
document.body.appendChild(roomStatus);

const activePlayersBadge = document.createElement('div');
activePlayersBadge.style.position = 'fixed';
activePlayersBadge.style.left = '50%';
activePlayersBadge.style.bottom = '16px';
activePlayersBadge.style.transform = 'translateX(-50%)';
activePlayersBadge.style.padding = '8px 14px';
activePlayersBadge.style.border = '1px solid rgba(255,255,255,0.2)';
activePlayersBadge.style.borderRadius = '999px';
activePlayersBadge.style.background = 'rgba(18,15,25,0.86)';
activePlayersBadge.style.color = '#dffcff';
activePlayersBadge.style.fontFamily = UI_FONT;
activePlayersBadge.style.fontSize = '13px';
activePlayersBadge.style.fontWeight = '900';
activePlayersBadge.style.letterSpacing = '0.04em';
activePlayersBadge.style.textShadow = '0 1px 3px #000';
activePlayersBadge.style.zIndex = '65';
activePlayersBadge.style.pointerEvents = 'none';
activePlayersBadge.textContent = 'ACTIVE PLAYERS: 0';
document.body.appendChild(activePlayersBadge);

function updateActivePlayersCount() {
    const count = onlinePlayers.length;
    activePlayersBadge.textContent = 'ACTIVE PLAYERS: ' + count;
}

const playerColors = [0xff4242, 0x2f80ff, 0x31c96b, 0xf0c84b, 0xb86bff, 0xff8a2a, 0x21c7c7, 0xff6fae, 0x8bc34a, 0x7c6cff, 0xe05d44, 0x3fada8, 0xd48cff, 0x91a7ff, 0xf4a261, 0x43aa8b, 0xf94144, 0x577590, 0xf8961e, 0x90be6d];
const PLAYER_COLOR_OPTIONS = [
    { id: 'blue', name: 'Blue', color: 0x2f80ff, price: 0 },
    { id: 'red', name: 'Red', color: 0xff4242, price: 0 },
    { id: 'green', name: 'Green', color: 0x31c96b, price: 0 },
    { id: 'gold', name: 'Gold', color: 0xf0c84b, price: 250 },
    { id: 'purple', name: 'Purple', color: 0xb86bff, price: 500 },
    { id: 'orange', name: 'Orange', color: 0xff8a2a, price: 800 },
    { id: 'cyan', name: 'Cyan', color: 0x21c7c7, price: 1200 },
    { id: 'pink', name: 'Pink', color: 0xff6fae, price: 1700 },
    { id: 'lime', name: 'Lime', color: 0x8bc34a, price: 2300 },
    { id: 'indigo', name: 'Indigo', color: 0x7c6cff, price: 3000 },
    { id: 'coral', name: 'Coral', color: 0xe05d44, price: 3900 },
    { id: 'teal', name: 'Teal', color: 0x3fada8, price: 5000 },
    { id: 'lilac', name: 'Lilac', color: 0xd48cff, price: 6500 },
    { id: 'sky', name: 'Sky', color: 0x91a7ff, price: 8000 }
];
const FREE_PLAYER_COLORS = PLAYER_COLOR_OPTIONS.filter((option) => option.price === 0).map((option) => option.id);
const remotePlayers = new Map();
let localPlayerId = `LOCAL-${Math.random().toString(36).slice(2, 8)}`;
let localPlayerColor = playerColors[Math.floor(Math.random() * playerColors.length)];
let currentRoom = null;
let multiplayerSocket = null;
let pendingRoomResumeState = null;
let lastNetworkSend = 0;
let localSpawnIndex = 0;
const UPGRADES = [
    { id: 'kettleSize', name: 'Bigger Kettles', description: 'Wider kettles are easier to land.', basePrice: 100 },
    { id: 'moveSpeed', name: 'Faster Feet', description: 'Move faster across the arena.', basePrice: 175 },
    { id: 'kettlePower', name: 'Stronger Kettles', description: 'Each hit removes more dinosaur HP.', basePrice: 250 }
];
const TEAM_NAMES = Array.from({ length: 20 }, (_, index) => 'team-' + (index + 1));
const TEAM_PALETTE = [0xff4242, 0x2f80ff, 0x31c96b, 0xf0c84b, 0xb86bff, 0xff8a2a, 0x21c7c7, 0xff6fae, 0x8bc34a, 0x7c6cff, 0xe05d44, 0x3fada8, 0xd48cff, 0x91a7ff, 0xf4a261, 0x43aa8b, 0xf94144, 0x577590, 0xf8961e, 0x90be6d];
let roomPlayers = [];
let teamAssignments = {};
let gameMode = 'solo';
let aiDifficulty = 'medium';
let matchDuration = 180;
let matchTimer = 0;
let matchActive = false;
let matchEnded = false;
let localDefeats = 0;
let aiDefeats = 0;
let lastHitNotice = 0;
let lastHitText = 'DIRECT HIT! +10 COINS';
let teamMessage = '';
let teamRequests = [];
let onlinePlayers = [];
let inviteMessage = '';
let profileButton;
let gameBackButton;
let fullscreenButton;
let inviteLayer;
let leaderboard;
let aiPlayer = null;
const playerStats = new Map();
let pendingProfileReveal = null;
let profileNotice = '';
let tournamentBracket = null;
let pendingColorOption = null;
let tutorialActive = false;
let tutorialStage = '';
let tutorialOverlay = null;
let tutorialFrozenDino = null;

function readCookie(name) {
    try {
        const prefix = encodeURIComponent(name) + '=';
        return document.cookie.split('; ').find((part) => part.startsWith(prefix))?.slice(prefix.length) || '';
    } catch {
        return '';
    }
}

function writeCookie(name, value) {
    try {
        document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + '; path=/; max-age=31536000; SameSite=Lax';
    } catch {
        // Cookies can be disabled too; the in-memory profile still works.
    }
}

function loadCookieProfile() {
    try {
        return JSON.parse(decodeURIComponent(readCookie('dinoVsKettleProfile') || ''));
    } catch {
        return {};
    }
}

function storageAvailable() {
    try {
        const key = '__dino_storage_test__';
        window.localStorage.setItem(key, key);
        window.localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

const canUseStorage = storageAvailable();
const isFirstVisit = !readCookie('dinoVsKettleProfile') && (() => {
    try { return !canUseStorage || !window.localStorage.getItem('dinoVsKettleProfile'); }
    catch { return true; }
})();

function normalizeUpgrades(savedUpgrades = {}) {
    const result = {};
    UPGRADES.forEach((upgrade) => {
        const level = Number(savedUpgrades[upgrade.id] || 0);
        result[upgrade.id] = Math.max(0, Number.isFinite(level) ? Math.floor(level) : 0);
    });
    return result;
}

function normalizeUnlockedColors(savedColors = []) {
    const validIds = new Set(PLAYER_COLOR_OPTIONS.map((option) => option.id));
    return [...new Set([...FREE_PLAYER_COLORS, ...(Array.isArray(savedColors) ? savedColors : [])])]
        .filter((id) => validIds.has(id));
}

function colorOption(id) {
    return PLAYER_COLOR_OPTIONS.find((option) => option.id === id) || PLAYER_COLOR_OPTIONS[0];
}

function upgradeLevel(id) {
    return playerProfile.upgrades?.[id] || 0;
}

function upgradeCost(upgrade) {
    const level = upgradeLevel(upgrade.id);
    return Math.round(upgrade.basePrice * Math.pow(1.38, level));
}

function kettleSizeMultiplier() {
    return 1 + Math.sqrt(upgradeLevel('kettleSize')) * 0.09;
}

function playerMoveSpeed() {
    return PLAYER_MOVE_SPEED * (1 + Math.sqrt(upgradeLevel('moveSpeed')) * 0.06);
}

function kettleHitDamage() {
    return 25 + Math.sqrt(upgradeLevel('kettlePower')) * 6;
}

function loadProfile() {
    try {
        const saved = canUseStorage
            ? JSON.parse(window.localStorage.getItem('dinoVsKettleProfile') || '{}')
            : loadCookieProfile();
        return {
            name: typeof saved.name === 'string' && saved.name.trim() ? saved.name.trim().slice(0, 16) : 'Player',
            coins: Number.isFinite(saved.coins) ? saved.coins : 0,
            advancedKettles: Number.isFinite(saved.advancedKettles) ? Math.max(0, Math.floor(saved.advancedKettles)) : 0,
            upgrades: normalizeUpgrades(saved.upgrades),
            colorId: colorOption(saved.colorId).id,
            unlockedColors: normalizeUnlockedColors(saved.unlockedColors),
            tutorialComplete: Boolean(saved.tutorialComplete),
            profileId: typeof saved.profileId === 'string' ? saved.profileId : 'U-' + Math.random().toString(36).slice(2, 10),
            recentPlayers: Array.isArray(saved.recentPlayers) ? saved.recentPlayers.slice(0, 12) : []
        };
    } catch {
        const cookieProfile = loadCookieProfile();
        return {
            name: typeof cookieProfile.name === 'string' && cookieProfile.name.trim() ? cookieProfile.name.trim().slice(0, 16) : 'Player',
            coins: Number.isFinite(cookieProfile.coins) ? cookieProfile.coins : 0,
            advancedKettles: Number.isFinite(cookieProfile.advancedKettles) ? Math.max(0, Math.floor(cookieProfile.advancedKettles)) : 0,
            upgrades: normalizeUpgrades(cookieProfile.upgrades),
            colorId: colorOption(cookieProfile.colorId).id,
            unlockedColors: normalizeUnlockedColors(cookieProfile.unlockedColors),
            tutorialComplete: Boolean(cookieProfile.tutorialComplete),
            profileId: typeof cookieProfile.profileId === 'string' ? cookieProfile.profileId : 'U-' + Math.random().toString(36).slice(2, 10),
            recentPlayers: Array.isArray(cookieProfile.recentPlayers) ? cookieProfile.recentPlayers.slice(0, 12) : []
        };
    }
}
let playerProfile = loadProfile();
localPlayerColor = colorOption(playerProfile.colorId).color;
advancedKettleAmmo = playerProfile.advancedKettles;
function saveProfile() {
    const serialized = JSON.stringify(playerProfile);
    writeCookie('dinoVsKettleProfile', serialized);
    try {
        if (canUseStorage) window.localStorage.setItem('dinoVsKettleProfile', serialized);
    } catch {
        // Incognito/private modes may block writes. Keep the in-memory profile playable.
    }
}

function rememberPlayerName(name) {
    const clean = String(name || '').trim().slice(0, 16);
    if (!clean || clean === playerProfile.name) return;
    playerProfile.recentPlayers = [clean, ...(playerProfile.recentPlayers || []).filter((item) => item !== clean)].slice(0, 12);
    saveProfile();
}
function safePlayerName(name) {
    const blocked = ['fuck', 'shit', 'bitch', 'cunt', 'nigger', 'nigga', 'faggot', 'rape', 'sex', 'porn', 'nazi'];
    const clean = String(name || '').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 16);
    const compact = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean && !blocked.some((word) => compact.includes(word)) ? clean : 'Player';
}
function addCoins(amount) { playerProfile.coins += amount; saveProfile(); }
function buyUpgrade(upgrade) {
    const level = upgradeLevel(upgrade.id);
    const cost = upgradeCost(upgrade);
    if (playerProfile.coins < cost) return false;
    playerProfile.coins -= cost;
    playerProfile.upgrades[upgrade.id] = level + 1;
    saveProfile();
    return true;
}
function setStat(id, patch) {
    const previous = playerStats.get(id) || { name: id, score: 0, defeats: 0, color: localPlayerColor, team: null };
    playerStats.set(id, { ...previous, ...patch });
}

const hpLayer = document.createElement('div');
hpLayer.style.position = 'absolute';
hpLayer.style.inset = '0';
hpLayer.style.pointerEvents = 'none';
hpLayer.style.zIndex = '9';
hpLayer.style.display = 'none';
document.body.appendChild(hpLayer);

function createHpBar() {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.width = '96px';
    wrapper.style.transform = 'translate(-50%, -100%)';
    wrapper.style.fontFamily = UI_FONT;
    wrapper.style.textAlign = 'center';
    wrapper.style.color = '#f7fff7';
    wrapper.style.textShadow = '0 1px 3px #000000';
    wrapper.style.userSelect = 'none';

    const label = document.createElement('div');
    label.textContent = 'TRICERA HP';
    label.style.fontSize = '10px';
    label.style.fontWeight = '800';
    label.style.marginBottom = '3px';

    const track = document.createElement('div');
    track.style.height = '8px';
    track.style.border = '1px solid rgba(255,255,255,0.85)';
    track.style.background = 'rgba(18, 12, 24, 0.82)';
    track.style.boxShadow = '0 2px 8px rgba(0,0,0,0.45)';
    track.style.overflow = 'hidden';

    const fill = document.createElement('div');
    fill.style.height = '100%';
    fill.style.width = '100%';
    fill.style.background = 'linear-gradient(90deg, #35e06f 0%, #e4f45c 62%, #ff3434 100%)';
    track.appendChild(fill);

    wrapper.append(label, track);
    hpLayer.appendChild(wrapper);
    return { wrapper, fill };
}

function updateHpBar(dino) {
    const hpBar = dino.userData.hpBar;
    if (!hpBar) return;

    const hpPercent = Math.max(0, dino.userData.hp / dino.userData.maxHp);
    const screenPos = new THREE.Vector3(dino.position.x, dino.position.y + 3.6, dino.position.z);
    screenPos.project(camera);

    const canvasRect = renderer.domElement.getBoundingClientRect();
    const screenX = canvasRect.left + (screenPos.x * 0.5 + 0.5) * canvasRect.width;
    const screenY = canvasRect.top + (-screenPos.y * 0.5 + 0.5) * canvasRect.height;

    const visible = gameStarted
        && dino.visible
        && screenPos.z < 1 && screenPos.z > -1
        && screenX >= -48 && screenX <= window.innerWidth + 48
        && screenY >= -18 && screenY <= window.innerHeight + 18;
    hpBar.wrapper.style.display = visible ? 'block' : 'none';
    if (!visible) return;

    hpBar.wrapper.style.left = `${screenX}px`;
    hpBar.wrapper.style.top = `${screenY}px`;
    hpBar.fill.style.width = `${hpPercent * 100}%`;
    hpBar.fill.style.background = hpPercent > 0.5
        ? 'linear-gradient(90deg, #35e06f 0%, #e4f45c 62%, #ff3434 100%)'
        : hpPercent > 0.25
            ? 'linear-gradient(90deg, #f5b642 0%, #ffe066 58%, #ff3434 100%)'
            : 'linear-gradient(90deg, #ff4545, #ff1f1f)';
}

// 2. Setup HTML/CSS Crosshair UI Element
const crosshair = document.createElement('div');
crosshair.style.position = 'absolute';
crosshair.style.width = '20px';
crosshair.style.height = '20px';
crosshair.style.border = '2px solid #ff3366';
crosshair.style.borderRadius = '50%';
crosshair.style.transform = 'translate(-50%, -50%)';
crosshair.style.pointerEvents = 'none';
crosshair.style.zIndex = '10';

let crosshairX = window.innerWidth / 2;
let crosshairY = window.innerHeight / 2;
crosshair.style.left = `${crosshairX}px`;
crosshair.style.top = `${crosshairY}px`;

const dot = document.createElement('div');
dot.style.position = 'absolute';
dot.style.width = '4px';
dot.style.height = '4px';
dot.style.background = '#ff3366';
dot.style.borderRadius = '50%';
dot.style.left = '50%';
dot.style.top = '50%';
dot.style.transform = 'translate(-50%, -50%)';
crosshair.appendChild(dot);
document.body.appendChild(crosshair);

function resetMovementInput() {
    Object.keys(keysPressed).forEach((code) => { keysPressed[code] = false; });
}
scoreBoard.style.display = 'none';
roomStatus.style.display = 'none';
crosshair.style.display = 'none';

const homeScreen = document.createElement('div');
homeScreen.style.position = 'absolute';
homeScreen.style.inset = '0';
homeScreen.style.zIndex = '30';
homeScreen.style.display = 'flex';
homeScreen.style.alignItems = 'center';
homeScreen.style.justifyContent = 'center';
homeScreen.style.background = '#15111f';
homeScreen.style.color = '#ffffff';
homeScreen.style.fontFamily = UI_FONT;
document.body.appendChild(homeScreen);

const keyboardUnavailable = false;
const useMobileControls = (navigator.maxTouchPoints || 0) > 0
    || (window.matchMedia?.('(pointer: coarse)').matches ?? false);
let mobileMoveX = 0;
let mobileMoveZ = 0;
const NETWORK_UPDATE_INTERVAL = 0.1;

const mobileStick = document.createElement('div');
mobileStick.className = 'mobile-control mobile-stick';
const mobileStickKnob = document.createElement('div');
mobileStickKnob.className = 'mobile-stick-knob';
mobileStick.appendChild(mobileStickKnob);
const mobileLook = document.createElement('div');
mobileLook.className = 'mobile-control mobile-look';
const mobileFire = document.createElement('button');
mobileFire.className = 'mobile-control mobile-action mobile-fire';
mobileFire.textContent = 'THROW';
const mobileToggle = document.createElement('button');
mobileToggle.className = 'mobile-control mobile-action mobile-toggle';
mobileToggle.textContent = 'BOMB';
[mobileStick, mobileLook, mobileFire, mobileToggle].forEach((control) => {
    control.style.display = 'none';
    document.body.appendChild(control);
});

function updateMobileControls() {
    const display = useMobileControls && gameStarted ? 'block' : 'none';
    [mobileStick, mobileLook, mobileFire, mobileToggle].forEach((control) => { control.style.display = display; });
}

function resetMobileStick() {
    mobileMoveX = 0;
    mobileMoveZ = 0;
    mobileStickKnob.style.transform = 'translate(0, 0)';
}

mobileStick.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    mobileStick.setPointerCapture(event.pointerId);
});
mobileStick.addEventListener('pointermove', (event) => {
    if (!mobileStick.hasPointerCapture(event.pointerId)) return;
    const rect = mobileStick.getBoundingClientRect();
    let x = event.clientX - rect.left - rect.width / 2;
    let y = event.clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(x, y);
    const radius = 42;
    if (distance > radius) { x *= radius / distance; y *= radius / distance; }
    mobileMoveX = x / radius;
    mobileMoveZ = -y / radius;
    mobileStickKnob.style.transform = `translate(${x}px, ${y}px)`;
});
mobileStick.addEventListener('pointerup', resetMobileStick);
mobileStick.addEventListener('pointercancel', resetMobileStick);

let mobileLookX = 0;
let mobileLookY = 0;
mobileLook.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    mobileLook.setPointerCapture(event.pointerId);
    mobileLookX = event.clientX;
    mobileLookY = event.clientY;
});
mobileLook.addEventListener('pointermove', (event) => {
    event.preventDefault();
    if (!mobileLook.hasPointerCapture(event.pointerId)) return;
    cameraYaw -= (event.clientX - mobileLookX) * 0.006;
    cameraPitch = THREE.MathUtils.clamp(cameraPitch - (event.clientY - mobileLookY) * 0.006, -0.72, 0.35);
    mobileLookX = event.clientX;
    mobileLookY = event.clientY;
});
mobileFire.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    launchHeldKettle();
});
mobileToggle.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    if (advancedKettleAmmo <= 0) { showScoreBurst('NO BOMBS', '#8da4c7'); return; }
    advancedKettleSelected = !advancedKettleSelected;
    updateHeldKettleStyle();
    updateWeaponStatus();
});

function homeButton(label) {
    const button = document.createElement('button');
    button.textContent = label;
    button.className = 'dino-menu-button';
    const lower = label.toLowerCase();
    let gradient = 'linear-gradient(135deg, #3657ff, #28b8ff)';
    if (lower.includes('start') || lower.includes('create')) gradient = 'linear-gradient(135deg, #16a34a, #8bd450)';
    if (lower.includes('team') || lower.includes('random')) gradient = 'linear-gradient(135deg, #ff7a18, #ff3d81)';
    if (lower.includes('private') || lower.includes('profile')) gradient = 'linear-gradient(135deg, #7c3aed, #2dd4bf)';
    if (lower.includes('join') || lower.includes('copy')) gradient = 'linear-gradient(135deg, #2563eb, #06b6d4)';
    if (lower.includes('back') || lower.includes('close')) gradient = 'linear-gradient(135deg, #475569, #64748b)';
    button.style.background = gradient;
    return button;
}

function roomCodeText(code) {
    return code ? code : '------';
}

function makeNumberInput(label, value, min, max) {
    const wrap = document.createElement('label');
    wrap.textContent = label;
    wrap.className = 'dino-field-label';
    wrap.style.display = 'grid';
    wrap.style.gap = '6px';
    wrap.style.fontWeight = '900';
    const input = document.createElement('input');
    input.type = 'number';
    input.min = min;
    input.max = max;
    input.value = value;
    input.style.padding = '12px';
    input.style.borderRadius = '8px';
    input.style.border = '1px solid rgba(255,255,255,0.24)';
    input.style.background = 'linear-gradient(135deg, #120f19, #211b2c)';
    input.style.color = '#ffffff';
    input.style.fontFamily = UI_FONT;
    wrap.appendChild(input);
    input.wrapper = wrap;
    return input;
}

function makeTimerOption(label = 'Enable timer') {
    const wrap = document.createElement('label');
    wrap.className = 'dino-field-label';
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '10px';
    wrap.style.margin = '10px 0';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.width = '20px';
    checkbox.style.height = '20px';
    const text = document.createElement('span');
    text.textContent = label;
    const seconds = makeNumberInput('Seconds', 180, 60, 900);
    seconds.wrapper.style.display = 'none';
    seconds.wrapper.style.maxWidth = '220px';
    checkbox.onchange = () => { seconds.wrapper.style.display = checkbox.checked ? 'grid' : 'none'; };
    wrap.append(checkbox, text);
    return { wrapper: wrap, checkbox, seconds };
}

function makeSelect(label, options) {
    const wrap = document.createElement('label');
    wrap.textContent = label;
    wrap.className = 'dino-field-label';
    wrap.style.display = 'grid';
    wrap.style.gap = '6px';
    wrap.style.fontWeight = '900';
    const select = document.createElement('select');
    select.style.padding = '12px';
    select.style.borderRadius = '8px';
    select.style.border = '1px solid rgba(255,255,255,0.24)';
    select.style.background = '#120f19';
    select.style.color = '#ffffff';
    select.style.fontFamily = UI_FONT;
    options.forEach((option) => {
        const item = document.createElement('option');
        item.value = option;
        item.textContent = option;
        select.appendChild(item);
    });
    wrap.appendChild(select);
    select.wrapper = wrap;
    return select;
}

function fillInviteNames(datalist) {
    const selectedName = datalist.value;
    datalist.innerHTML = '';
    const prompt = document.createElement('option');
    prompt.value = '';
    prompt.textContent = 'Select a player';
    prompt.disabled = true;
    prompt.selected = true;
    datalist.appendChild(prompt);
    [...(playerProfile.recentPlayers || []), ...onlinePlayers.map((player) => player.name)]
        .filter(Boolean)
        .filter((name, index, list) => list.indexOf(name) === index && name !== playerProfile.name)
        .sort((first, second) => first.localeCompare(second, undefined, { sensitivity: 'base' }))
        .forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            datalist.appendChild(option);
        });
    if ([...datalist.options].some((option) => option.value === selectedName)) datalist.value = selectedName;
}

function showInviteDialog(parentDialog = null) {
    if (!currentRoom) {
        inviteMessage = 'Create or join a room before inviting someone.';
        renderInviteLayer();
        return;
    }
    connectMultiplayer(() => sendMultiplayer({ type: 'listPlayers' }));

    const dialog = document.createElement('div');
    dialog.style.position = 'absolute';
    dialog.style.inset = '0';
    dialog.style.zIndex = '85';
    dialog.style.display = 'flex';
    dialog.style.alignItems = 'center';
    dialog.style.justifyContent = 'center';
    dialog.style.background = 'rgba(0,0,0,0.62)';
    document.body.appendChild(dialog);
    dialog.addEventListener('pointerdown', (event) => event.stopPropagation());
    dialog.addEventListener('click', (event) => event.stopPropagation());
    dialog.addEventListener('keydown', (event) => event.stopPropagation());

    const box = document.createElement('div');
    box.style.width = 'min(760px, calc(100vw - 28px))';
    box.style.background = '#211b2c';
    box.style.border = '1px solid #6d6478';
    box.style.borderRadius = '8px';
    box.style.padding = '20px';
    box.style.boxSizing = 'border-box';
    box.style.maxHeight = 'calc(100vh - 24px)';
    box.style.overflowY = 'auto';
    box.style.color = '#fff';
    box.style.fontFamily = UI_FONT;
    dialog.appendChild(box);

    const title = document.createElement('div');
    title.textContent = 'Invite a person';
    title.style.fontSize = '24px';
    title.style.fontWeight = '900';
    title.style.marginBottom = '12px';
    box.appendChild(title);

    const roomCodes = document.createElement('datalist');
    roomCodes.id = 'invite-codes-' + Math.random().toString(36).slice(2);
    [currentRoom, ...latestRooms].filter(Boolean).forEach((room) => {
        const option = document.createElement('option');
        option.value = room.code;
        option.label = (room.kind === 'team' ? 'Team' : 'Single') + ' - ' + room.players + ' players';
        roomCodes.appendChild(option);
    });
    box.appendChild(roomCodes);

    const person = document.createElement('select');
    person.dataset.inviteNames = 'true';
    person.style.width = '100%';
    person.style.boxSizing = 'border-box';
    person.style.marginBottom = '10px';
    person.style.padding = '12px';
    person.style.borderRadius = '8px';
    person.style.border = '1px solid #6d6478';
    person.style.background = '#120f19';
    person.style.color = '#fff';
    person.style.fontFamily = UI_FONT;
    fillInviteNames(person);
    box.appendChild(person);

    const code = document.createElement('input');
    code.placeholder = 'Game code';
    code.setAttribute('list', roomCodes.id);
    code.value = currentRoom?.code || '';
    code.style.width = '100%';
    code.style.boxSizing = 'border-box';
    code.style.marginBottom = '12px';
    code.style.padding = '12px';
    code.style.borderRadius = '8px';
    code.style.border = '1px solid #6d6478';
    code.style.background = '#120f19';
    code.style.color = '#fff';
    code.style.fontFamily = UI_FONT;
    box.appendChild(code);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.flexWrap = 'wrap';
    box.appendChild(row);
    const invite = homeButton('Invite');
    const close = homeButton('Close');
    row.append(invite, close);
    invite.onclick = () => {
        if (!person.value) return;
        rememberPlayerName(person.value);
        sendMultiplayer({ type: 'invitePlayer', targetName: person.value, code: code.value });
        dialog.remove();
        if (parentDialog) parentDialog.remove();
    };
    close.onclick = () => dialog.remove();
}

function renderInviteLayer() {
    if (!inviteLayer) return;
    inviteLayer.innerHTML = '';
    if (!inviteMessage) return;
    const card = document.createElement('div');
    card.style.width = 'min(320px, calc(100vw - 36px))';
    card.style.padding = '12px';
    card.style.border = '1px solid rgba(255,255,255,0.24)';
    card.style.background = 'rgba(25,18,35,0.94)';
    card.style.color = '#fff';
    card.style.fontFamily = UI_FONT;
    card.style.borderRadius = '8px';
    card.textContent = inviteMessage;
    const close = homeButton('Close');
    close.style.marginTop = '10px';
    close.onclick = () => { inviteMessage = ''; renderInviteLayer(); };
    card.appendChild(document.createElement('br'));
    card.appendChild(close);
    inviteLayer.appendChild(card);
}

function showInviteReceived(message) {
    if (!inviteLayer) return;
    const card = document.createElement('div');
    card.style.width = 'min(340px, calc(100vw - 36px))';
    card.style.padding = '12px';
    card.style.border = '1px solid rgba(255,255,255,0.24)';
    card.style.background = 'rgba(25,18,35,0.96)';
    card.style.color = '#fff';
    card.style.fontFamily = UI_FONT;
    card.style.borderRadius = '8px';
    const sender = document.createElement('strong');
    sender.textContent = message.from;
    card.append(sender, document.createTextNode(' invited you to ' + message.code));
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.marginTop = '10px';
    const accept = homeButton('Accept');
    const decline = homeButton('Decline');
    row.append(accept, decline);
    card.appendChild(row);
    accept.onclick = () => {
        gameStarted = false;
        matchActive = false;
        updateMobileControls();
        homeScreen.style.display = 'flex';
        scoreBoard.style.display = 'none';
        scoreBurstLayer.style.display = 'none';
        roomStatus.style.display = 'none';
        crosshair.style.display = 'none';
        hpLayer.style.display = 'none';
        leaderboard.style.display = 'none';
        if (gameBackButton) gameBackButton.style.display = 'none';
        resetMovementInput();
        sendMultiplayer({ type: 'inviteResponse', inviterId: message.fromId, accepted: true, code: message.code });
        sendMultiplayer({ type: 'joinRoom', code: message.code });
        card.remove();
    };
    decline.onclick = () => {
        sendMultiplayer({ type: 'inviteResponse', inviterId: message.fromId, accepted: false, code: message.code });
        card.remove();
    };
    inviteLayer.appendChild(card);
}

function showProfileDialog() {
    const exitWasDisabled = Boolean(gameBackButton?.disabled);
    if (gameBackButton) gameBackButton.disabled = true;
    if (profileButton) profileButton.disabled = true;
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.inset = '0';
    dialog.style.zIndex = '100';
    dialog.style.display = 'flex';
    dialog.style.alignItems = 'center';
    dialog.style.justifyContent = 'center';
    dialog.style.background = 'rgba(0,0,0,0.62)';
    document.body.appendChild(dialog);
    dialog.addEventListener('pointerdown', (event) => event.stopPropagation());
    dialog.addEventListener('click', (event) => event.stopPropagation());
    dialog.addEventListener('keydown', (event) => event.stopPropagation());

    const box = document.createElement('div');
    box.style.width = 'min(760px, calc(100vw - 28px))';
    box.style.background = '#211b2c';
    box.style.border = '1px solid #6d6478';
    box.style.borderRadius = '8px';
    box.style.padding = '20px';
    box.style.boxSizing = 'border-box';
    box.style.maxHeight = 'calc(100vh - 24px)';
    box.style.overflowY = 'auto';
    box.style.color = '#fff';
    box.style.fontFamily = UI_FONT;
    dialog.appendChild(box);

    const title = document.createElement('div');
    title.textContent = 'Profile';
    title.style.fontSize = '26px';
    title.style.fontWeight = '900';
    title.style.marginBottom = '12px';
    box.appendChild(title);

    const name = document.createElement('input');
    name.type = 'text';
    name.value = playerProfile.name;
    name.maxLength = 16;
    name.autocomplete = 'nickname';
    name.style.width = '100%';
    name.style.boxSizing = 'border-box';
    name.style.marginBottom = '12px';
    name.style.padding = '10px';
    name.style.borderRadius = '6px';
    name.style.border = '1px solid #6d6478';
    name.style.background = '#120f19';
    name.style.color = '#ffffff';
    name.style.fontFamily = UI_FONT;
    name.addEventListener('pointerdown', (event) => event.stopPropagation());
    name.addEventListener('click', (event) => event.stopPropagation());
    name.addEventListener('keydown', (event) => event.stopPropagation());
    box.appendChild(name);
    setTimeout(() => name.focus(), 0);

    const coins = document.createElement('div');
    coins.textContent = 'Coins: ' + playerProfile.coins;
    coins.style.fontWeight = '850';
    coins.style.marginBottom = '12px';
    box.appendChild(coins);

    if (profileNotice) {
        const notice = document.createElement('div');
        notice.textContent = profileNotice;
        notice.style.marginBottom = '12px';
        notice.style.padding = '9px 11px';
        notice.style.border = '1px solid #35e9ff';
        notice.style.borderRadius = '6px';
        notice.style.background = '#0d2830';
        notice.style.color = '#9ffaff';
        notice.style.fontWeight = '900';
        box.appendChild(notice);
        profileNotice = '';
    }

    const colorTitle = document.createElement('div');
    colorTitle.textContent = 'Player colour';
    colorTitle.style.fontWeight = '900';
    colorTitle.style.marginBottom = '8px';
    box.appendChild(colorTitle);

    const colorLocked = Boolean(currentRoom && (currentRoom.kind === 'team' || currentRoom.kind === 'tournament'));
    if (colorLocked) {
        const lockNotice = document.createElement('div');
        lockNotice.textContent = 'Your colour is locked to your team for this game.';
        lockNotice.style.marginBottom = '10px';
        lockNotice.style.color = '#ffe66d';
        lockNotice.style.fontWeight = '800';
        box.appendChild(lockNotice);
    }

    const colorPicker = document.createElement('div');
    colorPicker.style.display = 'flex';
    colorPicker.style.gap = '12px';
    colorPicker.style.flexWrap = 'wrap';
    colorPicker.style.marginBottom = '14px';
    box.appendChild(colorPicker);

    PLAYER_COLOR_OPTIONS.forEach((option) => {
        const unlocked = playerProfile.unlockedColors.includes(option.id);
        const selected = playerProfile.colorId === option.id;
        const usedByAnotherPlayer = currentRoom?.kind === 'classic'
            && roomPlayers.some((player) => player.id !== localPlayerId && player.color === option.color);
        const choice = document.createElement('button');
        choice.type = 'button';
        choice.title = selected ? option.name + ' selected' : (unlocked ? 'Use ' + option.name : 'Unlock ' + option.name + ' for ' + option.price + ' coins');
        choice.setAttribute('aria-label', choice.title);
        choice.style.width = '42px';
        choice.style.height = '42px';
        choice.style.borderRadius = '50%';
        choice.style.border = selected ? '4px solid #ffffff' : '2px solid rgba(255,255,255,0.42)';
        choice.style.background = '#' + option.color.toString(16).padStart(6, '0');
        choice.style.boxShadow = selected ? '0 0 0 3px #35e9ff' : 'inset 0 1px 5px rgba(255,255,255,0.35)';
        choice.disabled = colorLocked || usedByAnotherPlayer;
        choice.style.opacity = choice.disabled ? '0.45' : '1';
        choice.style.cursor = !choice.disabled && (unlocked || playerProfile.coins >= option.price) ? 'pointer' : 'not-allowed';
        choice.style.position = 'relative';
        if (!unlocked) {
            const price = document.createElement('span');
            price.textContent = option.price;
            price.style.position = 'absolute';
            price.style.left = '50%';
            price.style.top = '50%';
            price.style.transform = 'translate(-50%, -50%)';
            price.style.padding = '2px 4px';
            price.style.borderRadius = '4px';
            price.style.background = 'rgba(0,0,0,0.72)';
            price.style.color = '#fff';
            price.style.fontSize = '10px';
            price.style.fontWeight = '900';
            price.style.pointerEvents = 'none';
            choice.appendChild(price);
        }
        choice.onclick = () => {
            if (colorLocked) return;
            if (usedByAnotherPlayer) {
                profileNotice = 'That colour is already being used in this room.';
                closeProfile();
                showProfileDialog();
                return;
            }
            if (!unlocked) {
                if (playerProfile.coins < option.price) return;
                playerProfile.coins -= option.price;
                playerProfile.unlockedColors.push(option.id);
            }
            if (currentRoom?.kind === 'classic') {
                pendingColorOption = option;
                saveProfile();
                sendMultiplayer({ type: 'setColor', color: option.color, colorId: option.id });
                closeProfile();
                return;
            }
            playerProfile.colorId = option.id;
            localPlayerColor = option.color;
            saveProfile();
            updateHeldKettleStyle();
            sendMultiplayer({ type: 'registerPresence' });
            pendingProfileReveal = 'player';
            closeProfile();
            showProfileDialog();
        };
        colorPicker.appendChild(choice);
    });

    const profileContent = document.createElement('div');
    profileContent.style.display = 'grid';
    profileContent.style.gridTemplateColumns = 'repeat(auto-fit, minmax(230px, 1fr))';
    profileContent.style.gap = '14px';
    profileContent.style.alignItems = 'stretch';
    box.appendChild(profileContent);

    const upgrades = document.createElement('div');
    upgrades.style.display = 'grid';
    upgrades.style.gridTemplateColumns = '1fr';
    upgrades.style.gap = '10px';
    profileContent.appendChild(upgrades);

    UPGRADES.forEach((upgrade) => {
        const level = upgradeLevel(upgrade.id);
        const card = document.createElement('div');
        card.style.padding = '12px';
        card.style.border = '1px solid #40364d';
        card.style.borderRadius = '8px';
        card.style.background = '#120f19';
        const title = document.createElement('div');
        title.textContent = upgrade.name + ' - Lvl. ' + level;
        title.style.fontWeight = '900';
        title.style.marginBottom = '5px';
        const detail = document.createElement('div');
        detail.textContent = upgrade.description;
        detail.style.fontSize = '13px';
        detail.style.opacity = '0.82';
        detail.style.marginBottom = '9px';
        const button = homeButton('Upgrade - ' + upgradeCost(upgrade));
        button.disabled = playerProfile.coins < upgradeCost(upgrade);
        button.style.opacity = button.disabled ? '0.58' : '1';
        button.style.fontSize = '14px';
        button.onclick = () => {
            if (!buyUpgrade(upgrade)) return;
            updateHeldKettleStyle();
            pendingProfileReveal = upgrade.id === 'moveSpeed' ? 'player' : 'kettle';
            closeProfile();
            showProfileDialog();
        };
        card.append(title, detail, button);
        upgrades.appendChild(card);
    });

    const bombCard = document.createElement('div');
    bombCard.style.padding = '12px';
    bombCard.style.border = '1px solid #176c86';
    bombCard.style.borderRadius = '8px';
    bombCard.style.background = '#0d1b28';
    const bombTitle = document.createElement('div');
    bombTitle.textContent = 'Bomb Pack - Owned: ' + advancedKettleAmmo;
    bombTitle.style.fontWeight = '900';
    bombTitle.style.marginBottom = '5px';
    const bombDetail = document.createElement('div');
    bombDetail.textContent = '10 explosive bomb kettles, just like the bonus-box reward.';
    bombDetail.style.fontSize = '13px';
    bombDetail.style.opacity = '0.84';
    bombDetail.style.marginBottom = '9px';
    const buyBombs = homeButton('Buy 10 - 100 coins');
    buyBombs.disabled = playerProfile.coins < 100;
    buyBombs.style.opacity = buyBombs.disabled ? '0.58' : '1';
    buyBombs.style.fontSize = '14px';
    buyBombs.onclick = () => {
        if (playerProfile.coins < 100) return;
        playerProfile.coins -= 100;
        advancedKettleAmmo = Math.max(0, Number(playerProfile.advancedKettles) || 0) + 10;
        playerProfile.advancedKettles = advancedKettleAmmo;
        advancedKettleSelected = true;
        profileNotice = 'Bomb pack purchased! You now have ' + advancedKettleAmmo + ' bombs.';
        saveProfile();
        updateHeldKettleStyle();
        pendingProfileReveal = 'kettle';
        closeProfile();
        showProfileDialog();
    };
    bombCard.append(bombTitle, bombDetail, buyBombs);
    upgrades.appendChild(bombCard);

    const preview = document.createElement('div');
    preview.style.minHeight = '280px';
    preview.style.border = '1px solid #40364d';
    preview.style.borderRadius = '8px';
    preview.style.background = 'radial-gradient(circle at 50% 35%, #26344f, #0d1019 72%)';
    preview.style.overflow = 'hidden';
    preview.style.position = 'relative';
    profileContent.appendChild(preview);

    const previewLabel = document.createElement('div');
    previewLabel.textContent = playerProfile.name;
    previewLabel.style.position = 'absolute';
    previewLabel.style.left = '0';
    previewLabel.style.right = '0';
    previewLabel.style.bottom = '12px';
    previewLabel.style.zIndex = '1';
    previewLabel.style.textAlign = 'center';
    previewLabel.style.fontWeight = '900';
    preview.appendChild(previewLabel);

    const previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    previewRenderer.setSize(300, 280, false);
    previewRenderer.domElement.style.width = '100%';
    previewRenderer.domElement.style.height = '100%';
    previewRenderer.domElement.style.position = 'absolute';
    previewRenderer.domElement.style.inset = '0';
    preview.prepend(previewRenderer.domElement);

    const previewScene = new THREE.Scene();
    const previewCamera = new THREE.PerspectiveCamera(38, 300 / 280, 0.1, 30);
    previewCamera.position.set(0, 1.45, 5.2);
    previewCamera.lookAt(0, 1, 0);
    previewScene.add(new THREE.HemisphereLight(0xc9e8ff, 0x251b32, 2.2));
    const previewLight = new THREE.DirectionalLight(0xffffff, 2.8);
    previewLight.position.set(3, 5, 4);
    previewScene.add(previewLight);

    const previewColor = colorLocked
        ? teamColor(teamAssignments[localPlayerId], colorOption(playerProfile.colorId).color)
        : colorOption(playerProfile.colorId).color;
    const previewPlayer = new THREE.Group();
    const previewBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 28, 20),
        new THREE.MeshStandardMaterial({ color: previewColor, roughness: 0.48 })
    );
    previewBody.position.y = 1.25;
    previewPlayer.add(previewBody);
    const previewKettle = createRemoteKettle(previewColor, upgradeLevel('kettlePower'), kettleSizeMultiplier());
    previewKettle.position.set(0.95, 0.86, 0.55);
    previewKettle.rotation.set(-0.15, 0.75, -0.12);
    previewPlayer.add(previewKettle);
    previewScene.add(previewPlayer);

    let previewFrame = 0;
    let previewClosed = false;
    let previewDragging = false;
    let previewPointerX = 0;
    const revealType = pendingProfileReveal;
    const upgradeRevealStart = revealType ? performance.now() : 0;
    pendingProfileReveal = null;
    if (upgradeRevealStart) {
        for (let index = 0; index < 22; index++) {
            const dust = document.createElement('span');
            dust.style.position = 'absolute';
            dust.style.left = (revealType === 'kettle' ? 72 + Math.random() * 22 : 30 + Math.random() * 36) + '%';
            dust.style.top = (revealType === 'kettle' ? 38 + Math.random() * 30 : 32 + Math.random() * 38) + '%';
            dust.style.width = (8 + Math.random() * 13) + 'px';
            dust.style.height = dust.style.width;
            dust.style.borderRadius = '50%';
            dust.style.background = 'rgba(255,255,255,0.88)';
            dust.style.filter = 'blur(' + (1 + Math.random() * 3) + 'px)';
            dust.style.pointerEvents = 'none';
            dust.style.setProperty('--dust-x', (Math.random() * 180 - 90) + 'px');
            dust.style.setProperty('--dust-y', (Math.random() * 130 - 75) + 'px');
            dust.style.animation = 'upgradeDust 900ms ease-out forwards';
            dust.style.animationDelay = (Math.random() * 110) + 'ms';
            preview.appendChild(dust);
            setTimeout(() => dust.remove(), 1100);
        }
    }
    let previewWidth = 0;
    let previewHeight = 0;
    const drawPreview = () => {
        if (previewClosed) return;
        const width = Math.max(1, preview.clientWidth);
        const height = Math.max(1, preview.clientHeight);
        if (width !== previewWidth || height !== previewHeight) {
            previewWidth = width;
            previewHeight = height;
            previewRenderer.setSize(width, height, false);
            previewCamera.aspect = width / height;
            previewCamera.updateProjectionMatrix();
        }
        if (!previewDragging) previewPlayer.rotation.y += 0.008;
        previewRenderer.render(previewScene, previewCamera);
        previewFrame = requestAnimationFrame(drawPreview);
    };
    drawPreview();

    previewRenderer.domElement.style.cursor = 'grab';
    previewRenderer.domElement.style.touchAction = 'none';
    previewRenderer.domElement.addEventListener('pointerdown', (event) => {
        previewDragging = true;
        previewPointerX = event.clientX;
        previewRenderer.domElement.style.cursor = 'grabbing';
        previewRenderer.domElement.setPointerCapture(event.pointerId);
    });
    previewRenderer.domElement.addEventListener('pointermove', (event) => {
        if (!previewDragging) return;
        previewPlayer.rotation.y += (event.clientX - previewPointerX) * 0.012;
        previewPointerX = event.clientX;
    });
    const stopPreviewDrag = () => {
        previewDragging = false;
        previewRenderer.domElement.style.cursor = 'grab';
    };
    previewRenderer.domElement.addEventListener('pointerup', stopPreviewDrag);
    previewRenderer.domElement.addEventListener('pointercancel', stopPreviewDrag);

    const closeProfile = () => {
        previewClosed = true;
        cancelAnimationFrame(previewFrame);
        previewRenderer.dispose();
        dialog.remove();
        if (gameBackButton) gameBackButton.disabled = exitWasDisabled;
        if (profileButton) profileButton.disabled = false;
    };

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.marginTop = '16px';
    row.style.flexWrap = 'wrap';
    box.appendChild(row);
    const save = homeButton('Save');
    const invite = homeButton('Invite a person');
    const close = homeButton('Close');
    row.append(save, invite, close);
    save.onclick = () => {
        playerProfile.name = safePlayerName(name.value);
        saveProfile();
        sendMultiplayer({ type: 'registerPresence' });
        closeProfile();
        renderHome();
    };
    invite.onclick = () => {
        playerProfile.name = safePlayerName(name.value);
        saveProfile();
        sendMultiplayer({ type: 'registerPresence' });
        closeProfile();
        showInviteDialog();
    };
    close.onclick = closeProfile;
}

profileButton = document.createElement('button');
profileButton.title = 'Profile';
profileButton.setAttribute('aria-label', 'Profile');
profileButton.style.position = 'absolute';
profileButton.style.top = '18px';
profileButton.style.right = '18px';
profileButton.style.zIndex = '70';
profileButton.style.width = '46px';
profileButton.style.height = '46px';
profileButton.style.borderRadius = '50%';
profileButton.style.border = '1px solid #6d6478';
profileButton.style.background = '#241d30';
profileButton.style.color = '#ffffff';
profileButton.style.fontSize = '22px';
profileButton.style.cursor = 'pointer';
profileButton.style.display = 'grid';
profileButton.style.placeItems = 'center';
profileButton.innerHTML = '<span style="position:relative;display:block;width:22px;height:22px;"><span style="position:absolute;left:6px;top:2px;width:10px;height:10px;border-radius:50%;background:#fff;"></span><span style="position:absolute;left:2px;bottom:1px;width:18px;height:10px;border-radius:10px 10px 4px 4px;background:#fff;"></span></span>';
profileButton.onclick = showProfileDialog;
document.body.appendChild(profileButton);

function clearTutorialOverlay() {
    if (!tutorialOverlay) return;
    tutorialOverlay._cleanup?.();
    tutorialOverlay.remove();
    tutorialOverlay = null;
}

function tutorialCard(text, options = {}) {
    clearTutorialOverlay();
    const layer = document.createElement('div');
    layer.style.position = 'fixed';
    layer.style.inset = '0';
    layer.style.zIndex = '200';
    layer.style.pointerEvents = options.modal ? 'auto' : 'none';
    layer.style.background = options.modal ? 'rgba(5,7,12,0.72)' : 'transparent';
    document.body.appendChild(layer);
    tutorialOverlay = layer;

    const card = document.createElement('div');
    card.style.position = 'fixed';
    card.style.width = 'min(390px, calc(100vw - 28px))';
    card.style.padding = '18px';
    card.style.boxSizing = 'border-box';
    card.style.border = '2px solid #66f7ff';
    card.style.borderRadius = '8px';
    card.style.background = '#171d2b';
    card.style.color = '#fff';
    card.style.fontFamily = UI_FONT;
    card.style.fontSize = '16px';
    card.style.fontWeight = '750';
    card.style.lineHeight = '1.45';
    card.style.boxShadow = '0 18px 55px rgba(0,0,0,0.52),0 0 24px rgba(53,233,255,0.25)';
    card.style.pointerEvents = 'auto';
    card.textContent = text;
    layer.appendChild(card);

    let target = options.target || null;
    let originalAnimation = '';
    let originalZ = '';
    let originalPosition = '';
    let tutorialChangedPosition = false;
    let targetAdvance = null;
    const positionCard = () => {
        if (!target || !target.isConnected) {
            card.style.left = '50%';
            card.style.top = options.gameplay ? '82px' : '50%';
            card.style.transform = options.gameplay ? 'translateX(-50%)' : 'translate(-50%, -50%)';
            return;
        }
        const rect = target.getBoundingClientRect();
        card.style.transform = 'none';
        card.style.left = Math.max(14, Math.min(window.innerWidth - Math.min(390, window.innerWidth - 28) - 14, rect.left)) + 'px';
        card.style.top = (rect.bottom + 18 + 190 < window.innerHeight ? rect.bottom + 18 : Math.max(14, rect.top - 190)) + 'px';
    };

    if (target) {
        originalAnimation = target.style.animation;
        originalZ = target.style.zIndex;
        originalPosition = target.style.position;
        if (getComputedStyle(target).position === 'static') {
            target.style.position = 'relative';
            tutorialChangedPosition = true;
        }
        target.style.zIndex = '202';
        target.style.animation = 'tutorialPulse 1.05s ease-in-out infinite';
        targetAdvance = () => {
            clearTutorialOverlay();
            setTimeout(options.onAdvance || (() => {}), 80);
        };
        target.addEventListener('click', targetAdvance, { once: true });
    }

    if (options.buttonLabel) {
        const button = homeButton(options.buttonLabel);
        button.style.marginTop = '14px';
        button.onclick = () => {
            clearTutorialOverlay();
            options.onAdvance?.();
        };
        card.appendChild(document.createElement('br'));
        card.appendChild(button);
    }

    if (options.allowSkip) {
        const skip = homeButton('Skip tutorial');
        skip.style.marginTop = '10px';
        skip.style.marginLeft = '8px';
        skip.onclick = finishTutorial;
        card.appendChild(skip);
    }

    positionCard();
    window.addEventListener('resize', positionCard);
    layer._cleanup = () => {
        window.removeEventListener('resize', positionCard);
        if (target) {
            if (targetAdvance) target.removeEventListener('click', targetAdvance);
            target.style.animation = originalAnimation;
            target.style.zIndex = originalZ;
            if (tutorialChangedPosition) target.style.position = originalPosition;
        }
    };
}

function tutorialButton(label) {
    return [...homeScreen.querySelectorAll('button')].find((button) => button.textContent.trim() === label) || null;
}

function startFirstPlayTutorial() {
    if (!isFirstVisit || playerProfile.tutorialComplete || tutorialActive) return;
    tutorialActive = true;
    tutorialStage = 'intro';
    tutorialCard(
        'Welcome to Dino vs Kettle! This game contains rapid movement, flashes, and explosive effects that may affect photosensitive players.',
        { modal: true, buttonLabel: 'Begin tutorial', onAdvance: tutorialCreateRoom, allowSkip: true }
    );
}

function tutorialCreateRoom() {
    tutorialStage = 'create-room';
    renderHome();
    setTimeout(() => tutorialCard(
        "Let's create a room to play in. Create starts a new room, Join uses an existing room code, and Tournament finds opponents automatically. Click Create room.",
        { target: tutorialButton('Create room'), onAdvance: tutorialChoosePrivacy }
    ), 40);
}

function tutorialChoosePrivacy() {
    tutorialStage = 'privacy';
    tutorialCard(
        'Public rooms appear in the room list so other players can join. Private rooms are for solo play or an AI opponent. Choose Private for this lesson.',
        { target: tutorialButton('Private'), onAdvance: tutorialChooseSolo }
    );
}

function tutorialChooseSolo() {
    tutorialStage = 'solo';
    tutorialCard(
        'Solo game lets you practise alone. AI vs Human adds a computer opponent with a chosen difficulty. Start a Solo game now.',
        { target: tutorialButton('Solo game'), onAdvance: tutorialMovementLesson }
    );
}

function tutorialMovementLesson() {
    tutorialStage = 'movement';
    const movementText = useMobileControls
        ? 'Use the left joystick to move and drag the right side to look around. The crosshair stays in the centre.'
        : 'Use W, A, S, and D or the arrow keys to move. Move the mouse to look around. The crosshair stays in the centre.';
    tutorialCard(movementText, { gameplay: true, buttonLabel: 'Practise shooting', onAdvance: prepareTutorialTarget });
}

function prepareTutorialTarget() {
    tutorialStage = 'waiting-target';
    const tryTarget = () => {
        const target = dinosaurs.find((dino) => dino.userData.state === 'alive');
        if (!target) {
            setTimeout(tryTarget, 150);
            return;
        }
        tutorialFrozenDino = target;
        target.userData.tutorialFrozen = true;
        setDinoWalking(target, false);
        const forward = cameraForward();
        forward.y = 0;
        forward.normalize();
        target.position.set(camera.position.x + forward.x * 11, 0, camera.position.z + forward.z * 11);
        target.userData.target.copy(target.position);
        target.lookAt(camera.position.x, target.position.y, camera.position.z);
        const aimPoint = target.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        setLookAtTarget(aimPoint);
        tutorialStage = 'shoot-dino';
        const shootControl = 'Click, press Space, or press Enter';
        tutorialCard(shootControl + ' to launch a kettle at the dinosaur. Bonus tip: hold Enter for a continuous stream of kettles. Hit the dinosaur to continue.', { gameplay: true });
    };
    tryTarget();
}

function handleTutorialDinoHit(dino) {
    if (!tutorialActive || tutorialStage !== 'shoot-dino' || dino !== tutorialFrozenDino) return;
    tutorialStage = 'dino-hit';
    dino.userData.tutorialFrozen = false;
    setDinoWalking(dino, true);
    tutorialFrozenDino = null;
    tutorialCard('Direct hit! Kettle upgrades change their size and power. Next, try the special supply box.', {
        gameplay: true,
        buttonLabel: 'Show the box',
        onAdvance: tutorialMysteryBox
    });
}

function tutorialMysteryBox() {
    tutorialStage = 'bonus-box';
    spawnMysteryBox();
    if (bonusBoxes[0]) bonusBoxes[0].maxLife = 120;
    tutorialCard('Shoot the glowing navy bonus box. It normally appears as a surprise and disappears quickly, but this practice box will wait for you.', { gameplay: true });
}

function handleTutorialMysteryCollected() {
    if (!tutorialActive || tutorialStage !== 'bonus-box') return;
    tutorialStage = 'advanced-kettles';
    const lesson = 'The bomb kettles are flying into your inventory. Press T to switch weapons. They explode on impact, and direct hits can defeat a dinosaur instantly.';
    tutorialCard(lesson, { gameplay: true });
    setTimeout(() => {
        if (!tutorialActive || tutorialStage !== 'advanced-kettles') return;
        tutorialCard(lesson, { gameplay: true, buttonLabel: 'Continue', onAdvance: tutorialMultiplayerLesson });
    }, 1700);
}

function tutorialMultiplayerLesson() {
    gameBackButton.click();
    tutorialStage = 'multiplayer';
    setTimeout(() => tutorialCard(
        'Multiplayer rooms use a code. Public rooms can be found by other players; team rooms let an administrator arrange teams. Tournaments find players and make teams automatically.',
        { modal: true, buttonLabel: 'Show customization', onAdvance: tutorialProfileLesson }
    ), 80);
}

function tutorialProfileLesson() {
    tutorialStage = 'profile';
    tutorialCard('Open your profile here to change your name and colour, buy upgrades, and drag your player model around.', {
        target: profileButton,
        onAdvance: () => setTimeout(() => tutorialCard(
            'This is your profile and upgrade shop. Hits earn coins. Spend them on upgrades and colours, then press Save. Tutorial complete!',
            { modal: false, buttonLabel: 'Finish', onAdvance: finishTutorial }
        ), 100)
    });
}

function finishTutorial() {
    clearTutorialOverlay();
    tutorialActive = false;
    tutorialStage = '';
    if (tutorialFrozenDino) {
        tutorialFrozenDino.userData.tutorialFrozen = false;
        setDinoWalking(tutorialFrozenDino, true);
        tutorialFrozenDino = null;
    }
    playerProfile.tutorialComplete = true;
    saveProfile();
}

gameBackButton = homeButton('Exit');
gameBackButton.style.position = 'absolute';
gameBackButton.style.top = '18px';
gameBackButton.style.right = '76px';
gameBackButton.style.zIndex = '70';
gameBackButton.style.display = 'none';
gameBackButton.onclick = () => {
    gameStarted = false;
    matchActive = false;
    matchEnded = false;
    homeScreen.style.display = 'flex';
    scoreBoard.style.display = 'none';
    scoreBurstLayer.style.display = 'none';
    scoreBurstLayer.innerHTML = '';
    roomStatus.style.display = 'none';
    crosshair.style.display = 'none';
    leaderboard.style.display = 'none';
    updateMobileControls();
    gameBackButton.style.display = 'none';
    if (fullscreenButton) fullscreenButton.style.display = 'none';
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (aiPlayer) {
        removeRemotePlayer(aiPlayer.id);
        aiPlayer = null;
    }
    remotePlayers.forEach((_, id) => removeRemotePlayer(id));
    leaveMultiplayerRoomState();
    currentRoom = null;
    roomPlayers = [];
    teamAssignments = {};
    localPlayerColor = colorOption(playerProfile.colorId).color;
    advancedKettleSelected = false;
    resetMysteryBox();
    updateHeldKettleStyle();
    updateWeaponStatus();
    resetMovementInput();
    renderHome();
};
document.body.appendChild(gameBackButton);

function updateFullscreenButton() {
    if (!fullscreenButton) return;
    const active = Boolean(document.fullscreenElement);
    fullscreenButton.textContent = '⛶';
    fullscreenButton.title = active ? 'Minimise fullscreen' : 'Maximise fullscreen';
    fullscreenButton.setAttribute('aria-label', fullscreenButton.title);
}

fullscreenButton = homeButton('⛶');
fullscreenButton.style.position = 'fixed';
fullscreenButton.style.top = 'auto';
fullscreenButton.style.right = '18px';
fullscreenButton.style.bottom = '18px';
fullscreenButton.style.zIndex = '70';
fullscreenButton.style.display = 'none';
fullscreenButton.style.width = '46px';
fullscreenButton.style.minHeight = '46px';
fullscreenButton.style.padding = '0';
fullscreenButton.style.fontSize = '28px';
fullscreenButton.style.touchAction = 'manipulation';
fullscreenButton.onclick = async () => {
    try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
    } catch {
        // Fullscreen can be denied by browser policy; the game remains playable.
    }
    updateFullscreenButton();
};
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.body.appendChild(fullscreenButton);
updateFullscreenButton();

inviteLayer = document.createElement('div');
inviteLayer.style.position = 'absolute';
inviteLayer.style.top = '82px';
inviteLayer.style.right = '18px';
inviteLayer.style.zIndex = '80';
inviteLayer.style.display = 'grid';
inviteLayer.style.gap = '8px';
document.body.appendChild(inviteLayer);

leaderboard = document.createElement('div');
leaderboard.style.position = 'absolute';
leaderboard.style.top = '104px';
leaderboard.style.left = '20px';
leaderboard.style.minWidth = '180px';
leaderboard.style.padding = '10px 12px';
leaderboard.style.background = 'rgba(18,15,25,0.72)';
leaderboard.style.border = '1px solid rgba(255,255,255,0.18)';
leaderboard.style.color = '#ffffff';
leaderboard.style.fontFamily = UI_FONT;
leaderboard.style.fontSize = '13px';
leaderboard.style.lineHeight = '1.45';
leaderboard.style.zIndex = '10';
leaderboard.style.display = 'none';
leaderboard.style.maxWidth = 'min(300px, calc(100vw - 40px))';
leaderboard.style.maxHeight = 'calc(100vh - 140px)';
leaderboard.style.overflow = 'hidden';
leaderboard.style.boxSizing = 'border-box';
leaderboard.className = 'game-leaderboard';
document.body.appendChild(leaderboard);

function startGame(roomLabel = 'Private room', playerCount = 1, options = {}) {
    gameStarted = true;
    gameMode = options.mode || gameMode || 'solo';
    aiDifficulty = options.difficulty || aiDifficulty || 'medium';
    matchDuration = Number(options.duration || matchDuration || 180);
    matchTimer = options.timed ? matchDuration : 0;
    matchActive = Boolean(options.timed);
    matchEnded = false;
    configureArena(playerCount);
    const resumeState = options.resumeState || null;
    localDefeats = Number(resumeState?.defeats || 0);
    aiDefeats = 0;
    score = Number(resumeState?.score || 0);
    advancedKettleAmmo = playerProfile.advancedKettles;
    advancedKettleSelected = advancedKettleAmmo > 0;
    resetMysteryBox();
    lastHitNotice = 0;
    lastHitText = 'DIRECT HIT! +10 COINS';
    scoreBurstLayer.innerHTML = '';
    playerStats.clear();
    const localTeam = teamAssignments[localPlayerId] || null;
    localPlayerColor = localTeam
        ? teamColor(localTeam, localPlayerColor)
        : colorOption(playerProfile.colorId).color;
    updateHeldKettleStyle();
    setStat(localPlayerId, { name: playerProfile.name, score: 0, defeats: 0, color: localPlayerColor, team: localTeam });
    resetMovementInput();
    if (gameMode === 'ai') createAiPlayer(aiDifficulty);
    moveLocalPlayerToSpawn();
    if (Array.isArray(resumeState?.position) && resumeState.position.length === 3) {
        camera.position.fromArray(resumeState.position);
        camera.position.y = 8;
    }
    homeScreen.style.display = 'none';
    scoreBoard.style.display = 'block';
    scoreBurstLayer.style.display = 'block';
    roomStatus.style.display = 'block';
    crosshair.style.display = 'block';
    hpLayer.style.display = 'block';
    leaderboard.style.display = 'block';
    if (profileButton) profileButton.style.display = 'grid';
    if (gameBackButton) gameBackButton.style.display = 'block';
    if (fullscreenButton) fullscreenButton.style.display = 'block';
    updateScoreUI();
    updateHeldKettleStyle();
    updateWeaponStatus();
    updateLeaderboard();
    updateMobileControls();
    roomStatus.textContent = roomLabel + ': ' + playerCount + ' player' + (playerCount === 1 ? '' : 's');
    focusGame();
}

function spawnForIndex(index) {
    const playerTotal = Math.max(1, currentRoom?.players || (gameMode === 'ai' ? 2 : 1));
    const angle = playerTotal === 2 ? index * Math.PI : (index / playerTotal) * Math.PI * 2;
    const radius = Math.max(22, ARENA_LIMIT * 0.72);
    return {
        position: new THREE.Vector3(Math.sin(angle) * radius, 8, Math.cos(angle) * radius),
        lookAt: new THREE.Vector3(0, 1.2, 0)
    };
}

function moveLocalPlayerToSpawn() {
    const spawn = spawnForIndex(localSpawnIndex);
    camera.position.copy(spawn.position);
    setLookAtTarget(spawn.lookAt);
}

function sendMultiplayer(message) {
    if (multiplayerSocket && multiplayerSocket.readyState === WebSocket.OPEN) {
        multiplayerSocket.send(JSON.stringify({ name: playerProfile.name, profileId: playerProfile.profileId, color: localPlayerColor, ...message }));
    }
}

function currentMultiplayerState() {
    return {
        position: camera.position.toArray(),
        quaternion: camera.quaternion.toArray(),
        name: playerProfile.name,
        score,
        defeats: localDefeats,
        team: teamAssignments[localPlayerId] || null,
        powerLevel: upgradeLevel('kettlePower'),
        kettleSize: kettleSizeMultiplier(),
        advancedSelected: advancedKettleSelected && advancedKettleAmmo > 0
    };
}

function leaveMultiplayerRoomState() {
    sendMultiplayer({ type: 'leaveRoom', state: currentMultiplayerState() });
}

function leaveMultiplayerRoom(nextScreen = 'join') {
    leaveMultiplayerRoomState();
    remotePlayers.forEach((_, id) => removeRemotePlayer(id));
    currentRoom = null;
    roomPlayers = [];
    teamAssignments = {};
    teamRequests = [];
    teamMessage = '';
    pendingRoomResumeState = null;
    renderHome(nextScreen);
    sendMultiplayer({ type: 'listRooms' });
}

function multiplayerAllowedHere() {
    const host = window.location.hostname || 'localhost';
    return Boolean(import.meta.env.VITE_DINO_WS_URL || window.DINO_WS_URL)
        || host === 'localhost'
        || host === '127.0.0.1'
        || host === '::1'
        || /^192\.168\./.test(host)
        || /^10\./.test(host)
        || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
}

function connectMultiplayer(onReady = () => {}, quiet = false) {
    if (!multiplayerAllowedHere()) {
        if (!quiet) renderHome('error', 'Online rooms are disabled in hosted builds. Solo and AI modes stay fully playable.');
        return;
    }
    if (multiplayerSocket && multiplayerSocket.readyState === WebSocket.OPEN) {
        onReady();
        return;
    }
    if (multiplayerSocket && multiplayerSocket.readyState === WebSocket.CONNECTING) {
        multiplayerSocket.addEventListener('open', onReady, { once: true });
        return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const localSocketUrl = `${wsProtocol}://${window.location.hostname || 'localhost'}:8081`;
    const socketUrl = import.meta.env.VITE_DINO_WS_URL || window.DINO_WS_URL || localSocketUrl;
    multiplayerSocket = new WebSocket(socketUrl);

    multiplayerSocket.addEventListener('open', () => {
        sendMultiplayer({ type: 'registerPresence' });
        onReady();
    });
    multiplayerSocket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        handleMultiplayerMessage(message);
    });
    multiplayerSocket.addEventListener('close', () => {
        if (currentRoom) roomStatus.textContent = 'Group disconnected';
        multiplayerSocket = null;
    });
    multiplayerSocket.addEventListener('error', () => {
        if (!quiet) renderHome('error', 'Multiplayer server is not running. Start it with: npm run server');
    });
}

setInterval(() => {
    connectMultiplayer(() => {
        sendMultiplayer({ type: 'listRooms' });
        sendMultiplayer({ type: 'listPlayers' });
    }, true);
}, 2000);

function renderHome(mode = 'root', message = '') {
    homeScreen.innerHTML = '';
    hpLayer.style.display = 'none';
    if (profileButton) profileButton.style.display = 'block';
    if (gameBackButton) gameBackButton.style.display = 'none';
    if (fullscreenButton) fullscreenButton.style.display = 'none';

    const panel = document.createElement('div');
    panel.style.width = 'min(760px, calc(100vw - 32px))';
    panel.style.maxHeight = 'min(680px, calc(100vh - 32px))';
    panel.style.overflow = 'auto';
    panel.style.border = '1px solid #40364d';
    panel.style.background = '#1b1626';
    panel.style.padding = '24px';
    panel.style.boxSizing = 'border-box';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 24px 70px rgba(0, 0, 0, 0.35)';
    homeScreen.appendChild(panel);

    const title = document.createElement('div');
    title.textContent = 'DINO VS KETTLE';
    title.style.fontSize = '34px';
    title.style.fontWeight = '900';
    title.style.letterSpacing = '0';
    title.style.marginBottom = '6px';
    panel.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.textContent = useMobileControls ? 'Move, aim, and throw with the on-screen controls.' : 'Move with WASD or arrows. Throw with click, Space, or Enter.';
    subtitle.style.fontSize = '15px';
    subtitle.style.fontWeight = '650';
    subtitle.style.opacity = '0.82';
    subtitle.style.marginBottom = '20px';
    panel.appendChild(subtitle);

    if (message) {
        const note = document.createElement('div');
        note.textContent = message;
        note.style.color = '#ffcf66';
        note.style.marginBottom = '16px';
        panel.appendChild(note);
    }

    if (mode === 'root' || mode === 'error') {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '12px';
        row.style.flexWrap = 'wrap';
        panel.appendChild(row);

        const create = homeButton('Create room');
        const join = homeButton('Join room');
        const tournament = homeButton('Tournament');
        const about = homeButton('About');
        const privacy = homeButton('Privacy');
        row.append(create, join, tournament, about, privacy);
        create.onclick = () => renderHome('create');
        join.onclick = () => {
            connectMultiplayer(() => {
                sendMultiplayer({ type: 'listRooms' });
                renderHome('join');
            });
        };
        tournament.onclick = () => renderHome('tournament');
        about.onclick = () => renderHome('about');
        privacy.onclick = () => renderHome('privacy');
        return;
    }

    if (mode === 'tournament') {
        const note = document.createElement('div');
        note.textContent = 'Pick a tournament size. The server will find players and make the teams automatically.';
        note.style.marginBottom = '14px';
        note.style.opacity = '0.86';
        panel.appendChild(note);
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '12px';
        row.style.flexWrap = 'wrap';
        panel.appendChild(row);
        [1, 2, 4, 8].forEach((size) => {
            const button = homeButton(size + 'v' + size);
            button.onclick = () => {
                connectMultiplayer(() => {
                    sendMultiplayer({ type: 'joinTournament', teamSize: size });
                    renderHome('tournamentWaiting', 'Finding players for ' + size + 'v' + size + '...');
                });
            };
            row.appendChild(button);
        });
        const back = homeButton('Back');
        row.appendChild(back);
        back.onclick = () => renderHome();
        return;
    }

    if (mode === 'tournamentWaiting') {
        const waiting = document.createElement('div');
        waiting.textContent = message || 'Finding players...';
        waiting.style.fontSize = '22px';
        waiting.style.fontWeight = '900';
        waiting.style.marginBottom = '12px';
        panel.appendChild(waiting);
        const detail = document.createElement('div');
        detail.textContent = 'Keep this screen open. The match starts automatically when enough players join.';
        detail.style.opacity = '0.82';
        detail.style.marginBottom = '16px';
        panel.appendChild(detail);
        const back = homeButton('Back');
        panel.appendChild(back);
        back.onclick = () => {
            sendMultiplayer({ type: 'cancelTournament' });
            renderHome('tournament');
        };
        return;
    }

    if (mode === 'about') {
        const sections = [
            ['Made by PixelVolt Games', 'Dino vs Kettle is a fast, silly arena game about throwing kettles at roaming dinosaurs, chasing higher scores, and outplaying friends.'],
            ['How to play', 'On desktop, move with WASD or the arrow keys and throw with click, Space, or Enter. On touch devices, use the joystick, drag to aim, and tap Throw.'],
            ['Score and upgrades', 'Direct hits give score and coins. Spend coins from your profile on bigger kettles, faster movement, and stronger hits. Defeat dinosaurs before the timer runs out to climb the leaderboard.'],
            ['Multiplayer and tournaments', 'Create a room, join a code, play with teams, or enter Tournament mode. Tournament matches find players automatically and split everyone into red and blue sides.']
        ];
        sections.forEach(([heading, body]) => {
            const block = document.createElement('div');
            block.style.marginBottom = '16px';
            const h = document.createElement('div');
            h.textContent = heading;
            h.style.fontSize = '18px';
            h.style.fontWeight = '900';
            h.style.marginBottom = '5px';
            const p = document.createElement('div');
            p.textContent = body;
            p.style.fontSize = '15px';
            p.style.lineHeight = '1.45';
            p.style.opacity = '0.88';
            block.append(h, p);
            panel.appendChild(block);
        });
        const back = homeButton('Back');
        panel.appendChild(back);
        back.onclick = () => renderHome();
        return;
    }

    if (mode === 'privacy') {
        const sections = [
            ['Privacy', 'Dino vs Kettle stores your chosen name, coins, upgrades, colours, and tutorial progress on your device so your progress can continue.'],
            ['Multiplayer', 'Online play sends your display name, player state, room code, colour, and match score to the multiplayer server. Do not use your real name or share personal information.'],
            ['Cookies and storage', 'The game uses local storage and a first-party cookie only to remember game progress. It does not contain third-party advertising or analytics systems.'],
            ['Data choices', 'Clearing this site\'s browser data removes locally saved progress. Multiplayer connection records may be retained temporarily for operation and abuse prevention.']
        ];
        sections.forEach(([heading, body]) => {
            const block = document.createElement('div');
            block.style.marginBottom = '16px';
            const h = document.createElement('div');
            h.textContent = heading;
            h.style.fontSize = '18px';
            h.style.fontWeight = '900';
            const p = document.createElement('div');
            p.textContent = body;
            p.style.marginTop = '5px';
            p.style.lineHeight = '1.45';
            p.style.opacity = '0.88';
            block.append(h, p);
            panel.appendChild(block);
        });
        const back = homeButton('Back');
        panel.appendChild(back);
        back.onclick = () => renderHome();
        return;
    }

    if (mode === 'create') {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '12px';
        row.style.flexWrap = 'wrap';
        panel.appendChild(row);

        const publicRoom = homeButton('Public');
        const privateRoom = homeButton('Private');
        const back = homeButton('Back');
        row.append(publicRoom, privateRoom, back);
        publicRoom.onclick = () => renderHome('publicMode');
        privateRoom.onclick = () => renderHome('privateReady');
        back.onclick = () => renderHome();
        return;
    }

    if (mode === 'publicMode') {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '12px';
        row.style.flexWrap = 'wrap';
        panel.appendChild(row);

        const single = homeButton('Single');
        const team = homeButton('Team');
        const back = homeButton('Back');
        row.append(single, team, back);
        single.onclick = () => {
            connectMultiplayer(() => {
                sendMultiplayer({ type: 'createRoom', visibility: 'public', kind: 'classic', timed: false });
                renderHome('publicWaiting', 'Creating public room...');
            });
        };
        team.onclick = () => {
            connectMultiplayer(() => {
                sendMultiplayer({ type: 'createRoom', visibility: 'public', kind: 'team', timed: false });
                renderHome('publicWaiting', 'Creating team room...');
            });
        };
        back.onclick = () => renderHome('create');
        return;
    }

    if (mode === 'publicWaiting') {
        const back = homeButton('Back');
        panel.appendChild(back);
        back.onclick = () => leaveMultiplayerRoom('publicMode');
        return;
    }

    if (mode === 'publicReady') {
        const code = document.createElement('div');
        code.textContent = 'Code: ' + roomCodeText(currentRoom?.code);
        code.style.fontSize = '22px';
        code.style.marginBottom = '10px';
        panel.appendChild(code);

        const details = document.createElement('div');
        details.textContent = currentRoom?.kind === 'team' ? 'Team game waiting room. The administrator assigns teams and starts the match.' : 'Classic public room. Start when everyone is ready.';
        details.style.marginBottom = '14px';
        details.style.opacity = '0.85';
        panel.appendChild(details);

        if (teamMessage) {
            const assigned = document.createElement('div');
            assigned.textContent = teamMessage;
            assigned.style.color = '#8dffad';
            assigned.style.marginBottom = '12px';
            panel.appendChild(assigned);
        }

        renderWaitingPlayers(panel);

        if (currentRoom?.kind === 'team' && currentRoom?.adminId === localPlayerId) {
            const teamTimer = makeTimerOption('Enable team timer');
            teamTimer.seconds.value = currentRoom.duration || 180;
            panel.append(teamTimer.wrapper, teamTimer.seconds.wrapper);

            const adminRow = document.createElement('div');
            adminRow.style.display = 'flex';
            adminRow.style.flexWrap = 'wrap';
            adminRow.style.gap = '10px';
            adminRow.style.marginTop = '14px';
            panel.appendChild(adminRow);
            const randomTeams = homeButton('Random teams');
            const addTeam = homeButton('Add team');
            const start = homeButton('Start team game');
            addTeam.disabled = (currentRoom.teamCount || 2) >= 20;
            addTeam.style.opacity = addTeam.disabled ? '0.55' : '1';
            adminRow.append(randomTeams, addTeam, start);
            const back = homeButton('Back');
            adminRow.append(back);
            randomTeams.onclick = () => randomAssignTeams();
            addTeam.onclick = () => sendMultiplayer({ type: 'setTeamCount', teamCount: Math.min(20, (currentRoom.teamCount || 2) + 1) });
            start.onclick = () => sendMultiplayer({ type: 'startMatch', timed: teamTimer.checkbox.checked, duration: Number(teamTimer.seconds.value || 180) });
            back.onclick = () => leaveMultiplayerRoom('join');
            return;
        }

        if (currentRoom?.kind === 'team') {
            const waiting = document.createElement('div');
            waiting.textContent = 'Waiting to start...';
            waiting.style.marginTop = '14px';
            panel.appendChild(waiting);
            const back = homeButton('Back');
            back.style.marginTop = '14px';
            panel.appendChild(back);
            back.onclick = () => leaveMultiplayerRoom('join');
            return;
        }

        const back = homeButton('Back');
        if (currentRoom?.adminId === localPlayerId) {
            const gameTimer = makeTimerOption('Enable timer');
            panel.append(gameTimer.wrapper, gameTimer.seconds.wrapper);
            const start = homeButton('Start game');
            back.style.marginLeft = '10px';
            panel.append(start, back);
            start.onclick = () => sendMultiplayer({ type: 'startMatch', timed: gameTimer.checkbox.checked, duration: Number(gameTimer.seconds.value || 180) });
        } else {
            const waiting = document.createElement('div');
            waiting.textContent = 'Waiting for the room creator to start...';
            waiting.style.marginBottom = '14px';
            panel.append(waiting, back);
        }
        back.onclick = () => leaveMultiplayerRoom('join');
        return;
    }

    if (mode === 'privateReady') {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '12px';
        row.style.flexWrap = 'wrap';
        panel.appendChild(row);

        const start = homeButton('Solo game');
        const ai = homeButton('AI vs Human');
        const back = homeButton('Back');
        row.append(start, ai, back);
        start.onclick = () => startGame('Private room', 1, { mode: 'solo' });
        ai.onclick = () => renderHome('aiSetup');
        back.onclick = () => renderHome('create');
        return;
    }

    if (mode === 'aiSetup') {
        const controls = document.createElement('div');
        controls.style.display = 'grid';
        controls.style.gap = '12px';
        controls.style.maxWidth = '320px';
        panel.appendChild(controls);

        const timer = makeTimerOption('Enable AI match timer');
        timer.checkbox.checked = true;
        timer.seconds.wrapper.style.display = 'grid';
        const difficulty = makeSelect('AI difficulty', ['easy', 'medium', 'hard', 'extra-hard']);
        controls.append(timer.wrapper, timer.seconds.wrapper, difficulty.wrapper);

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '10px';
        row.style.flexWrap = 'wrap';
        controls.appendChild(row);
        const ai = homeButton('Start AI 1v1');
        const back = homeButton('Back');
        row.append(ai, back);
        ai.onclick = () => startGame('AI 1v1', 2, { mode: 'ai', timed: timer.checkbox.checked, duration: Number(timer.seconds.value || 180), difficulty: difficulty.value });
        back.onclick = () => renderHome('privateReady');
        return;
    }

    if (mode === 'join') {
        const input = document.createElement('input');
        input.placeholder = 'Type game code';
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';
        input.style.marginBottom = '12px';
        input.style.padding = '12px';
        input.style.fontFamily = UI_FONT;
        input.style.fontSize = '16px';
        input.style.borderRadius = '6px';
        input.style.border = '1px solid #6d6478';
        input.style.background = '#120f19';
        input.style.color = '#ffffff';
        panel.appendChild(input);

        const joinCode = homeButton('Join typed code');
        const back = homeButton('Back');
        back.style.marginLeft = '10px';
        panel.append(joinCode, back);
        joinCode.onclick = () => sendMultiplayer({ type: 'joinRoom', code: input.value });
        back.onclick = () => renderHome();

        const listTitle = document.createElement('div');
        listTitle.textContent = 'Top 10 active public games';
        listTitle.style.marginTop = '22px';
        listTitle.style.marginBottom = '10px';
        panel.appendChild(listTitle);

        const list = document.createElement('div');
        list.id = 'room-list';
        list.style.display = 'grid';
        list.style.gap = '8px';
        panel.appendChild(list);

        renderRoomList();
    }
}

function teamColor(team, fallback) {
    if (!team) return fallback;
    const legacy = { red: 0xff4242, blue: 0x2f80ff, green: 0x31c96b, gold: 0xf0c84b };
    if (legacy[team]) return legacy[team];
    const match = String(team).match(/(\d+)$/);
    return match ? TEAM_PALETTE[(Number(match[1]) - 1) % TEAM_PALETTE.length] : fallback;
}

function teamDisplayName(team) {
    if (!team) return '';
    const tournamentName = currentRoom?.teamNames?.find((entry) => entry.id === team)?.name
        || tournamentBracket?.teams?.find((entry) => entry.id === team)?.name;
    if (tournamentName) return tournamentName;
    if (/^team-\d+$/.test(team)) return 'Team ' + team.split('-')[1];
    return team[0].toUpperCase() + team.slice(1);
}

function repaintRemoteTeams() {
    remotePlayers.forEach((remote) => {
        const color = teamColor(teamAssignments[remote.id], remote.color);
        remote.color = color;
        remote.group.traverse((child) => {
            if (child.isMesh && child.material && child.geometry?.type !== 'ConeGeometry' && !child.userData.preserveColor) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((material) => material.color?.setHex(color));
            }
        });
    });
}

function renderWaitingPlayers(panel) {
    if (!currentRoom || !roomPlayers.length) return;
    const waitingCount = roomPlayers.length;
    const title = document.createElement('div');
    title.textContent = waitingCount + ' player' + (waitingCount === 1 ? '' : 's') + ' waiting to start';
    title.style.marginTop = '14px';
    title.style.marginBottom = '8px';
    title.style.fontWeight = '900';
    title.style.padding = '10px 12px';
    title.style.border = '1px solid #40364d';
    title.style.background = '#120f19';
    title.style.borderRadius = '6px';
    panel.appendChild(title);

    const isTeamAdmin = currentRoom.kind === 'team' && currentRoom.adminId === localPlayerId;
    if (!isTeamAdmin) {
        if (currentRoom.kind === 'tournament') {
            const assigned = teamAssignments[localPlayerId];
            if (assigned) {
                const teamLine = document.createElement('div');
                teamLine.textContent = 'You are on ' + teamDisplayName(assigned) + '.';
                teamLine.style.marginTop = '12px';
                teamLine.style.fontWeight = '900';
                panel.appendChild(teamLine);
            }
            return;
        }
        if (currentRoom.kind === 'team') {
            const currentTeam = teamAssignments[localPlayerId];
            const requestRow = document.createElement('div');
            requestRow.style.display = 'flex';
            requestRow.style.gap = '10px';
            requestRow.style.flexWrap = 'wrap';
            requestRow.style.marginTop = '12px';
            panel.appendChild(requestRow);
            TEAM_NAMES.slice(0, currentRoom.teamCount || 2).forEach((team) => {
                const button = homeButton(currentTeam === team ? teamDisplayName(team) : 'Request ' + teamDisplayName(team));
                button.disabled = currentTeam === team;
                button.style.opacity = currentTeam === team ? '0.6' : '1';
                button.onclick = () => sendMultiplayer({ type: 'teamRequest', team });
                requestRow.appendChild(button);
            });
        }
        return;
    }

    const board = document.createElement('div');
    board.style.display = 'grid';
    board.style.gridTemplateColumns = 'repeat(auto-fit, minmax(160px, 1fr))';
    board.style.gap = '10px';
    panel.appendChild(board);

    const columns = ['waiting', ...TEAM_NAMES.slice(0, currentRoom.teamCount || 2)];
    columns.forEach((team) => {
        const column = document.createElement('div');
        column.dataset.team = team;
        column.style.minHeight = '120px';
        column.style.padding = '10px';
        column.style.border = '1px solid #40364d';
        column.style.borderRadius = '6px';
        const color = teamColor(team, 0x241d30);
        column.style.background = team === 'waiting' ? '#120f19' : '#' + new THREE.Color(color).multiplyScalar(0.28).getHexString();
        const heading = document.createElement('div');
        heading.textContent = team === 'waiting' ? 'Waiting' : teamDisplayName(team);
        heading.style.fontWeight = '900';
        heading.style.marginBottom = '8px';
        column.appendChild(heading);
        column.ondragover = (event) => event.preventDefault();
        column.ondrop = (event) => {
            event.preventDefault();
            const id = event.dataTransfer.getData('text/plain');
            if (!id) return;
            if (team === 'waiting') delete teamAssignments[id];
            else teamAssignments[id] = team;
            sendMultiplayer({ type: 'assignTeams', assignments: teamAssignments });
            renderHome('publicReady');
        };
        board.appendChild(column);
    });

    if (teamRequests.length) {
        const requestsBox = document.createElement('div');
        requestsBox.style.marginTop = '12px';
        requestsBox.style.display = 'grid';
        requestsBox.style.gap = '8px';
        panel.appendChild(requestsBox);
        const requestTitle = document.createElement('div');
        requestTitle.textContent = 'Team requests';
        requestTitle.style.fontWeight = '900';
        requestsBox.appendChild(requestTitle);
        teamRequests.forEach((request) => {
            if (teamAssignments[request.playerId] === request.team) return;
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '8px';
            row.style.flexWrap = 'wrap';
            row.style.padding = '8px';
            row.style.border = '1px solid #40364d';
            row.style.background = '#120f19';
            row.style.borderRadius = '6px';
            const label = document.createElement('span');
            label.textContent = request.playerName + ' wants ' + teamDisplayName(request.team);
            label.style.flex = '1';
            const accept = homeButton('Accept');
            const decline = homeButton('Decline');
            accept.onclick = () => sendMultiplayer({ type: 'teamRequestDecision', playerId: request.playerId, accept: true });
            decline.onclick = () => sendMultiplayer({ type: 'teamRequestDecision', playerId: request.playerId, accept: false });
            row.append(label, accept, decline);
            requestsBox.appendChild(row);
        });
    }

    roomPlayers.forEach((player) => {
        const team = teamAssignments[player.id] || 'waiting';
        const column = board.querySelector('[data-team="' + team + '"]') || board.querySelector('[data-team="waiting"]');
        const row = document.createElement('div');
        row.draggable = true;
        row.textContent = player.name || player.id;
        row.style.padding = '8px 10px';
        row.style.marginBottom = '6px';
        row.style.border = '1px solid rgba(255,255,255,0.22)';
        row.style.background = '#241d30';
        row.style.borderRadius = '6px';
        row.style.cursor = 'grab';
        row.ondragstart = (event) => event.dataTransfer.setData('text/plain', player.id);
        column.appendChild(row);
    });
}

function randomAssignTeams() {
    const assignments = {};
    roomPlayers.forEach((player, index) => {
        assignments[player.id] = TEAM_NAMES[index % (currentRoom?.teamCount || 2)];
    });
    teamAssignments = assignments;
    sendMultiplayer({ type: 'assignTeams', assignments });
    renderHome('publicReady');
}

let latestRooms = [];

function renderRoomList() {
    const list = document.getElementById('room-list');
    if (!list) return;
    list.innerHTML = '';

    if (latestRooms.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = 'No public games active yet.';
        empty.style.opacity = '0.75';
        list.appendChild(empty);
        return;
    }

    latestRooms.forEach((room) => {
        const modeLabel = room.kind === 'tournament' ? 'TOURNAMENT' : (room.kind === 'team' ? 'TEAM' : 'CLASSIC');
        const statusLabel = room.status === 'started' ? 'IN PROGRESS' : 'WAITING';
        const item = homeButton(modeLabel + '    ' + statusLabel + '    ' + room.code + '    ' + room.players + ' player' + (room.players === 1 ? '' : 's') + ' active');
        item.style.textAlign = 'left';
        item.onclick = () => showRoomDialog(room);
        list.appendChild(item);
    });
}

function showRoomDialog(room) {
    const dialog = document.createElement('div');
    dialog.style.position = 'absolute';
    dialog.style.inset = '0';
    dialog.style.zIndex = '40';
    dialog.style.display = 'flex';
    dialog.style.alignItems = 'center';
    dialog.style.justifyContent = 'center';
    dialog.style.background = 'rgba(0, 0, 0, 0.55)';
    homeScreen.appendChild(dialog);

    const box = document.createElement('div');
    box.style.background = '#211b2c';
    box.style.border = '1px solid #6d6478';
    box.style.padding = '20px';
    box.style.minWidth = '300px';
    dialog.appendChild(box);

    const info = document.createElement('div');
    info.textContent = 'Game code: ' + room.code + ' | Players active: ' + room.players + ' | ' + (room.kind === 'tournament' ? 'Tournament match' : (room.kind === 'team' ? 'Team match' : 'Classic match'));
    info.style.marginBottom = '14px';
    box.appendChild(info);

    const start = homeButton(room.status === 'started' ? 'Join game' : 'Start game');
    const copy = homeButton('Copy game code');
    const close = homeButton('Close');
    box.append(start, copy, close);

    start.onclick = () => sendMultiplayer({ type: 'joinRoom', code: room.code });
    copy.onclick = () => navigator.clipboard?.writeText(room.code);
    close.onclick = () => dialog.remove();
}

renderHome();

// 3. Core Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1525); 

const GAME_ASPECT = 16 / 9;
const RENDER_BASES = [
    { width: 640, height: 360 },
    { width: 836, height: 470 },
    { width: 1031, height: 580 }
];

const camera = new THREE.PerspectiveCamera(60, GAME_ASPECT, 0.1, 1000);
camera.position.set(0, 10, 25); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.left = '50%';
renderer.domElement.style.top = '50%';
renderer.domElement.style.transform = 'translate(-50%, -50%)';
renderer.domElement.style.display = 'block';
document.body.appendChild(renderer.domElement);

function chooseRenderBase() {
    const longestSide = Math.max(window.innerWidth, window.innerHeight);
    return RENDER_BASES.find((base) => longestSide <= base.width) || RENDER_BASES[RENDER_BASES.length - 1];
}

function resizeGameCanvas() {
    const viewportWidth = Math.max(1, window.innerWidth);
    const viewportHeight = Math.max(1, window.innerHeight);
    const viewportAspect = viewportWidth / viewportHeight;
    let cssWidth;
    let cssHeight;

    if (viewportAspect > GAME_ASPECT) {
        cssWidth = viewportWidth;
        cssHeight = viewportWidth / GAME_ASPECT;
    } else {
        cssHeight = viewportHeight;
        cssWidth = viewportHeight * GAME_ASPECT;
    }

    const base = chooseRenderBase();
    renderer.setSize(base.width, base.height, false);
    renderer.domElement.style.width = cssWidth + 'px';
    renderer.domElement.style.height = cssHeight + 'px';
    camera.aspect = GAME_ASPECT;
    camera.updateProjectionMatrix();
}

resizeGameCanvas();

let cameraYaw = Math.PI;
let cameraPitch = -0.28;
const PLAYER_MOVE_SPEED = 13.5;
let ARENA_LIMIT = 28;

function cameraForward() {
    const cosPitch = Math.cos(cameraPitch);
    return new THREE.Vector3(
        Math.sin(cameraYaw) * cosPitch,
        Math.sin(cameraPitch),
        Math.cos(cameraYaw) * cosPitch
    ).normalize();
}

function cameraPlanarForward() {
    return new THREE.Vector3(Math.sin(cameraYaw), 0, Math.cos(cameraYaw));
}

function applyCameraLook() {
    const forward = cameraForward();
    camera.lookAt(new THREE.Vector3().copy(camera.position).add(forward));
}

function setLookAtTarget(target) {
    const direction = new THREE.Vector3().subVectors(target, camera.position).normalize();
    cameraPitch = Math.asin(THREE.MathUtils.clamp(direction.y, -0.8, 0.8));
    cameraYaw = Math.atan2(direction.x, direction.z);
    applyCameraLook();
}

applyCameraLook();

// 4. Lighting & Ground Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(20, 40, 20);
dirLight.castShadow = true;
scene.add(dirLight);

function makeGroundTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#26352d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < 512; y += 32) {
        for (let x = 0; x < 512; x += 32) {
            ctx.fillStyle = (x + y) % 64 === 0 ? '#314637' : '#223126';
            ctx.fillRect(x, y, 32, 32);
        }
    }
    ctx.strokeStyle = 'rgba(197, 217, 143, 0.28)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
}

const groundGeo = new THREE.PlaneGeometry(64, 64);
const groundMat = new THREE.MeshStandardMaterial({ map: makeGroundTexture(), color: 0xffffff, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 5. System States & Track References
let dinosaurMesh;
const dinosaurs = [];
const mixers = [];
let dinoTemplate = null;
let dinoAnimations = [];

const DINO_SCALE_DEFAULT = 0.005; 
let dinoRadius = 1.2; 
let desiredDinoCount = 6;
let DINO_WANDER_RADIUS = 27;
const DINO_SPEED = 11.5;
const DINO_KEEP_APART = 7.5;
const DINO_HARD_RADIUS = 5.6;
const DINO_PLAN_SECONDS = 2.4;
const DINO_FALL_LIFT = 0.58;

const timer = new THREE.Timer();
timer.connect(document);

function randomPointInArena() {
    const angle = Math.random() * Math.PI * 2;
    const radius = THREE.MathUtils.randFloat(8, DINO_WANDER_RADIUS);
    return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}

function nearestDinoDistance(point, ignoredDino = null) {
    let closest = Infinity;

    for (const other of dinosaurs) {
        if (other === ignoredDino) continue;
        if (other.userData.state && other.userData.state !== 'alive') continue;
        const otherPoint = other.userData.target || other.position;
        closest = Math.min(
            closest,
            point.distanceTo(other.position),
            point.distanceTo(otherPoint)
        );
    }

    return closest;
}

function predictedPosition(dino, secondsAhead) {
    const current = new THREE.Vector3(dino.position.x, 0, dino.position.z);
    const target = dino.userData.target || current;
    const toTarget = new THREE.Vector3().subVectors(target, current);
    const distance = toTarget.length();

    if (distance < 0.001 || dino.userData.pauseTimer > 0) {
        return current;
    }

    const travel = Math.min(distance, dino.userData.speed * secondsAhead);
    return current.addScaledVector(toTarget.normalize(), travel);
}

function candidateHasClearFuture(dino, candidate) {
    const candidateDistance = new THREE.Vector3().subVectors(candidate, dino.position).length();

    for (const other of dinosaurs) {
        if (other === dino) continue;
        if (other.userData.state && other.userData.state !== 'alive') continue;

        for (let t = 0; t <= DINO_PLAN_SECONDS; t += 0.75) {
            const dinoTravel = Math.min(candidateDistance, dino.userData.speed * t);
            const planned = new THREE.Vector3(dino.position.x, 0, dino.position.z);
            const toCandidate = new THREE.Vector3().subVectors(candidate, planned);
            if (toCandidate.lengthSq() > 0.001) {
                planned.addScaledVector(toCandidate.normalize(), dinoTravel);
            }

            if (planned.distanceTo(predictedPosition(other, t)) < DINO_KEEP_APART) {
                return false;
            }
        }
    }

    return true;
}

function chooseDinoTarget(dino) {
    let bestCandidate = null;
    let bestDistance = -Infinity;

    for (let attempt = 0; attempt < 36; attempt++) {
        const candidate = randomPointInArena();
        if (candidateHasClearFuture(dino, candidate)) {
            dino.userData.target.copy(candidate);
            return;
        }

        const spacing = nearestDinoDistance(candidate, dino);
        if (spacing > bestDistance) {
            bestDistance = spacing;
            bestCandidate = candidate;
        }
    }

    dino.userData.target.copy(bestCandidate || randomPointInArena());
}

function separationForceFor(dino) {
    const force = new THREE.Vector3();

    for (const other of dinosaurs) {
        if (other === dino) continue;
        if (other.userData.state && other.userData.state !== 'alive') continue;

        const away = new THREE.Vector3().subVectors(dino.position, other.position);
        away.y = 0;
        const distance = away.length();

        if (distance < 0.001) {
            force.x += Math.random() - 0.5;
            force.z += Math.random() - 0.5;
            continue;
        }

        if (distance < DINO_KEEP_APART) {
            const strength = (DINO_KEEP_APART - distance) / DINO_KEEP_APART;
            force.addScaledVector(away.normalize(), strength * 2.6);
        }
    }

    return force;
}

function enforceDinoSpacing() {
    for (let a = 0; a < dinosaurs.length; a++) {
        for (let b = a + 1; b < dinosaurs.length; b++) {
            const first = dinosaurs[a];
            const second = dinosaurs[b];
            if (first.userData.state !== 'alive' || second.userData.state !== 'alive') continue;
            if (first.userData.tutorialFrozen || second.userData.tutorialFrozen) continue;
            const deltaPos = new THREE.Vector3().subVectors(second.position, first.position);
            deltaPos.y = 0;
            const distance = deltaPos.length();

            if (distance >= DINO_HARD_RADIUS) continue;

            const normal = distance > 0.001
                ? deltaPos.normalize()
                : new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            const push = (DINO_HARD_RADIUS - Math.max(distance, 0.001)) * 0.5;

            first.position.addScaledVector(normal, -push);
            second.position.addScaledVector(normal, push);
            first.position.y = 0;
            second.position.y = 0;

            chooseDinoTarget(first);
            chooseDinoTarget(second);
        }
    }
}

function setDinoVisualState(dino, visible, opacity = 1) {
    dino.visible = visible;

    dino.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
            material.transparent = opacity < 1;
            material.opacity = opacity;
        });
    });
}

function setDinoWalking(dino, walking) {
    if (!dino.userData.walkAction) return;
    dino.userData.walkAction.paused = !walking;
    dino.userData.walkAction.enabled = true;
    if (walking && !dino.userData.walkAction.isRunning()) dino.userData.walkAction.play();
}

function placeDinoAtRespawn(dino) {
    let bestPoint = randomPointInArena();
    let bestDistance = -Infinity;

    for (let attempt = 0; attempt < 32; attempt++) {
        const candidate = randomPointInArena();
        const spacing = nearestDinoDistance(candidate, dino);
        if (spacing > bestDistance) {
            bestDistance = spacing;
            bestPoint = candidate;
        }
    }

    dino.position.copy(bestPoint);
    dino.position.y = 0;
    dino.rotation.set(0, Math.random() * Math.PI * 2, 0);
    dino.scale.setScalar(DINO_SCALE_DEFAULT);
    setDinoWalking(dino, true);
    chooseDinoTarget(dino);
}

function startDinoDeath(dino) {
    if (dino.userData.state === 'dead' || dino.userData.state === 'falling') return;

    spawnDinoExplosion(dino.position);
    setDinoWalking(dino, false);
    dino.userData.state = 'falling';
    dino.userData.deathTimer = 0;
    dino.userData.fallDirection = Math.random() < 0.5 ? 1 : -1;
    dino.userData.startRotationZ = dino.rotation.z;
    dino.userData.targetRotationZ = dino.userData.fallDirection * Math.PI / 2;
    dino.userData.hp = 0;
    updateHpBar(dino);
}

function updateDinoDeath(dino, delta) {
    if (dino.userData.state !== 'falling' && dino.userData.state !== 'dead') return false;

    dino.userData.deathTimer += delta;

    if (dino.userData.state === 'falling') {
        const fallProgress = Math.min(1, dino.userData.deathTimer / 0.65);
        const eased = 1 - Math.pow(1 - fallProgress, 3);
        dino.rotation.z = THREE.MathUtils.lerp(dino.userData.startRotationZ, dino.userData.targetRotationZ, eased);
        dino.rotation.x = THREE.MathUtils.lerp(0, -0.18, eased);
        dino.position.y = DINO_FALL_LIFT * eased;

        if (fallProgress >= 1) {
            dino.userData.state = 'dead';
            dino.userData.deathTimer = 0;
        }
        updateHpBar(dino);
        return true;
    }

    const fadeStart = 0.45;
    const respawnAt = 1.45;
    if (dino.userData.deathTimer <= fadeStart) {
        updateHpBar(dino);
    } else {
        dino.userData.hpBar.wrapper.style.display = 'none';
        const fade = 1 - Math.min(1, (dino.userData.deathTimer - fadeStart) / (respawnAt - fadeStart));
        setDinoVisualState(dino, true, fade);
    }

    if (dino.userData.deathTimer >= respawnAt) {
        placeDinoAtRespawn(dino);
        dino.userData.hp = dino.userData.maxHp;
        dino.userData.state = 'alive';
        dino.userData.deathTimer = 0;
        dino.userData.replanCooldown = 0.4;
        setDinoVisualState(dino, true, 1);
        updateHpBar(dino);
    }

    return true;
}

function setupDinosaur(dino, index, animations) {
    const spacingAngle = (index / Math.max(1, desiredDinoCount)) * Math.PI * 2;
    const spacingRadius = Math.min(DINO_WANDER_RADIUS * 0.7, 18 + Math.sqrt(index) * 3);

    dino.position.set(Math.cos(spacingAngle) * spacingRadius, 0, Math.sin(spacingAngle) * spacingRadius);
    dino.userData.target = new THREE.Vector3();
    dino.userData.speed = DINO_SPEED * THREE.MathUtils.randFloat(0.88, 1.12);
    dino.userData.pauseTimer = Math.random() * 0.6;
    dino.userData.replanCooldown = Math.random() * 0.5;
    dino.userData.maxHp = 100;
    dino.userData.hp = dino.userData.maxHp;
    dino.userData.hpBar = createHpBar();
    dino.userData.state = 'alive';
    dino.userData.deathTimer = 0;
    chooseDinoTarget(dino);

    scene.add(dino);
    dinosaurs.push(dino);
    if (!dinosaurMesh) dinosaurMesh = dino;

    if (animations && animations.length > 0) {
        const mixer = new THREE.AnimationMixer(dino);
        const runIndex = animations.findIndex((clip) => clip.name.toLowerCase().includes('run'));
        const startingTrack = runIndex >= 0 ? runIndex : (animations[1] ? 1 : 0);
        const action = mixer.clipAction(animations[startingTrack]);
        action.timeScale = 0.95 + Math.random() * 0.25;
        action.play();
        dino.userData.walkMixer = mixer;
        dino.userData.walkAction = action;
        mixers.push(mixer);
    }
}

function ensureDinosaurCount() {
    while (dinosaurs.length > desiredDinoCount) {
        const dino = dinosaurs.pop();
        scene.remove(dino);
        dino.userData.hpBar?.wrapper.remove();
        if (dino.userData.walkMixer) {
            dino.userData.walkMixer.stopAllAction();
            const mixerIndex = mixers.indexOf(dino.userData.walkMixer);
            if (mixerIndex >= 0) mixers.splice(mixerIndex, 1);
        }
    }
    if (!dinoTemplate) return;
    while (dinosaurs.length < desiredDinoCount) {
        const clone = dinoAnimations.length ? cloneSkinnedMesh(dinoTemplate) : dinoTemplate.clone(true);
        setupDinosaur(clone, dinosaurs.length, dinoAnimations);
    }
}

function configureArena(playerCount = 1) {
    const players = Math.max(1, Number(playerCount) || 1);
    const populationScale = Math.sqrt(Math.max(1, players / 4));
    ARENA_LIMIT = Math.min(140, Math.max(28, Math.round(28 * populationScale)));
    DINO_WANDER_RADIUS = ARENA_LIMIT - 1;
    desiredDinoCount = Math.min(80, Math.max(6, Math.ceil(6 + (players - 1) * 0.3)));
    const arenaSize = ARENA_LIMIT * 2 + 8;
    ground.scale.set(arenaSize / 64, arenaSize / 64, 1);
    if (ground.material.map) {
        const repeats = Math.max(6, Math.round(arenaSize / 10));
        ground.material.map.repeat.set(repeats, repeats);
        ground.material.map.needsUpdate = true;
    }
    ensureDinosaurCount();
}

function createFallbackTriceratops() {
    const dino = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0x777b78, roughness: 0.9 });
    const horn = new THREE.MeshStandardMaterial({ color: 0xd8d5c8, roughness: 0.85 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.25, 14, 10), skin);
    body.scale.set(1.45, 0.78, 0.72);
    body.position.y = 1.25;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 14, 10), skin);
    head.position.set(0, 1.3, 1.35);
    const frill = new THREE.Mesh(new THREE.SphereGeometry(0.92, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.7), skin);
    frill.scale.set(1.15, 1.05, 0.28);
    frill.position.set(0, 1.65, 0.98);
    frill.rotation.x = -0.3;
    dino.add(body, head, frill);

    [-0.72, 0.72].forEach((x) => {
        [-0.6, 0.58].forEach((z) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 1.05, 8), skin);
            leg.position.set(x, 0.55, z);
            dino.add(leg);
        });
        const browHorn = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.9, 8), horn);
        browHorn.position.set(x * 0.38, 1.72, 1.83);
        browHorn.rotation.x = Math.PI / 2.35;
        dino.add(browHorn);
    });
    const noseHorn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.58, 8), horn);
    noseHorn.position.set(0, 1.45, 2.0);
    noseHorn.rotation.x = Math.PI / 2.2;
    dino.add(noseHorn);
    dino.traverse((child) => { if (child.isMesh) child.castShadow = true; });
    return dino;
}

function spawnFallbackDinosaurs() {
    if (dinosaurs.length) return;
    dinoTemplate = createFallbackTriceratops();
    dinoAnimations = [];
    ensureDinosaurCount();
}

// 6. Load the Triceratops relative to the page so subfolder hosting also works.
const loader = new FBXLoader();
const triceratopsUrl = new URL('Triceratops.fbx', document.baseURI).href;
const originalConsoleWarn = console.warn;
const excessSkinWeightWarning = 'THREE.FBXLoader: Vertex has more than 4 skinning weights assigned to vertex. Deleting additional weights.';
console.warn = (...args) => {
    if (args[0] !== excessSkinWeightWarning) originalConsoleWarn(...args);
};

function restoreConsoleWarnings() {
    if (console.warn !== originalConsoleWarn) console.warn = originalConsoleWarn;
}

loader.load(
    triceratopsUrl,
    (fbx) => {
        restoreConsoleWarnings();
        fbx.scale.setScalar(DINO_SCALE_DEFAULT); 
        fbx.position.set(0, 0, 0);
        
        fbx.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        dinoTemplate = fbx;
        dinoAnimations = fbx.animations || [];
        ensureDinosaurCount();

    },
    undefined,
    (error) => {
        restoreConsoleWarnings();
        spawnFallbackDinosaurs();
    }
);

// 7. Modern Low-Poly Kettle Factory Configuration
const activeKettles = [];
const activeExplosions = [];
const activeShockwaves = [];
const explosionSparkGeo = new THREE.SphereGeometry(0.075, 8, 6);
const explosionRingGeo = new THREE.TorusGeometry(1, 0.06, 8, 48);
const explosionFlashGeo = new THREE.SphereGeometry(1, 24, 16);
const smokePuffGeo = new THREE.SphereGeometry(1, 14, 10);
const shockwaveDomeGeo = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);

function makeRadialTexture(innerColor, outerColor, size = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, innerColor);
    gradient.addColorStop(0.38, innerColor);
    gradient.addColorStop(1, outerColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

const fireballTexture = makeRadialTexture('rgba(255, 250, 180, 1)', 'rgba(255, 80, 0, 0)');
const smokeTexture = makeRadialTexture('rgba(80, 80, 76, 0.72)', 'rgba(32, 31, 34, 0)');

function makeExplosionSprite(texture, color, opacity, scale) {
    const material = new THREE.SpriteMaterial({
        map: texture,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(scale);
    return sprite;
}

function spawnDinoExplosion(position) {
    const origin = new THREE.Vector3(position.x, position.y + 1.05, position.z);
    const group = new THREE.Group();
    group.position.copy(origin);
    scene.add(group);

    const flash = new THREE.Mesh(
        explosionFlashGeo,
        new THREE.MeshBasicMaterial({ color: 0xfff1a6, transparent: true, opacity: 0.86, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    flash.scale.setScalar(0.7);
    group.add(flash);

    const fireballs = [];
    const fireColors = [0xffffff, 0xfff08a, 0xffb12b, 0xff5a1f, 0xff2d20];
    for (let i = 0; i < 18; i++) {
        const sprite = makeExplosionSprite(fireballTexture, fireColors[i % fireColors.length], 0.95, THREE.MathUtils.randFloat(1.4, 2.7));
        const angle = (i / 18) * Math.PI * 2 + THREE.MathUtils.randFloatSpread(0.22);
        const distance = THREE.MathUtils.randFloat(0.15, 0.8);
        sprite.position.set(Math.cos(angle) * distance, THREE.MathUtils.randFloat(-0.2, 0.85), Math.sin(angle) * distance);
        group.add(sprite);
        fireballs.push({
            sprite,
            velocity: new THREE.Vector3(Math.cos(angle) * THREE.MathUtils.randFloat(4.2, 7.8), THREE.MathUtils.randFloat(1.4, 4.8), Math.sin(angle) * THREE.MathUtils.randFloat(4.2, 7.8)),
            startScale: sprite.scale.x,
            wobble: Math.random() * Math.PI * 2
        });
    }

    const sparks = [];
    for (let i = 0; i < 72; i++) {
        const material = new THREE.MeshBasicMaterial({
            color: fireColors[i % fireColors.length],
            transparent: true,
            opacity: 1,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const spark = new THREE.Mesh(explosionSparkGeo, material);
        const direction = new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(1.8),
            THREE.MathUtils.randFloat(-0.05, 1.35),
            THREE.MathUtils.randFloatSpread(1.8)
        ).normalize();
        spark.scale.setScalar(THREE.MathUtils.randFloat(1.2, 3.3));
        group.add(spark);
        sparks.push({
            mesh: spark,
            velocity: direction.multiplyScalar(THREE.MathUtils.randFloat(6.5, 15.5)),
            spin: new THREE.Vector3(Math.random() * 13, Math.random() * 13, Math.random() * 13)
        });
    }

    const rings = [0xfff08a, 0xff8f22, 0xff3422].map((color, index) => {
        const ring = new THREE.Mesh(
            explosionRingGeo,
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.82 - index * 0.18, depthWrite: false, blending: THREE.AdditiveBlending })
        );
        ring.rotation.x = Math.PI / 2;
        ring.scale.setScalar(0.08 + index * 0.08);
        group.add(ring);
        return ring;
    });

    const smoke = [];
    for (let i = 0; i < 30; i++) {
        const material = new THREE.SpriteMaterial({
            map: smokeTexture,
            color: i < 10 ? 0x332f2b : 0x575755,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        const puff = new THREE.Sprite(material);
        const angle = Math.random() * Math.PI * 2;
        const radius = THREE.MathUtils.randFloat(0.1, 0.8);
        puff.position.set(Math.cos(angle) * radius, THREE.MathUtils.randFloat(-0.15, 0.5), Math.sin(angle) * radius);
        puff.scale.setScalar(THREE.MathUtils.randFloat(0.55, 1.1));
        group.add(puff);
        smoke.push({
            sprite: puff,
            delay: THREE.MathUtils.randFloat(0.12, 0.85),
            velocity: new THREE.Vector3(Math.cos(angle) * THREE.MathUtils.randFloat(0.15, 0.9), THREE.MathUtils.randFloat(1.0, 2.6), Math.sin(angle) * THREE.MathUtils.randFloat(0.15, 0.9)),
            grow: THREE.MathUtils.randFloat(1.15, 2.0),
            spin: THREE.MathUtils.randFloatSpread(1.1)
        });
    }

    activeExplosions.push({ group, flash, fireballs, sparks, rings, smoke, life: 0, maxLife: 3.1 });
}

function updateExplosions(delta) {
    for (let i = activeExplosions.length - 1; i >= 0; i--) {
        const explosion = activeExplosions[i];
        explosion.life += delta;
        const fireProgress = Math.min(1, explosion.life / 0.72);

        explosion.flash.scale.setScalar(0.7 + fireProgress * 4.2);
        explosion.flash.material.opacity = Math.max(0, 0.86 * (1 - fireProgress));

        explosion.fireballs.forEach((fireball) => {
            fireball.sprite.position.addScaledVector(fireball.velocity, delta);
            fireball.sprite.position.y += Math.sin(explosion.life * 11 + fireball.wobble) * delta * 0.9;
            fireball.sprite.scale.setScalar(fireball.startScale * (1 + fireProgress * 1.5));
            fireball.sprite.material.opacity = Math.max(0, 0.98 * (1 - fireProgress));
        });

        explosion.sparks.forEach((spark) => {
            spark.velocity.y -= 9.2 * delta;
            spark.mesh.position.addScaledVector(spark.velocity, delta);
            spark.mesh.rotation.x += spark.spin.x * delta;
            spark.mesh.rotation.y += spark.spin.y * delta;
            spark.mesh.rotation.z += spark.spin.z * delta;
            spark.mesh.material.opacity = Math.max(0, 1 - fireProgress * 1.2);
            spark.mesh.scale.multiplyScalar(1 + delta * 1.8);
        });

        explosion.rings.forEach((ring, index) => {
            ring.scale.setScalar(0.1 + fireProgress * (3.2 + index * 1.2));
            ring.material.opacity = Math.max(0, (0.78 - index * 0.16) * (1 - fireProgress));
        });

        explosion.smoke.forEach((puff) => {
            const localLife = explosion.life - puff.delay;
            if (localLife <= 0) return;
            const puffProgress = Math.min(1, localLife / 2.2);
            puff.sprite.position.addScaledVector(puff.velocity, delta);
            puff.sprite.material.rotation += puff.spin * delta;
            puff.sprite.scale.addScalar(delta * puff.grow);
            const appear = Math.min(1, localLife / 0.45);
            puff.sprite.material.opacity = Math.max(0, 0.62 * appear * (1 - puffProgress));
            puff.sprite.material.color.lerp(new THREE.Color(0x76736d), delta * 0.55);
        });

        if (explosion.life >= explosion.maxLife) {
            scene.remove(explosion.group);
            explosion.group.traverse((child) => {
                if (child.material) child.material.dispose?.();
            });
            activeExplosions.splice(i, 1);
        }
    }
}

function spawnGroundShockwave(position) {
    const material = new THREE.MeshBasicMaterial({
        color: 0x35e9ff,
        transparent: true,
        opacity: 0.62,
        wireframe: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
    });
    const dome = new THREE.Mesh(shockwaveDomeGeo, material);
    dome.position.set(position.x, 0.05, position.z);
    dome.scale.setScalar(0.25);
    scene.add(dome);
    activeShockwaves.push({ dome, life: 0, maxLife: 0.72 });
}

function updateGroundShockwaves(delta) {
    for (let index = activeShockwaves.length - 1; index >= 0; index--) {
        const shockwave = activeShockwaves[index];
        shockwave.life += delta;
        const progress = Math.min(1, shockwave.life / shockwave.maxLife);
        const eased = 1 - Math.pow(1 - progress, 3);
        shockwave.dome.scale.setScalar(0.25 + eased * ADVANCED_BLAST_RADIUS);
        shockwave.dome.material.opacity = 0.62 * (1 - progress);
        if (progress >= 1) {
            scene.remove(shockwave.dome);
            shockwave.dome.material.dispose();
            activeShockwaves.splice(index, 1);
        }
    }
}

const kettleMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, flatShading: true, roughness: 0.4, metalness: 0.2 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0x111111, flatShading: true });

const kettleBodyGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.7, 6); 
const kettleSpoutGeo = new THREE.CylinderGeometry(0.02, 0.06, 0.25, 4); 
const kettleHandleGeo = new THREE.BoxGeometry(0.08, 0.5, 0.15); 
const advancedRingGeo = new THREE.TorusGeometry(0.42, 0.055, 8, 24);

function createStandardKettleModel(color, powerLevel = 0) {
    const group = new THREE.Group();
    const bodyMaterial = kettleMat.clone();
    bodyMaterial.color.setHex(color);
    if (powerLevel > 0) {
        bodyMaterial.emissive = new THREE.Color(color);
        bodyMaterial.emissiveIntensity = Math.min(0.85, 0.1 + Math.sqrt(powerLevel) * 0.12);
        bodyMaterial.metalness = Math.min(0.85, 0.28 + Math.sqrt(powerLevel) * 0.08);
    }
    const body = new THREE.Mesh(kettleBodyGeo, bodyMaterial);
    const spout = new THREE.Mesh(kettleSpoutGeo, kettleMat);
    spout.position.set(0, 0.15, 0.35);
    spout.rotation.x = 0.6;
    const handle = new THREE.Mesh(kettleHandleGeo, handleMat);
    handle.position.set(0, 0.05, -0.4);
    group.add(body, spout, handle);

    const visibleBands = Math.min(3, Math.ceil(powerLevel / 3));
    const bandColors = [0x66f7ff, 0xffd93d, 0xff6b35];
    for (let index = 0; index < visibleBands; index++) {
        const bandMaterial = new THREE.MeshStandardMaterial({
            color: bandColors[index],
            emissive: bandColors[index],
            emissiveIntensity: 0.8 + Math.min(1.2, powerLevel * 0.05),
            metalness: 0.65,
            roughness: 0.2
        });
        const band = new THREE.Mesh(advancedRingGeo, bandMaterial);
        band.scale.setScalar(0.88);
        band.rotation.x = Math.PI / 2;
        band.position.y = visibleBands === 1 ? 0 : -0.2 + index * 0.2;
        band.userData.preserveColor = true;
        group.add(band);
    }
    group.traverse((child) => { if (child.isMesh) child.castShadow = true; });
    return group;
}

function createAdvancedKettleModel() {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x35e9ff,
        emissive: 0x087b9b,
        emissiveIntensity: 1.8,
        metalness: 0.7,
        roughness: 0.18
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd93d,
        emissive: 0xff5f00,
        emissiveIntensity: 1.4,
        metalness: 0.45,
        roughness: 0.22
    });
    const body = new THREE.Mesh(kettleBodyGeo, bodyMaterial);
    const spout = new THREE.Mesh(kettleSpoutGeo, accentMaterial);
    spout.position.set(0, 0.15, 0.35);
    spout.rotation.x = 0.6;
    const handle = new THREE.Mesh(kettleHandleGeo, accentMaterial);
    handle.position.set(0, 0.05, -0.4);
    const upperRing = new THREE.Mesh(advancedRingGeo, accentMaterial);
    upperRing.rotation.x = Math.PI / 2;
    upperRing.position.y = 0.18;
    const lowerRing = upperRing.clone();
    lowerRing.position.y = -0.18;
    group.add(body, spout, handle, upperRing, lowerRing);
    group.traverse((child) => { if (child.isMesh) child.castShadow = true; });
    return group;
}

function createKettle(launchPos, velocityVector, ownerColor = localPlayerColor, shouldBroadcast = true, ownerId = localPlayerId, options = {}) {
    const kettleGroup = new THREE.Group();
    const advanced = Boolean(options.advanced);

    if (advanced) {
        kettleGroup.add(createAdvancedKettleModel());
    } else {
        kettleGroup.add(createStandardKettleModel(ownerColor, options.powerLevel || 0));
    }

    kettleGroup.scale.setScalar(options.sizeMultiplier || 1);
    kettleGroup.position.copy(launchPos);
    scene.add(kettleGroup);

    activeKettles.push({
        mesh: kettleGroup,
        velocity: velocityVector,
        rotVelocity: new THREE.Vector3(Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3),
        radius: 0.45 * (options.sizeMultiplier || 1),
        damage: options.damage || 25,
        advanced,
        ownerColor,
        ownerId
    });

    if (shouldBroadcast && currentRoom) {
        sendMultiplayer({
            type: 'kettleLaunch',
            position: launchPos.toArray(),
            velocity: velocityVector.toArray(),
            color: ownerColor,
            sizeMultiplier: options.sizeMultiplier || 1,
            damage: options.damage || 25,
            powerLevel: options.powerLevel || 0,
            advanced
        });
    }
} // <--- The function closes completely here!

// --- Minecraft In-Hand View System (Sits outside the function) ---
let heldKettleGroup = new THREE.Group();
heldKettleGroup.add(createStandardKettleModel(localPlayerColor, upgradeLevel('kettlePower')));
let heldKettleStyleKey = localPlayerColor + ':' + upgradeLevel('kettlePower');
heldKettleGroup.scale.setScalar(0.7);
scene.add(heldKettleGroup);

const heldAdvancedKettleGroup = createAdvancedKettleModel();
heldAdvancedKettleGroup.scale.setScalar(0.82);
heldAdvancedKettleGroup.visible = false;
scene.add(heldAdvancedKettleGroup);

function updateHeldKettleStyle() {
    if (!heldKettleGroup || !heldAdvancedKettleGroup) return;
    const styleKey = localPlayerColor + ':' + upgradeLevel('kettlePower');
    if (styleKey !== heldKettleStyleKey) {
        heldKettleGroup.clear();
        heldKettleGroup.add(createStandardKettleModel(localPlayerColor, upgradeLevel('kettlePower')));
        heldKettleStyleKey = styleKey;
    }
    heldKettleGroup.scale.setScalar(0.7 * kettleSizeMultiplier());
    heldKettleGroup.visible = !advancedKettleSelected;
    heldAdvancedKettleGroup.visible = advancedKettleSelected;
}

const MYSTERY_BOX_SPEED = DINO_SPEED * 0.7;
const ADVANCED_BLAST_RADIUS = 7.5;
const MYSTERY_SPAWN_MIN = 55;
const MYSTERY_SPAWN_MAX = 80;
const activeBonusPickups = [];
const bonusBoxes = [];
let mysterySpawnTimer = THREE.MathUtils.randFloat(MYSTERY_SPAWN_MIN, MYSTERY_SPAWN_MAX);
let bonusPickupsRemaining = 0;

function maximumBonusBoxes() {
    const players = currentRoom?.players || (gameMode === 'ai' ? 2 : 1);
    return Math.max(1, Math.ceil(players / 8));
}

function mysteryTarget() {
    const angle = Math.random() * Math.PI * 2;
    const radius = THREE.MathUtils.randFloat(7, DINO_WANDER_RADIUS - 2);
    return new THREE.Vector3(Math.cos(angle) * radius, 1.45, Math.sin(angle) * radius);
}

function removeMysteryBox(box = null) {
    const target = box || bonusBoxes[0];
    if (!target) return;
    scene.remove(target.group);
    const index = bonusBoxes.indexOf(target);
    if (index >= 0) bonusBoxes.splice(index, 1);
}

function resetMysteryBox() {
    while (bonusBoxes.length) removeMysteryBox(bonusBoxes[0]);
    activeBonusPickups.forEach((pickup) => scene.remove(pickup.mesh));
    activeBonusPickups.length = 0;
    bonusPickupsRemaining = 0;
    mysterySpawnTimer = THREE.MathUtils.randFloat(MYSTERY_SPAWN_MIN, MYSTERY_SPAWN_MAX);
}

function spawnMysteryBox() {
    if (bonusBoxes.length >= maximumBonusBoxes()) return null;
    const group = new THREE.Group();
    const coreGeometry = new THREE.BoxGeometry(1.9, 1.9, 1.9);
    const core = new THREE.Mesh(
        coreGeometry,
        new THREE.MeshStandardMaterial({ color: 0x061638, emissive: 0x001d5c, emissiveIntensity: 1.25, metalness: 0.72, roughness: 0.18 })
    );
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x28bfff, transparent: true, opacity: 1 });
    const shell = new THREE.LineSegments(new THREE.EdgesGeometry(coreGeometry), edgeMaterial);
    shell.scale.setScalar(1.08);
    const glowEdges = shell.clone();
    glowEdges.material = new THREE.LineBasicMaterial({ color: 0x006dff, transparent: true, opacity: 0.35 });
    glowEdges.scale.setScalar(1.2);
    const light = new THREE.PointLight(0x168cff, 3.8, 9);
    group.add(core, shell, glowEdges, light);

    const forward = cameraForward();
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const distance = THREE.MathUtils.randFloat(13, 20);
    group.position.copy(camera.position)
        .addScaledVector(forward, distance)
        .addScaledVector(right, THREE.MathUtils.randFloat(-7, 7));
    group.position.x = THREE.MathUtils.clamp(group.position.x, -DINO_WANDER_RADIUS + 2, DINO_WANDER_RADIUS - 2);
    group.position.z = THREE.MathUtils.clamp(group.position.z, -DINO_WANDER_RADIUS + 2, DINO_WANDER_RADIUS - 2);
    group.position.y = 1.45;
    scene.add(group);
    const bonusBox = { group, shell, target: mysteryTarget(), life: 0, maxLife: 15 };
    bonusBoxes.push(bonusBox);
    window.dispatchEvent(new CustomEvent('dino-supply-spawned'));
    return bonusBox;
}

function collectMysteryBox(position, box) {
    spawnDinoExplosion(position);
    triggerHitFeedback(true);
    bonusPickupsRemaining = 10;

    for (let index = 0; index < 10; index++) {
        const mesh = createAdvancedKettleModel();
        mesh.scale.setScalar(0.28);
        mesh.position.copy(position).add(new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(2.4),
            THREE.MathUtils.randFloat(0.3, 2.2),
            THREE.MathUtils.randFloatSpread(2.4)
        ));
        scene.add(mesh);
        activeBonusPickups.push({ mesh, life: index * -0.045 });
    }
    removeMysteryBox(box);
    mysterySpawnTimer = THREE.MathUtils.randFloat(MYSTERY_SPAWN_MIN, MYSTERY_SPAWN_MAX);
    handleTutorialMysteryCollected();
}

function updateMysteryBox(delta) {
    for (let index = activeBonusPickups.length - 1; index >= 0; index--) {
        const pickup = activeBonusPickups[index];
        pickup.life += delta;
        pickup.mesh.rotation.x += delta * 5;
        pickup.mesh.rotation.y += delta * 7;
        if (pickup.life < 0) continue;
        const destination = new THREE.Vector3(0.25, -0.15, -0.7).applyQuaternion(camera.quaternion).add(camera.position);
        pickup.mesh.position.lerp(destination, Math.min(1, delta * 4.5));
        pickup.mesh.scale.multiplyScalar(Math.max(0.86, 1 - delta * 1.5));
        if (pickup.life > 1.25 || pickup.mesh.position.distanceTo(destination) < 0.28) {
            scene.remove(pickup.mesh);
            activeBonusPickups.splice(index, 1);
            advancedKettleAmmo += 1;
            playerProfile.advancedKettles = advancedKettleAmmo;
            saveProfile();
            bonusPickupsRemaining = Math.max(0, bonusPickupsRemaining - 1);
            updateWeaponStatus();
            if (bonusPickupsRemaining === 0) {
                showScoreBurst('+10 BOMBS!', '#66f7ff', 'mega');
            }
        }
    }

    if (!gameStarted) return;
    mysterySpawnTimer -= delta;
    if (mysterySpawnTimer <= 0) {
        while (bonusBoxes.length < maximumBonusBoxes()) spawnMysteryBox();
        mysterySpawnTimer = THREE.MathUtils.randFloat(MYSTERY_SPAWN_MIN, MYSTERY_SPAWN_MAX);
    }
    [...bonusBoxes].forEach((bonusBox) => {
        bonusBox.life += delta;
        const toTarget = new THREE.Vector3().subVectors(bonusBox.target, bonusBox.group.position);
        toTarget.y = 0;
        if (toTarget.lengthSq() < 1.2) bonusBox.target = mysteryTarget();
        else bonusBox.group.position.addScaledVector(toTarget.normalize(), MYSTERY_BOX_SPEED * delta);
        bonusBox.group.position.y = 1.45 + Math.sin(bonusBox.life * 4.2) * 0.32;
        bonusBox.group.rotation.y += delta * 2.8;
        bonusBox.group.rotation.x = Math.sin(bonusBox.life * 1.7) * 0.18;
        bonusBox.shell.scale.setScalar(1 + Math.sin(bonusBox.life * 7) * 0.08);
        if (bonusBox.life >= bonusBox.maxLife) removeMysteryBox(bonusBox);
    });
}

function detonateAdvancedKettle(kettle) {
    const blastPosition = kettle.mesh.position.clone();
    spawnDinoExplosion(blastPosition);
    const localHit = kettle.ownerId === localPlayerId || !kettle.ownerId;
    let hitCount = 0;
    let defeatCount = 0;

    dinosaurs.forEach((dino) => {
        if (dino.userData.state !== 'alive') return;
        const center = dino.position.clone().add(new THREE.Vector3(0, 1, 0));
        const distance = center.distanceTo(blastPosition);
        if (distance > ADVANCED_BLAST_RADIUS) return;
        const falloff = 1 - distance / ADVANCED_BLAST_RADIUS;
        const directHit = distance <= dinoRadius + kettle.radius + 0.45;
        const powerScale = Math.max(0, (kettle.damage - 120) / 10);
        const minimumSplash = Math.round(38 + powerScale * 7);
        const damage = directHit
            ? dino.userData.maxHp
            : Math.max(minimumSplash, Math.round(kettle.damage * (0.34 + falloff * 0.66)));
        dino.userData.hp = Math.max(0, dino.userData.hp - damage);
        updateHpBar(dino);
        hitCount += 1;
        if (localHit) {
            score += 10;
            addCoins(10);
        }
        if (dino.userData.hp <= 0) {
            awardDinoDefeat(kettle.ownerId);
            defeatCount += 1;
            startDinoDeath(dino);
        } else {
            dino.scale.setScalar(DINO_SCALE_DEFAULT * 1.3);
            setTimeout(() => {
                if (dino.userData.state === 'alive') dino.scale.setScalar(DINO_SCALE_DEFAULT);
            }, 120);
        }
    });

    if (localHit && hitCount > 0) {
        lastHitNotice = 1.8;
        lastHitText = 'POWER BLAST! ' + hitCount + ' HIT' + (hitCount === 1 ? '' : 'S');
        showScoreBurst('POWER BLAST! +' + (hitCount * 10 + defeatCount * 50) + ' COINS', '#66f7ff', defeatCount ? 'mega' : 'big');
        triggerHitFeedback(defeatCount > 0);
        updateScoreUI();
    }
}

function createRemoteKettle(color, powerLevel = 0, sizeMultiplier = 1, advanced = false) {
    const group = advanced ? createAdvancedKettleModel() : createStandardKettleModel(color, powerLevel);
    group.scale.setScalar((advanced ? 0.82 : 0.7) * sizeMultiplier);
    return group;
}

function createRemotePlayer(player) {
    const playerColor = teamColor(player.team, player.color);
    const group = new THREE.Group();
    const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 20, 16),
        new THREE.MeshStandardMaterial({ color: playerColor, roughness: 0.55 })
    );
    ball.position.y = 1.1;
    ball.castShadow = true;
    group.add(ball);

    const remotePowerLevel = player.state?.powerLevel || 0;
    const remoteKettleSize = player.state?.kettleSize || 1;
    const remoteAdvanced = Boolean(player.state?.advancedSelected);
    const handKettle = createRemoteKettle(playerColor, remotePowerLevel, remoteKettleSize, remoteAdvanced);
    handKettle.position.set(0.65, 0.65, -0.85);
    group.add(handKettle);

    scene.add(group);
    const remote = {
        id: player.id,
        color: playerColor,
        group,
        body: ball,
        handKettle,
        kettleColor: playerColor,
        powerLevel: remotePowerLevel,
        kettleSize: remoteKettleSize,
        advancedSelected: remoteAdvanced,
        targetPosition: new THREE.Vector3(),
        targetQuaternion: new THREE.Quaternion(),
        name: player.name || player.id,
        score: player.score || 0,
        defeats: player.defeats || 0,
        team: player.team || null
    };
    setStat(player.id, { name: remote.name, score: remote.score, defeats: remote.defeats, color: playerColor, team: remote.team });
    if (player.state) {
        remote.targetPosition.fromArray(player.state.position);
        remote.targetQuaternion.fromArray(player.state.quaternion);
        group.position.copy(remote.targetPosition);
        group.quaternion.copy(remote.targetQuaternion);
    } else {
        const spawn = spawnForIndex(player.spawnIndex || 0);
        remote.targetPosition.copy(spawn.position);
        group.position.copy(spawn.position);
    }
    remotePlayers.set(player.id, remote);
}

function updateRemoteKettle(remote, powerLevel, kettleSize, advanced = false) {
    if (remote.powerLevel === powerLevel && remote.kettleSize === kettleSize && remote.kettleColor === remote.color && remote.advancedSelected === advanced) return;
    remote.group.remove(remote.handKettle);
    remote.handKettle = createRemoteKettle(remote.color, powerLevel, kettleSize, advanced);
    remote.handKettle.position.set(0.65, 0.65, -0.85);
    remote.group.add(remote.handKettle);
    remote.powerLevel = powerLevel;
    remote.kettleSize = kettleSize;
    remote.kettleColor = remote.color;
    remote.advancedSelected = advanced;
}

function createAiPlayer(difficulty) {
    const config = {
        easy: { speed: 7.5, fireGap: 2.2, accuracy: 0.45, thinkGap: 0.75 },
        medium: { speed: 9.5, fireGap: 1.55, accuracy: 0.58, thinkGap: 0.55 },
        hard: { speed: 11.5, fireGap: 1.05, accuracy: 0.72, thinkGap: 0.4 },
        'extra-hard': { speed: 13.5, fireGap: 0.72, accuracy: 0.86, thinkGap: 0.28 }
    }[difficulty] || { speed: 9.5, fireGap: 1.55, accuracy: 0.58, thinkGap: 0.55 };
    const spawn = spawnForIndex(1);
    aiPlayer = {
        id: 'AI',
        name: 'AI ' + difficulty,
        color: 0xff4242,
        position: spawn.position.clone(),
        target: randomPointInArena().setY(8),
        yaw: Math.PI,
        fireCooldown: 1.2,
        thinkCooldown: 0,
        config
    };
    createRemotePlayer({ id: aiPlayer.id, color: aiPlayer.color, name: aiPlayer.name, spawnIndex: 1, score: 0, defeats: 0 });
}

function updateAiPlayer(delta) {
    if (!aiPlayer) return;
    aiPlayer.thinkCooldown -= delta;
    if (aiPlayer.thinkCooldown <= 0 || aiPlayer.position.distanceTo(aiPlayer.target) < 1.2) {
        aiPlayer.thinkCooldown = aiPlayer.config.thinkGap;
        aiPlayer.target = randomPointInArena().setY(8);
    }
    const toTarget = new THREE.Vector3().subVectors(aiPlayer.target, aiPlayer.position);
    toTarget.y = 0;
    if (toTarget.lengthSq() > 0.01) {
        const dir = toTarget.normalize();
        aiPlayer.position.addScaledVector(dir, aiPlayer.config.speed * delta);
        aiPlayer.position.x = THREE.MathUtils.clamp(aiPlayer.position.x, -ARENA_LIMIT, ARENA_LIMIT);
        aiPlayer.position.z = THREE.MathUtils.clamp(aiPlayer.position.z, -ARENA_LIMIT, ARENA_LIMIT);
        aiPlayer.yaw = Math.atan2(dir.x, dir.z);
    }
    aiPlayer.fireCooldown -= delta;
    if (aiPlayer.fireCooldown <= 0) {
        aiPlayer.fireCooldown = aiPlayer.config.fireGap + Math.random() * 0.35;
        const living = dinosaurs.filter((dino) => dino.userData.state === 'alive');
        if (living.length) {
            const chosen = living.map((dino) => ({ dino, rank: Math.random() * 8 + (100 - dino.userData.hp) * 0.08 + aiPlayer.position.distanceTo(dino.position) * 0.03 })).sort((a, b) => b.rank - a.rank)[0].dino;
            const origin = aiPlayer.position.clone().add(new THREE.Vector3(0, -0.2, 0));
            const aim = chosen.position.clone().add(new THREE.Vector3(THREE.MathUtils.randFloatSpread(1.8 * (1 - aiPlayer.config.accuracy)), 1.0, THREE.MathUtils.randFloatSpread(1.8 * (1 - aiPlayer.config.accuracy))));
            const velocity = aim.sub(origin).normalize().multiplyScalar(31);
            velocity.y += 2.8;
            createKettle(origin, velocity, aiPlayer.color, false, aiPlayer.id);
        }
    }
    const remote = remotePlayers.get(aiPlayer.id);
    if (remote) {
        remote.targetPosition.copy(aiPlayer.position);
        remote.targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), aiPlayer.yaw);
    }
}

function awardDinoDefeat(ownerId) {
    if (ownerId === aiPlayer?.id) {
        aiDefeats += 1;
        setStat(aiPlayer.id, { defeats: aiDefeats, score: aiDefeats * 100 });
        return;
    }
    if (ownerId === localPlayerId || !ownerId) {
        localDefeats += 1;
        addCoins(50);
        setStat(localPlayerId, { defeats: localDefeats, score });
    }
}

function removeRemotePlayer(id) {
    const remote = remotePlayers.get(id);
    if (!remote) return;
    scene.remove(remote.group);
    remotePlayers.delete(id);
}

function bounceKettles() {
    for (let a = 0; a < activeKettles.length; a++) {
        for (let b = a + 1; b < activeKettles.length; b++) {
            const first = activeKettles[a];
            const second = activeKettles[b];
            const deltaPos = new THREE.Vector3().subVectors(second.mesh.position, first.mesh.position);
            const distance = deltaPos.length();
            const minDistance = first.radius + second.radius;

            if (distance <= 0.001 || distance > minDistance) continue;

            const normal = deltaPos.normalize();
            const relativeVelocity = new THREE.Vector3().subVectors(second.velocity, first.velocity);
            const closingSpeed = relativeVelocity.dot(normal);
            if (closingSpeed > 0) continue;

            const impulse = normal.multiplyScalar(closingSpeed);
            first.velocity.add(impulse);
            second.velocity.sub(impulse);

            const overlap = (minDistance - distance) * 0.5;
            first.mesh.position.addScaledVector(normal, -overlap);
            second.mesh.position.addScaledVector(normal, overlap);
        }
    }
}

function renderResultsPage() {
    gameStarted = false;
    matchActive = false;
    homeScreen.style.display = 'flex';
    scoreBoard.style.display = 'none';
    scoreBurstLayer.style.display = 'none';
    roomStatus.style.display = 'none';
    crosshair.style.display = 'none';
    hpLayer.style.display = 'none';
    leaderboard.style.display = 'none';
    weaponStatus.style.display = 'none';
    resetMysteryBox();
    updateMobileControls();
    homeScreen.innerHTML = '';
    if (profileButton) profileButton.style.display = 'block';

    const panel = document.createElement('div');
    panel.style.width = 'min(620px, calc(100vw - 32px))';
    panel.style.border = '1px solid #40364d';
    panel.style.background = '#1b1626';
    panel.style.padding = '24px';
    panel.style.borderRadius = '8px';
    panel.style.color = '#fff';
    panel.style.fontFamily = UI_FONT;
    homeScreen.appendChild(panel);

    const title = document.createElement('div');
    title.textContent = 'Time is up!';
    title.style.fontSize = '38px';
    title.style.fontWeight = '900';
    title.style.marginBottom = '14px';
    panel.appendChild(title);

    const wallet = document.createElement('div');
    wallet.textContent = 'Wallet: ' + playerProfile.coins + ' coins';
    wallet.style.color = '#ffe66d';
    wallet.style.fontSize = '18px';
    wallet.style.fontWeight = '900';
    wallet.style.marginBottom = '14px';
    panel.appendChild(wallet);

    const rows = sortedLeaderboard();
    const resultLines = document.createElement('div');
    resultLines.style.display = 'grid';
    resultLines.style.gap = '8px';
    panel.appendChild(resultLines);
    rows.slice(0, 10).forEach((row, index) => {
        const line = document.createElement('div');
        line.textContent = formatLeaderboardLine(row, index);
        line.style.padding = '8px 10px';
        line.style.background = '#120f19';
        line.style.border = '1px solid #40364d';
        line.style.borderRadius = '6px';
        resultLines.appendChild(line);
    });

    const back = homeButton('Back');
    back.style.marginTop = '16px';
    panel.appendChild(back);
    back.onclick = () => renderHome();
}

function renderTournamentLadder(titleText, detailText, bracket = tournamentBracket) {
    gameStarted = false;
    matchActive = false;
    homeScreen.style.display = 'flex';
    scoreBoard.style.display = 'none';
    scoreBurstLayer.style.display = 'none';
    roomStatus.style.display = 'none';
    crosshair.style.display = 'none';
    hpLayer.style.display = 'none';
    leaderboard.style.display = 'none';
    weaponStatus.style.display = 'none';
    resetMysteryBox();
    updateMobileControls();
    homeScreen.innerHTML = '';

    const panel = document.createElement('div');
    panel.style.width = 'min(1000px, calc(100vw - 32px))';
    panel.style.maxHeight = 'calc(100vh - 32px)';
    panel.style.overflow = 'auto';
    panel.style.padding = '24px';
    panel.style.boxSizing = 'border-box';
    panel.style.border = '1px solid #51465f';
    panel.style.borderRadius = '8px';
    panel.style.background = '#171220';
    panel.style.color = '#fff';
    panel.style.fontFamily = UI_FONT;
    homeScreen.appendChild(panel);

    const title = document.createElement('div');
    title.textContent = titleText;
    title.style.fontSize = '34px';
    title.style.fontWeight = '900';
    panel.appendChild(title);
    const detail = document.createElement('div');
    detail.textContent = detailText;
    detail.style.margin = '8px 0 18px';
    detail.style.color = '#ffe66d';
    detail.style.fontWeight = '800';
    panel.appendChild(detail);

    const ladder = document.createElement('div');
    ladder.style.display = 'grid';
    ladder.style.gridTemplateColumns = 'repeat(3, minmax(190px, 1fr))';
    ladder.style.gap = '14px';
    ladder.style.minWidth = '650px';
    panel.appendChild(ladder);
    (bracket?.rounds || []).forEach((round) => {
        const column = document.createElement('div');
        const heading = document.createElement('div');
        heading.textContent = round.name;
        heading.style.fontSize = '18px';
        heading.style.fontWeight = '900';
        heading.style.marginBottom = '10px';
        column.appendChild(heading);
        round.matches.forEach((match) => {
            const card = document.createElement('div');
            card.style.padding = '10px';
            card.style.marginBottom = '10px';
            card.style.border = '1px solid #40364d';
            card.style.borderRadius = '6px';
            card.style.background = '#211b2c';
            (match.teams || []).forEach((team) => {
                const line = document.createElement('div');
                const score = match.scores?.[team];
                line.textContent = teamDisplayName(team) + (score === undefined ? '' : '  ' + score + ' skulls');
                line.style.padding = '4px 6px';
                line.style.fontWeight = match.winner === team ? '900' : '650';
                line.style.color = match.winner === team ? '#8dffad' : '#fff';
                card.appendChild(line);
            });
            if (!(match.teams || []).length) card.textContent = 'Awaiting winners';
            column.appendChild(card);
        });
        ladder.appendChild(column);
    });
}

function updateRoomStatus() {
    if (matchActive && matchTimer > 0) {
        roomStatus.textContent = Math.ceil(matchTimer) + 's left';
        return;
    }
    const playerCount = currentRoom ? currentRoom.players : (gameMode === 'ai' ? 2 : 1);
    const roomLabel = currentRoom ? `Group ${currentRoom.code}` : (gameMode === 'ai' ? 'AI 1v1' : 'Private room');
    roomStatus.textContent = roomLabel + ': ' + playerCount + ' player' + (playerCount === 1 ? '' : 's');
}

function updateScoreUI() {
    const hint = '[WASD/Arrows] Move • [Click/Space/Enter] Throw • [T] Toggle';
    const hit = lastHitNotice > 0
        ? '<br><span style="display:inline-block;margin-top:4px;color:#ffe66d;font-size:17px;font-weight:1000;text-shadow:0 2px 0 #5b2300,0 0 14px rgba(255,130,40,0.8);">' + lastHitText + '</span>'
        : '';
    const skull = localDefeats > 0 ? ' &#9760;' : '';
    scoreBoard.innerHTML = '<span style="font-size:28px;color:#fff7b0;text-shadow:0 2px 0 #321b00,0 0 14px rgba(255,205,72,0.55);">SCORE: ' + localDefeats + skull + ' &nbsp; COINS: ' + playerProfile.coins + '</span><br><span class="score-hint" style="font-size:13px;font-weight:700;opacity:0.86;">' + hint + '</span>' + hit;
}

function triggerHitFeedback(isDefeat = false) {
    hitFlashLayer.style.background = isDefeat
        ? 'radial-gradient(circle at center, rgba(255,220,80,0.46), rgba(255,54,36,0.2) 38%, transparent 72%)'
        : 'radial-gradient(circle at center, rgba(255,244,170,0.28), transparent 62%)';
    hitFlashLayer.style.animation = 'none';
    crosshair.style.animation = 'none';
    hitFlashLayer.offsetHeight;
    hitFlashLayer.style.animation = 'hitFlash ' + (isDefeat ? 520 : 240) + 'ms ease-out';
    crosshair.style.animation = 'crosshairKick ' + (isDefeat ? 420 : 220) + 'ms ease-out';
    if (navigator.vibrate) navigator.vibrate(isDefeat ? [35, 25, 70] : 24);
}

function showScoreBurst(text, color = '#ffe66d', size = 'normal') {
    const burst = document.createElement('div');
    burst.textContent = text;
    burst.style.position = 'absolute';
    burst.style.left = 'calc(50% + ' + THREE.MathUtils.randInt(-24, 24) + 'px)';
    burst.style.top = 'calc(45% + ' + THREE.MathUtils.randInt(-10, 10) + 'px)';
    burst.style.whiteSpace = 'nowrap';
    const fontSize = size === 'mega' ? 40 : (size === 'big' || size === true ? 28 : 20);
    burst.style.fontSize = fontSize + 'px';
    burst.style.fontWeight = '1000';
    burst.style.color = color;
    burst.style.textShadow = '0 2px 0 #000, 0 0 18px rgba(255, 196, 64, 0.72)';
    if (size === 'mega') {
        burst.style.left = '50%';
        burst.style.top = '40%';
        burst.style.letterSpacing = '0';
        burst.style.textShadow = '0 3px 0 #270007, 0 0 22px rgba(255, 48, 84, 0.9), 0 0 34px rgba(255, 214, 102, 0.64)';
    }
    burst.style.animation = 'scoreFloat ' + (size === 'mega' ? 1180 : 920) + 'ms cubic-bezier(.17,.84,.32,1) forwards';
    scoreBurstLayer.appendChild(burst);
    scoreBoard.style.animation = 'none';
    scoreBoard.offsetHeight;
    scoreBoard.style.animation = 'scorePulse 260ms ease-out';
    setTimeout(() => burst.remove(), size === 'mega' ? 1240 : 980);
}

function sortedLeaderboard() {
    setStat(localPlayerId, { name: playerProfile.name, score, defeats: localDefeats, color: localPlayerColor, team: teamAssignments[localPlayerId] || null });
    if (aiPlayer) setStat(aiPlayer.id, { name: aiPlayer.name, score: aiDefeats * 100, defeats: aiDefeats, color: aiPlayer.color, team: null });
    const rows = [...playerStats.entries()].map(([id, stats]) => ({ id, ...stats }));
    if (gameMode === 'team') {
        const teams = new Map();
        rows.forEach((row) => {
            const team = row.team || 'waiting';
            if (team === 'waiting') return;
            const existing = teams.get(team) || { id: team, name: teamDisplayName(team), defeats: 0, score: 0, team };
            existing.defeats += row.defeats || 0;
            existing.score += row.score || 0;
            teams.set(team, existing);
        });
        return [...teams.values()].sort((a, b) => (b.defeats || 0) - (a.defeats || 0) || (b.score || 0) - (a.score || 0));
    }
    return rows.sort((a, b) => (b.defeats || 0) - (a.defeats || 0) || (b.score || 0) - (a.score || 0));
}

function formatLeaderboardLine(row, index) {
    const localTeam = teamAssignments[localPlayerId] || null;
    let name = row.name;
    const showTeamYou = gameMode === 'team' && row.team && row.id === localTeam;
    const showTournamentPlayerYou = currentRoom?.kind === 'tournament' && gameMode !== 'team' && row.id === localPlayerId;
    if (showTeamYou || showTournamentPlayerYou) name += ' (you)';
    const defeats = row.defeats || 0;
    return (index + 1) + '. ' + name + ' - ' + (defeats > 0 ? '&#9760; ' : '') + defeats;
}

function updateLeaderboard() {
    if (!leaderboard) return;
    leaderboard.style.display = gameStarted ? 'block' : 'none';
    const scoreBottom = scoreBoard.getBoundingClientRect().bottom;
    const roomBottom = roomStatus.style.display === 'none' ? 0 : roomStatus.getBoundingClientRect().bottom;
    leaderboard.style.top = Math.ceil(Math.max(scoreBottom, roomBottom) + 12) + 'px';
    const rows = sortedLeaderboard();
    const lines = rows.slice(0, 10).map((row, index) => formatLeaderboardLine(row, index));
    leaderboard.innerHTML = '<div style="font-weight:900;margin-bottom:4px;">LEADERBOARD</div>' + lines.join('<br>');
}


function handleMultiplayerMessage(message) {
    if (message.type === 'welcome') {
        localPlayerId = message.id;
        localPlayerColor = colorOption(playerProfile.colorId).color;
        updateHeldKettleStyle();
        sendMultiplayer({ type: 'registerPresence' });
    }

    if (message.type === 'roomList') {
        latestRooms = message.rooms || [];
        renderRoomList();
    }

    if (message.type === 'joined') {
        if (message.playerId) localPlayerId = message.playerId;
        pendingRoomResumeState = message.resumed ? (message.resumeState || null) : null;
        currentRoom = message.room;
        localSpawnIndex = message.spawnIndex || 0;
        roomPlayers = message.players || [];
        teamAssignments = message.assignments || {};
        teamRequests = message.requests || [];
        remotePlayers.forEach((_, id) => removeRemotePlayer(id));
        roomPlayers.forEach((player) => {
            if (player.id !== localPlayerId) createRemotePlayer(player);
        });
        const joinedTeam = teamAssignments[localPlayerId];
        if (joinedTeam) teamMessage = 'You are on ' + teamDisplayName(joinedTeam) + '!';
        const joinedMessage = currentRoom.kind === 'tournament'
            ? (joinedTeam ? 'Tournament found. You are on ' + teamDisplayName(joinedTeam) + '.' : 'Tournament found. Starting soon...')
            : '';
        renderHome(currentRoom.kind === 'tournament' ? 'tournamentWaiting' : 'publicReady', joinedMessage);
        updateRoomStatus();
    }

    if (message.type === 'playerJoined') {
        currentRoom.players += 1;
        roomPlayers = [...roomPlayers.filter((player) => player.id !== message.player.id), message.player];
        if (message.player.team) teamAssignments[message.player.id] = message.player.team;
        if (message.player.id !== localPlayerId) createRemotePlayer(message.player);
        if (!gameStarted) renderHome('publicReady');
        if (gameStarted) configureArena(currentRoom.players);
        updateRoomStatus();
    }

    if (message.type === 'playerLeft') {
        currentRoom.players = Math.max(1, currentRoom.players - 1);
        roomPlayers = roomPlayers.filter((player) => player.id !== message.id);
        delete teamAssignments[message.id];
        removeRemotePlayer(message.id);
        if (gameStarted) configureArena(currentRoom.players);
        updateRoomStatus();
    }

    if (message.type === 'playerState') {
        let remote = remotePlayers.get(message.id);
        if (!remote) {
            createRemotePlayer({ id: message.id, color: message.color, state: message.state });
            remote = remotePlayers.get(message.id);
        }
        remote.targetPosition.fromArray(message.state.position);
        remote.targetQuaternion.fromArray(message.state.quaternion);
        remote.name = message.state.name || remote.name;
        remote.score = message.state.score ?? remote.score;
        remote.defeats = message.state.defeats ?? remote.defeats;
        remote.team = message.state.team || remote.team;
        const incomingColor = teamColor(remote.team, message.color || remote.color);
        if (incomingColor !== remote.color) {
            remote.color = incomingColor;
            remote.body.material.color.setHex(incomingColor);
        }
        updateRemoteKettle(remote, message.state.powerLevel || 0, message.state.kettleSize || 1, Boolean(message.state.advancedSelected));
        setStat(message.id, { name: remote.name, score: remote.score, defeats: remote.defeats, color: remote.color, team: remote.team });
    }

    if (message.type === 'teamRequests') {
        teamRequests = message.requests || [];
        if (!gameStarted) renderHome('publicReady');
    }

    if (message.type === 'tournamentQueued') {
        const queued = message.queued || 1;
        const needed = message.needed || 2;
        renderHome('tournamentWaiting', 'Finding players... ' + queued + '/' + needed + ' ready for ' + message.teamSize + 'v' + message.teamSize + '.');
    }

    if (message.type === 'inviteReceived') {
        showInviteReceived(message);
    }

    if (message.type === 'onlinePlayers') {
        onlinePlayers = message.players || [];
        updateActivePlayersCount();
        onlinePlayers.forEach((player) => rememberPlayerName(player.name));
        document.querySelectorAll('select[data-invite-names]').forEach(fillInviteNames);
    }

    if (message.type === 'inviteResult') {
        inviteMessage = message.ok ? 'Invite sent to ' + message.targetName + '.' : message.error;
        renderInviteLayer();
    }

    if (message.type === 'inviteResponse') {
        inviteMessage = message.playerName + (message.accepted ? ' accepted' : ' declined') + ' your invitation to ' + message.code + '.';
        renderInviteLayer();
    }

    if (message.type === 'colorResult') {
        if (message.ok && pendingColorOption) {
            playerProfile.colorId = pendingColorOption.id;
            localPlayerColor = pendingColorOption.color;
            saveProfile();
            updateHeldKettleStyle();
            inviteMessage = pendingColorOption.name + ' is now your colour.';
        } else if (!message.ok) {
            inviteMessage = message.error || 'That colour is unavailable.';
        }
        pendingColorOption = null;
        renderInviteLayer();
    }

    if (message.type === 'playerColorChanged') {
        roomPlayers = roomPlayers.map((player) => player.id === message.id ? { ...player, color: message.color } : player);
        const remote = remotePlayers.get(message.id);
        if (remote) {
            remote.color = message.color;
            remote.body.material.color.setHex(message.color);
            updateRemoteKettle(remote, remote.powerLevel || 0, remote.kettleSize || 1, remote.advancedSelected);
        }
    }

    if (message.type === 'teamAssignments') {
        teamAssignments = message.assignments || {};
        const assigned = teamAssignments[localPlayerId];
        teamMessage = assigned ? 'You have been assigned to ' + teamDisplayName(assigned) + '!' : '';
        teamRequests = teamRequests.filter((request) => teamAssignments[request.playerId] !== request.team);
        roomPlayers = roomPlayers.map((player) => ({ ...player, team: teamAssignments[player.id] || null, color: teamColor(teamAssignments[player.id], player.color) }));
        repaintRemoteTeams();
        if (!gameStarted) renderHome('publicReady');
    }

    if (message.type === 'teamCountChanged') {
        currentRoom.teamCount = message.teamCount || 2;
        teamAssignments = message.assignments || teamAssignments;
        if (!gameStarted) renderHome('publicReady');
    }

    if (message.type === 'matchStarted') {
        currentRoom = message.room || currentRoom;
        tournamentBracket = message.bracket || tournamentBracket;
        teamAssignments = message.assignments || teamAssignments;
        roomPlayers = roomPlayers.map((player) => ({ ...player, team: teamAssignments[player.id] || null, color: teamColor(teamAssignments[player.id], player.color) }));
        remotePlayers.forEach((_, id) => removeRemotePlayer(id));
        roomPlayers.forEach((player) => { if (player.id !== localPlayerId) createRemotePlayer(player); });
        const localTeam = teamAssignments[localPlayerId] || null;
        if (currentRoom.kind === 'tournament' && localTeam && !gameStarted) {
            renderHome('tournamentWaiting', 'Tournament found. You are Team ' + localTeam + '.');
        }
        const tournamentTeams = currentRoom.kind === 'tournament' && (currentRoom.teamSize || 1) > 1;
        const mode = currentRoom.kind === 'team' || tournamentTeams ? 'team' : 'public';
        const label = currentRoom.kind === 'tournament'
            ? 'Tournament ' + currentRoom.code
            : (currentRoom.kind === 'team' ? 'Team ' : 'Group ') + currentRoom.code;
        startGame(label, currentRoom.players, {
            timed: Boolean(currentRoom.timed),
            duration: currentRoom.duration || 180,
            mode,
            resumeState: message.resumeState || pendingRoomResumeState
        });
        pendingRoomResumeState = null;
    }

    if (message.type === 'tournamentRoundResult') {
        tournamentBracket = message.bracket || tournamentBracket;
        const localTeam = teamAssignments[localPlayerId];
        const advanced = message.winner === localTeam;
        renderTournamentLadder(
            message.winnerName + ' win the round!',
            advanced ? 'Your team advances. The next match will begin shortly.' : 'Your tournament run has ended.',
            tournamentBracket
        );
    }

    if (message.type === 'tournamentBracket') {
        tournamentBracket = message.bracket || tournamentBracket;
    }

    if (message.type === 'tournamentChampion') {
        tournamentBracket = message.bracket || tournamentBracket;
        const localTeam = teamAssignments[localPlayerId];
        renderTournamentLadder(
            message.winnerName + ' are the champions!',
            message.champion === localTeam ? 'Tournament victory!' : 'Tournament complete.',
            tournamentBracket
        );
    }

    if (message.type === 'kettleLaunch') {
        createKettle(
            new THREE.Vector3().fromArray(message.position),
            new THREE.Vector3().fromArray(message.velocity),
            message.color,
            false,
            message.id,
            { sizeMultiplier: message.sizeMultiplier || 1, damage: message.damage || 25, powerLevel: message.powerLevel || 0, advanced: Boolean(message.advanced) }
        );
    }

    if (message.type === 'error') {
        renderHome('join', message.error);
    }
}

// 8. Handle Keyboard Core Inputs Setup
const keysPressed = {};
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.tabIndex = 1;

// Function to force proper canvas input focus activation
function focusGame() {
    renderer.domElement.focus();
}
window.addEventListener('DOMContentLoaded', focusGame);
window.addEventListener('load', focusGame);
focusGame();

function launchHeldKettle() {
    if (!gameStarted || performance.now() - lastLaunchAt < 170) return;
    lastLaunchAt = performance.now();
    renderer.domElement.focus();

    mouse.x = (crosshairX / window.innerWidth) * 2 - 1;
    mouse.y = -(crosshairY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const rightOffset = new THREE.Vector3(0.5, -0.4, -0.8).applyQuaternion(camera.quaternion);
    const launchOrigin = new THREE.Vector3().copy(camera.position).add(rightOffset);
    const targetPoint = new THREE.Vector3();
    const targets = [...dinosaurs, ...bonusBoxes.map((box) => box.group)];
    const intersections = targets.length ? raycaster.intersectObjects(targets, true) : [];

    if (intersections.length) {
        targetPoint.copy(intersections[0].point);
    } else {
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        if (!raycaster.ray.intersectPlane(groundPlane, targetPoint)) {
            targetPoint.copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction, 35);
        }
    }

    const travelVector = new THREE.Vector3().subVectors(targetPoint, launchOrigin);
    const distanceXZ = Math.hypot(travelVector.x, travelVector.z);
    const throwStrength = 32.0 + upgradeLevel('kettlePower') * 1.2;
    const fireDirection = travelVector.normalize().multiplyScalar(throwStrength);
    fireDirection.y += distanceXZ * 0.18;

    const advanced = advancedKettleSelected && advancedKettleAmmo > 0;
    createKettle(launchOrigin, fireDirection, localPlayerColor, true, localPlayerId, {
        sizeMultiplier: advanced ? 1.16 : kettleSizeMultiplier(),
        damage: advanced ? 120 + Math.sqrt(upgradeLevel('kettlePower')) * 10 : kettleHitDamage(),
        powerLevel: upgradeLevel('kettlePower'),
        advanced
    });

    if (advanced) {
        advancedKettleAmmo -= 1;
        playerProfile.advancedKettles = advancedKettleAmmo;
        saveProfile();
        if (advancedKettleAmmo <= 0) advancedKettleSelected = false;
        updateWeaponStatus();
    }

    heldKettleGroup.visible = false;
    heldAdvancedKettleGroup.visible = false;
    setTimeout(updateHeldKettleStyle, 180);
}

window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
    if (!event.repeat) keysPressed[event.code] = true;

    if (event.code === 'KeyT' && !event.repeat && gameStarted) {
        if (advancedKettleAmmo > 0) {
            advancedKettleSelected = !advancedKettleSelected;
            updateHeldKettleStyle();
            updateWeaponStatus();
            showScoreBurst(advancedKettleSelected ? 'BOMBS READY' : 'STANDARD KETTLES READY', advancedKettleSelected ? '#66f7ff' : '#ffffff');
        } else {
            showScoreBurst('NO BOMBS', '#8da4c7');
        }
    }

    if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Space') {
        event.preventDefault();
        launchHeldKettle();
    }
});

window.addEventListener('keyup', (event) => {
    keysPressed[event.code] = false;
});
window.addEventListener('blur', resetMovementInput);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        resetMovementInput();
    }
});

window.addEventListener('pointerdown', focusGame);
window.addEventListener('click', focusGame);

renderer.domElement.addEventListener('click', () => {
    if (gameStarted) launchHeldKettle();
    if (gameStarted && renderer.domElement.requestPointerLock) {
        renderer.domElement.requestPointerLock();
    }
});

window.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement !== renderer.domElement) return;
    cameraYaw -= event.movementX * 0.0022;
    cameraPitch = THREE.MathUtils.clamp(cameraPitch - event.movementY * 0.0022, -0.72, 0.35);
});

function animate(timestamp) {
    requestAnimationFrame(animate);

    timer.update(timestamp);
    const delta = Math.min(timer.getDelta(), 0.1);
    mixers.forEach((dinoMixer) => dinoMixer.update(delta));
    
    // --- FIXED-CROSSHAIR PLAYER MOVEMENT ---
    crosshairX = window.innerWidth / 2;
    crosshairY = window.innerHeight / 2;
    crosshair.style.left = `${crosshairX}px`;
    crosshair.style.top = `${crosshairY}px`;
    let moveX = 0;
    let moveZ = 0;
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) moveX += 1;
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) moveX -= 1;
    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) moveZ += 1;
    if (keysPressed['KeyS'] || keysPressed['ArrowDown']) moveZ -= 1;
    moveX += mobileMoveX;
    moveZ += mobileMoveZ;

    const flatForward = cameraPlanarForward();
    const flatRight = new THREE.Vector3(flatForward.z, 0, -flatForward.x);
    const moveVector = new THREE.Vector3()
        .addScaledVector(flatForward, moveZ)
        .addScaledVector(flatRight, moveX);

    if (moveVector.lengthSq() > 0.001) {
        moveVector.normalize();
        camera.position.addScaledVector(moveVector, playerMoveSpeed() * delta);
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -ARENA_LIMIT, ARENA_LIMIT);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -ARENA_LIMIT, ARENA_LIMIT);
    }
    camera.position.y = 8;

    applyCameraLook();

    if (lastHitNotice > 0) {
        lastHitNotice = Math.max(0, lastHitNotice - delta);
        updateScoreUI();
    }
    if (matchActive) {
        matchTimer = Math.max(0, matchTimer - delta);
        if (matchTimer === 0 && !matchEnded) {
            matchEnded = true;
            if (currentRoom?.kind === 'tournament') {
                sendMultiplayer({ type: 'tournamentRoundComplete' });
                renderTournamentLadder('Round complete', 'Calculating the winner...', tournamentBracket);
            } else {
                renderResultsPage();
            }
            return;
        }
    }
    updateRoomStatus();
    updateLeaderboard();
    updateAiPlayer(delta);
    updateExplosions(delta);
    updateGroundShockwaves(delta);
    updateMysteryBox(delta);

    remotePlayers.forEach((remote) => {
        remote.group.position.lerp(remote.targetPosition, Math.min(1, delta * 12));
        remote.group.quaternion.slerp(remote.targetQuaternion, Math.min(1, delta * 10));
    });

    if (gameStarted && currentRoom) {
        lastNetworkSend += delta;
        if (lastNetworkSend >= NETWORK_UPDATE_INTERVAL) {
            lastNetworkSend = 0;
            sendMultiplayer({
                type: 'playerState',
                state: {
                    position: camera.position.toArray(),
                    quaternion: camera.quaternion.toArray(),
                    name: playerProfile.name,
                    score,
                    defeats: localDefeats,
                    team: teamAssignments[localPlayerId] || null,
                    powerLevel: upgradeLevel('kettlePower'),
                    kettleSize: kettleSizeMultiplier(),
                    advancedSelected: advancedKettleSelected && advancedKettleAmmo > 0
                }
            });
        }
    }

    // --- PACE THE DINOSAUR TARGETS ---
    dinosaurs.forEach((dino) => {
        if (updateDinoDeath(dino, delta)) {
            return;
        }
        if (dino.userData.tutorialFrozen) {
            setDinoWalking(dino, false);
            updateHpBar(dino);
            return;
        }

        const oldPos = new THREE.Vector3().copy(dino.position);
        const currentTarget = dino.userData.target;
        dino.userData.replanCooldown = Math.max(0, dino.userData.replanCooldown - delta);

        if (dino.userData.pauseTimer > 0) {
            dino.userData.pauseTimer -= delta;
        } else if (!currentTarget || oldPos.distanceTo(currentTarget) < 0.45) {
            dino.userData.pauseTimer = THREE.MathUtils.randFloat(0.12, 0.45);
            chooseDinoTarget(dino);
            dino.userData.replanCooldown = 0.8;
        } else {
            const shouldReplan = dino.userData.replanCooldown <= 0 && !candidateHasClearFuture(dino, currentTarget);
            if (shouldReplan) {
                chooseDinoTarget(dino);
                dino.userData.replanCooldown = 1.0;
            }

            const toTarget = new THREE.Vector3().subVectors(dino.userData.target, dino.position);
            toTarget.y = 0;
            const separation = separationForceFor(dino);

            if (toTarget.lengthSq() > 0.001 || separation.lengthSq() > 0.001) {
                const desired = toTarget.lengthSq() > 0.001 ? toTarget.normalize() : new THREE.Vector3();
                desired.add(separation);
                if (desired.lengthSq() > 0.001) {
                    desired.normalize();
                    const step = dino.userData.speed * delta;
                    dino.position.addScaledVector(desired, step);
                }
                dino.position.y = 0;
            }
        }

        const arenaDistance = Math.sqrt(dino.position.x * dino.position.x + dino.position.z * dino.position.z);
        if (arenaDistance > DINO_WANDER_RADIUS) {
            const clamp = DINO_WANDER_RADIUS / arenaDistance;
            dino.position.x *= clamp;
            dino.position.z *= clamp;
            chooseDinoTarget(dino);
        }

        const diffX = dino.position.x - oldPos.x;
        const diffZ = dino.position.z - oldPos.z;
        if (Math.abs(diffX) > 0.001 || Math.abs(diffZ) > 0.001) {
            const targetRotation = Math.atan2(diffX, diffZ);
            let turnDelta = targetRotation - dino.rotation.y;
            turnDelta = Math.atan2(Math.sin(turnDelta), Math.cos(turnDelta));
            dino.rotation.y += turnDelta * Math.min(1, delta * 8);
        }

        updateHpBar(dino);
    });
    enforceDinoSpacing();

    // --- PROJECTILE FLIGHT MECHANICS ---
    const gravity = -22.0; 

    for (let i = activeKettles.length - 1; i >= 0; i--) {
        const k = activeKettles[i];
        
        k.velocity.y += gravity * delta;
        k.mesh.position.addScaledVector(k.velocity, delta);

        k.mesh.rotation.x += k.rotVelocity.x * delta;
        k.mesh.rotation.y += k.rotVelocity.y * delta;
        k.mesh.rotation.z += k.rotVelocity.z * delta;
    }

    bounceKettles();

    kettleCollisionLoop: for (let i = activeKettles.length - 1; i >= 0; i--) {
        const k = activeKettles[i];

        // Ground floor cleanup zone
        if (k.mesh.position.y < 0.2) {
            if (k.advanced) {
                spawnGroundShockwave(k.mesh.position);
                detonateAdvancedKettle(k);
            }
            scene.remove(k.mesh);
            activeKettles.splice(i, 1);
            continue;
        }

        const hitBonusBox = (k.ownerId === localPlayerId || !k.ownerId)
            ? bonusBoxes.find((box) => k.mesh.position.distanceTo(box.group.position) < 1.35 + k.radius)
            : null;
        if (hitBonusBox) {
            const pickupPosition = hitBonusBox.group.position.clone();
            scene.remove(k.mesh);
            activeKettles.splice(i, 1);
            collectMysteryBox(pickupPosition, hitBonusBox);
            continue;
        }
        
        // Target checking sequence against dinosaur frame box
        for (const dino of dinosaurs) {
            if (dino.userData.state !== 'alive') continue;

            const dinoCenter = new THREE.Vector3().copy(dino.position).add(new THREE.Vector3(0, 1.0, 0));
            const distToDino = k.mesh.position.distanceTo(dinoCenter);

            if (distToDino < (dinoRadius + 0.4)) {
                if (k.advanced) {
                    scene.remove(k.mesh);
                    activeKettles.splice(i, 1);
                    detonateAdvancedKettle(k);
                    continue kettleCollisionLoop;
                }
                const localHit = k.ownerId === localPlayerId || !k.ownerId;
                if (localHit) handleTutorialDinoHit(dino);
                if (localHit) {
                    score += 10;
                    addCoins(10);
                    lastHitNotice = 1.25;
                    lastHitText = 'DIRECT HIT! +10 COINS';
                    showScoreBurst('DIRECT HIT! +10 COINS', '#ff6b35', 'big');
                    triggerHitFeedback(false);
                    updateScoreUI();
                }
                
                scene.remove(k.mesh);
                activeKettles.splice(i, 1);
                
                dino.userData.hp = Math.max(0, dino.userData.hp - k.damage);
                updateHpBar(dino);

                if (dino.userData.hp <= 0) {
                    awardDinoDefeat(k.ownerId);
                    if (localHit) {
                        lastHitNotice = 1.7;
                        lastHitText = 'DINO BLASTED! +60 COINS';
                        showScoreBurst('DINO BLASTED! +60 COINS', '#ff2d55', 'mega');
                        triggerHitFeedback(true);
                        updateScoreUI();
                    }
                    startDinoDeath(dino);
                }

                if (dino.userData.state === 'alive') {
                    dino.scale.setScalar(DINO_SCALE_DEFAULT * 1.3);
                    setTimeout(() => dino.scale.setScalar(DINO_SCALE_DEFAULT), 120);
                }
                break;
            }
        }
    }

        // --- POSITION HELD KETTLE IN HAND (MINECRAFT RIG) ---
    if (heldKettleGroup) {
        // Calculate corner offset relative to current camera position/viewing direction
        const handOffset = new THREE.Vector3(0.6, -0.5, -1.2); 
        handOffset.applyQuaternion(camera.quaternion);
        
        heldKettleGroup.position.copy(camera.position).add(handOffset);
        
        // Tilt the kettle slightly forward in your hand frame
        heldKettleGroup.quaternion.copy(camera.quaternion);
        heldKettleGroup.rotateY(Math.PI / 4); // angles it slightly on screen

        heldAdvancedKettleGroup.position.copy(camera.position).add(handOffset);
        heldAdvancedKettleGroup.quaternion.copy(camera.quaternion);
        heldAdvancedKettleGroup.rotateY(Math.PI / 4);
    }

    renderer.render(scene, camera);
}

// 10. Standard Viewport Scaling Rules
window.addEventListener('resize', () => {
    resizeGameCanvas();
    crosshairX = window.innerWidth / 2;
    crosshairY = window.innerHeight / 2;
});
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        resizeGameCanvas();
    }, 100);
});

if (!keyboardUnavailable) {
    connectMultiplayer(() => {}, true);
    animate();
    setTimeout(startFirstPlayTutorial, 450);
}
