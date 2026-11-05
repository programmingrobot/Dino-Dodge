const { WebSocket, WebSocketServer } = require('ws');

const PORT = Number(process.env.DINO_WS_PORT || 8081);
const PLAYER_COLORS = [0x2f80ff, 0xff4242, 0x31c96b, 0xf0c84b, 0xb86bff, 0xff8a2a];
const rooms = new Map();
const tournamentQueues = new Map([[1, []], [2, []], [4, []], [8, []]]);
const tournaments = new Map();
const TOURNAMENT_TEAM_NAMES = ['Meteor Raptors', 'Thunder Kettles', 'Neon Fossils', 'Iron Comets', 'Volcanic Titans', 'Quantum Claws', 'Storm Chasers', 'Solar Stampede'];
const PUBLIC_ROOM_REJOIN_WINDOW_MS = 30 * 60 * 1000;
let nextPlayerId = 1;

function normalizeName(name) {
    return String(name || '').trim().toLowerCase();
}

const BLOCKED_NAME_PARTS = ['fuck', 'shit', 'bitch', 'cunt', 'nigger', 'nigga', 'faggot', 'rape', 'sex', 'porn', 'nazi'];
function safePlayerName(name, fallback = 'Player') {
    const clean = String(name || '').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 16);
    const compact = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean && !BLOCKED_NAME_PARTS.some((word) => compact.includes(word)) ? clean : fallback;
}

function onlinePlayers() {
    return [...wss.clients]
        .filter((socket) => socket.player)
        .map((socket) => ({
            id: socket.player.id,
            name: socket.player.name || socket.player.id,
            roomCode: socket.player.roomCode || null
        }));
}

function findPlayerByName(name) {
    const wanted = normalizeName(name);
    if (!wanted) return null;
    return [...wss.clients].find((socket) => socket.player && normalizeName(socket.player.name) === wanted)
        || [...wss.clients].find((socket) => socket.player && normalizeName(socket.player.name).startsWith(wanted));
}

function findPlayerById(id) {
    return [...wss.clients].find((socket) => socket.player?.id === id) || null;
}

function sendTeamRequests(room) {
    const admin = room.players.get(room.adminId);
    if (admin) send(admin.socket, { type: 'teamRequests', requests: room.teamRequests || [] });
}

function makeCode() {
    let code;
    do {
        code = Math.random().toString(36).slice(2, 8).toUpperCase();
    } while (rooms.has(code));
    return code;
}

function send(socket, message) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    }
}

function broadcastRoom(room, message, exceptSocket = null) {
    room.players.forEach((player) => {
        if (player.socket !== exceptSocket) {
            send(player.socket, message);
        }
    });
}

function roomSummary(room) {
    const configuredDuration = room.settings?.duration || 180;
    const remainingDuration = room.status === 'started' && room.settings?.timed && room.startedAt
        ? Math.max(0, configuredDuration - (Date.now() - room.startedAt) / 1000)
        : configuredDuration;
    return {
        code: room.code,
        visibility: room.visibility,
        players: room.players.size,
        kind: room.kind || 'classic',
        status: room.status || 'waiting',
        adminId: room.adminId || null,
        duration: remainingDuration,
        timed: Boolean(room.settings?.timed),
        teamSize: room.teamSize || 0,
        teamCount: room.teamCount || 2,
        tournamentId: room.tournamentId || null,
        roundName: room.roundName || null,
        teamNames: room.teamNames || []
    };
}

function publicRooms() {
    return [...rooms.values()]
        .map((room) => {
            if (room.resumePlayers) {
                for (const [profileId, saved] of room.resumePlayers) {
                    if (saved.expiresAt <= Date.now()) room.resumePlayers.delete(profileId);
                }
            }
            return room;
        })
        .filter((room) => room.visibility === 'public')
        .sort((a, b) => b.players.size - a.players.size)
        .slice(0, 10)
        .map(roomSummary);
}

function broadcastRoomList() {
    const list = publicRooms();
    wss.clients.forEach((socket) => send(socket, { type: 'roomList', rooms: list }));
}

function removeFromTournamentQueues(socket) {
    tournamentQueues.forEach((queue) => {
        const index = queue.indexOf(socket);
        if (index >= 0) queue.splice(index, 1);
    });
}

function tournamentNeeded(teamSize) {
    return teamSize * 8;
}

function tournamentState(tournament) {
    return {
        id: tournament.id,
        roundIndex: tournament.roundIndex,
        rounds: tournament.rounds,
        teams: tournament.teams.map(({ id, name }) => ({ id, name })),
        champion: tournament.champion || null
    };
}

function createTournamentMatch(tournament, matchIndex) {
    const match = tournament.rounds[tournament.roundIndex].matches[matchIndex];
    const competingTeams = match.teams.map((id) => tournament.teams.find((team) => team.id === id));
    const sockets = competingTeams.flatMap((team) => team.sockets);
    const assignments = {};
    competingTeams.forEach((team) => team.sockets.forEach((socket) => { assignments[socket.player.id] = team.id; }));
    const room = {
        code: makeCode(),
        visibility: 'private',
        kind: 'tournament',
        status: 'started',
        adminId: null,
        teamSize: tournament.teamSize,
        teamCount: 2,
        teamNames: competingTeams.map(({ id, name }) => ({ id, name })),
        tournamentId: tournament.id,
        roundIndex: tournament.roundIndex,
        roundName: tournament.rounds[tournament.roundIndex].name,
        matchIndex,
        settings: { duration: 180, difficulty: 'medium', timed: true },
        teamAssignments: assignments,
        teamRequests: [],
        nextSpawnIndex: 0,
        resultPending: false,
        players: new Map()
    };
    rooms.set(room.code, room);
    sockets.forEach((socket) => joinRoom(socket, room));
    broadcastRoom(room, {
        type: 'matchStarted',
        room: roomSummary(room),
        assignments: room.teamAssignments,
        bracket: tournamentState(tournament)
    });
}

function startTournamentRound(tournament) {
    tournament.rounds[tournament.roundIndex].matches.forEach((_, index) => createTournamentMatch(tournament, index));
    broadcastRoomList();
}

function createTournament(teamSize, sockets) {
    const id = 'T-' + makeCode();
    const teams = TOURNAMENT_TEAM_NAMES.map((name, index) => ({
        id: 'team-' + (index + 1),
        name,
        sockets: sockets.slice(index * teamSize, (index + 1) * teamSize)
    }));
    const tournament = {
        id,
        teamSize,
        teams,
        roundIndex: 0,
        champion: null,
        rounds: [
            { name: 'Quarterfinals', matches: Array.from({ length: 4 }, (_, index) => ({ teams: [teams[index * 2].id, teams[index * 2 + 1].id], winner: null, scores: null })) },
            { name: 'Semifinals', matches: [{ teams: [], winner: null, scores: null }, { teams: [], winner: null, scores: null }] },
            { name: 'Final', matches: [{ teams: [], winner: null, scores: null }] }
        ]
    };
    tournaments.set(id, tournament);
    startTournamentRound(tournament);
}

function maybeStartTournament(teamSize) {
    const queue = tournamentQueues.get(teamSize);
    const needed = tournamentNeeded(teamSize);
    while (queue && queue.length >= needed) {
        const sockets = queue.splice(0, needed).filter((socket) => socket.readyState === WebSocket.OPEN);
        if (sockets.length === needed) createTournament(teamSize, sockets);
    }
    if (queue) {
        queue.forEach((socket) => send(socket, { type: 'tournamentQueued', teamSize, queued: queue.length, needed }));
    }
}

function sendTournament(tournament, message) {
    const sent = new Set();
    tournament.teams.forEach((team) => team.sockets.forEach((socket) => {
        if (!sent.has(socket) && socket.readyState === WebSocket.OPEN) {
            sent.add(socket);
            send(socket, message);
        }
    }));
}

function finishTournamentMatch(room) {
    if (room.resultPending) return;
    room.resultPending = true;
    const tournament = tournaments.get(room.tournamentId);
    const round = tournament?.rounds[room.roundIndex];
    const match = round?.matches[room.matchIndex];
    if (!tournament || !match || match.winner) return;

    const scores = Object.fromEntries(match.teams.map((team) => [team, 0]));
    room.players.forEach((player) => {
        const team = room.teamAssignments[player.id];
        if (team && scores[team] !== undefined) scores[team] += Number(player.state?.defeats || 0);
    });
    const winner = [...match.teams].sort((a, b) => scores[b] - scores[a] || a.localeCompare(b))[0];
    match.scores = scores;
    match.winner = winner;
    const winnerName = tournament.teams.find((team) => team.id === winner)?.name || winner;
    broadcastRoom(room, { type: 'tournamentRoundResult', winner, winnerName, bracket: tournamentState(tournament) });

    if (!round.matches.every((item) => item.winner)) return;
    const winners = round.matches.map((item) => item.winner);
    if (tournament.roundIndex === tournament.rounds.length - 1) {
        tournament.champion = winners[0];
        sendTournament(tournament, { type: 'tournamentChampion', champion: winners[0], winnerName, bracket: tournamentState(tournament) });
        return;
    }

    tournament.roundIndex += 1;
    const nextRound = tournament.rounds[tournament.roundIndex];
    nextRound.matches.forEach((nextMatch, index) => {
        nextMatch.teams = [winners[index * 2], winners[index * 2 + 1]];
    });
    sendTournament(tournament, { type: 'tournamentBracket', bracket: tournamentState(tournament) });
    setTimeout(() => startTournamentRound(tournament), 8000);
}

function leaveCurrentRoom(socket) {
    removeFromTournamentQueues(socket);
    if (!socket.player || !socket.player.roomCode) return;

    const room = rooms.get(socket.player.roomCode);
    if (!room) return;

    if (room.visibility === 'public' && socket.player.profileId) {
        room.resumePlayers ||= new Map();
        room.resumePlayers.set(socket.player.profileId, {
            id: socket.player.id,
            name: socket.player.name,
            color: socket.player.color,
            state: socket.player.state || null,
            spawnIndex: socket.player.spawnIndex || 0,
            expiresAt: Date.now() + PUBLIC_ROOM_REJOIN_WINDOW_MS
        });
    }

    room.players.delete(socket.player.id);
    broadcastRoom(room, { type: 'playerLeft', id: socket.player.id });

    if (room.players.size === 0 && !(room.visibility === 'public' && room.resumePlayers?.size)) {
        rooms.delete(room.code);
    }

    socket.player.roomCode = null;
    broadcastRoomList();
}

function joinRoom(socket, room) {
    leaveCurrentRoom(socket);

    const profileId = socket.player.profileId;
    if (room.resumePlayers) {
        for (const [savedProfileId, savedPlayer] of room.resumePlayers) {
            if (savedPlayer.expiresAt <= Date.now()) room.resumePlayers.delete(savedProfileId);
        }
    }
    const saved = profileId && room.resumePlayers?.get(profileId);
    const canResume = saved
        && saved.expiresAt > Date.now()
        && !room.players.has(saved.id);

    if (canResume) {
        socket.player.id = saved.id;
        socket.player.name = saved.name || socket.player.name;
        socket.player.color = saved.color || socket.player.color;
        socket.player.state = saved.state || null;
        socket.player.spawnIndex = saved.spawnIndex || 0;
        room.resumePlayers.delete(profileId);
    }

    socket.player.roomCode = room.code;
    if (!canResume) {
        socket.player.spawnIndex = room.nextSpawnIndex || 0;
        room.nextSpawnIndex = socket.player.spawnIndex + 1;
    }
    room.players.set(socket.player.id, socket.player);

    const players = [...room.players.values()].map((player) => ({
        id: player.id,
        color: player.color,
        name: player.name || player.id,
        team: room.teamAssignments[player.id] || null,
        spawnIndex: player.spawnIndex,
        state: player.state || null
    }));

    send(socket, {
        type: 'joined',
        playerId: socket.player.id,
        resumed: Boolean(canResume),
        resumeState: canResume ? socket.player.state : null,
        room: roomSummary(room),
        spawnIndex: socket.player.spawnIndex,
        players,
        assignments: room.teamAssignments,
        requests: room.teamRequests || []
    });

    broadcastRoom(room, {
        type: 'playerJoined',
        player: {
            id: socket.player.id,
            color: socket.player.color,
            name: socket.player.name || socket.player.id,
            team: room.teamAssignments[socket.player.id] || null,
            spawnIndex: socket.player.spawnIndex,
            state: socket.player.state || null
        }
    }, socket);

    broadcastRoomList();
    return Boolean(canResume);
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (socket) => {
    const playerId = `P${nextPlayerId++}`;
    const color = PLAYER_COLORS[(nextPlayerId - 2) % PLAYER_COLORS.length];

    socket.player = {
        id: playerId,
        color,
        roomCode: null,
        state: null,
        name: playerId,
        profileId: null,
        socket
    };

    send(socket, { type: 'welcome', id: playerId, color });
    send(socket, { type: 'roomList', rooms: publicRooms() });

    socket.on('message', (payload) => {
        let message;
        try {
            message = JSON.parse(payload.toString());
        } catch {
            return;
        }

        const requestedColor = Number(message.color);
        const activeRoom = socket.player.roomCode ? rooms.get(socket.player.roomCode) : null;
        if (Number.isInteger(requestedColor) && requestedColor >= 0 && requestedColor <= 0xffffff
            && activeRoom?.kind !== 'team' && activeRoom?.kind !== 'tournament') {
            const colorTaken = activeRoom && [...activeRoom.players.values()].some((player) => player.id !== socket.player.id && player.color === requestedColor);
            if (!colorTaken) socket.player.color = requestedColor;
        }

        if (message.type === 'registerPresence') {
            socket.player.name = safePlayerName(message.name || socket.player.name, playerId);
            socket.player.profileId = message.profileId || socket.player.profileId;
            return;
        }

        if (message.type === 'listRooms') {
            send(socket, { type: 'roomList', rooms: publicRooms() });
            return;
        }

        if (message.type === 'listPlayers') {
            send(socket, { type: 'onlinePlayers', players: onlinePlayers() });
            return;
        }

        if (message.type === 'invitePlayer') {
            socket.player.name = safePlayerName(message.name || socket.player.name, playerId);
            const target = findPlayerByName(message.targetName);
            const code = String(message.code || '').trim().toUpperCase();
            const inviteRoom = rooms.get(code);
            if (!target || !inviteRoom) {
                send(socket, { type: 'inviteResult', ok: false, error: !target ? 'Player not found' : 'Room not found' });
                return;
            }
            send(target, { type: 'inviteReceived', from: socket.player.name || socket.player.id, fromId: socket.player.id, code, room: roomSummary(inviteRoom) });
            send(socket, { type: 'inviteResult', ok: true, targetName: target.player.name || target.player.id, code });
            return;
        }

        if (message.type === 'inviteResponse') {
            const inviter = findPlayerById(String(message.inviterId || ''));
            if (inviter) {
                send(inviter, {
                    type: 'inviteResponse',
                    accepted: Boolean(message.accepted),
                    playerName: socket.player.name || socket.player.id,
                    code: String(message.code || '').toUpperCase()
                });
            }
            return;
        }

        if (message.type === 'setColor') {
            const room = socket.player.roomCode ? rooms.get(socket.player.roomCode) : null;
            const color = Number(message.color);
            if (room?.kind === 'team' || room?.kind === 'tournament') {
                send(socket, { type: 'colorResult', ok: false, error: 'Team colours cannot be changed during this game.' });
                return;
            }
            const colorTaken = room && [...room.players.values()].some((player) => player.id !== socket.player.id && player.color === color);
            if (colorTaken) {
                send(socket, { type: 'colorResult', ok: false, error: 'Another player is already using that colour.' });
                return;
            }
            socket.player.color = color;
            send(socket, { type: 'colorResult', ok: true, color, colorId: message.colorId });
            if (room) broadcastRoom(room, { type: 'playerColorChanged', id: socket.player.id, color }, socket);
            return;
        }

        if (message.type === 'joinTournament') {
            socket.player.name = safePlayerName(message.name || socket.player.name, playerId);
            socket.player.profileId = message.profileId || socket.player.profileId;
            const teamSize = Number(message.teamSize || 1);
            if (![1, 2, 4, 8].includes(teamSize)) {
                send(socket, { type: 'error', error: 'Tournament size not supported' });
                return;
            }
            leaveCurrentRoom(socket);
            removeFromTournamentQueues(socket);
            const queue = tournamentQueues.get(teamSize);
            queue.push(socket);
            send(socket, { type: 'tournamentQueued', teamSize, queued: queue.length, needed: tournamentNeeded(teamSize) });
            maybeStartTournament(teamSize);
            return;
        }

        if (message.type === 'cancelTournament') {
            removeFromTournamentQueues(socket);
            return;
        }

        if (message.type === 'createRoom') {
            socket.player.name = safePlayerName(message.name || socket.player.name, playerId);
            socket.player.profileId = message.profileId || socket.player.profileId;
            const room = {
                code: makeCode(),
                visibility: message.visibility === 'public' ? 'public' : 'private',
                kind: message.kind || 'classic',
                status: 'waiting',
                adminId: socket.player.id,
                settings: { duration: Number(message.duration || 180), difficulty: message.difficulty || 'medium', timed: Boolean(message.timed) },
                teamAssignments: {},
                teamRequests: [],
                teamCount: 2,
                nextSpawnIndex: 0,
                players: new Map()
            };
            rooms.set(room.code, room);
            joinRoom(socket, room);
            return;
        }

        if (message.type === 'joinRoom') {
            removeFromTournamentQueues(socket);
            socket.player.name = safePlayerName(message.name || socket.player.name, playerId);
            socket.player.profileId = message.profileId || socket.player.profileId;
            const code = String(message.code || '').trim().toUpperCase();
            const room = rooms.get(code);
            if (!room) {
                send(socket, { type: 'error', error: 'Room not found' });
                return;
            }
            if (room.status === 'started' && room.kind === 'tournament') {
                send(socket, { type: 'error', error: 'That game has already started' });
                return;
            }
            if (room.status === 'started' && room.kind === 'team') {
                const teams = Array.from({ length: room.teamCount || 2 }, (_, index) => 'team-' + (index + 1));
                const counts = Object.fromEntries(teams.map((team) => [team, 0]));
                Object.values(room.teamAssignments).forEach((team) => {
                    if (counts[team] !== undefined) counts[team] += 1;
                });
                room.teamAssignments[socket.player.id] = teams.sort((a, b) => counts[a] - counts[b])[0];
            }
            const resumed = joinRoom(socket, room);
            if (room.status === 'started') {
                send(socket, {
                    type: 'matchStarted',
                    room: roomSummary(room),
                    assignments: room.teamAssignments,
                    resumeState: resumed ? socket.player.state : null
                });
            }
            return;
        }

        if (message.type === 'leaveRoom') {
            if (message.state && typeof message.state === 'object') {
                socket.player.state = message.state;
            }
            leaveCurrentRoom(socket);
            send(socket, { type: 'roomList', rooms: publicRooms() });
            return;
        }

        const room = socket.player.roomCode ? rooms.get(socket.player.roomCode) : null;
        if (!room) return;

        if (message.type === 'assignTeams' && room.kind !== 'tournament' && room.adminId === socket.player.id) {
            room.teamAssignments = message.assignments || {};
            room.teamRequests = (room.teamRequests || []).filter((request) => room.teamAssignments[request.playerId] !== request.team);
            broadcastRoom(room, { type: 'teamAssignments', assignments: room.teamAssignments });
            sendTeamRequests(room);
            broadcastRoomList();
        }

        if (message.type === 'setTeamCount' && room.kind === 'team' && room.adminId === socket.player.id) {
            room.teamCount = Math.max(2, Math.min(20, Number(message.teamCount) || 2));
            const validTeams = new Set(Array.from({ length: room.teamCount }, (_, index) => 'team-' + (index + 1)));
            Object.keys(room.teamAssignments).forEach((id) => {
                if (!validTeams.has(room.teamAssignments[id])) delete room.teamAssignments[id];
            });
            room.teamRequests = (room.teamRequests || []).filter((request) => validTeams.has(request.team));
            broadcastRoom(room, { type: 'teamCountChanged', teamCount: room.teamCount, assignments: room.teamAssignments });
            sendTeamRequests(room);
            return;
        }

        if (message.type === 'teamRequest' && room.kind === 'team') {
            const team = String(message.team || '').toLowerCase();
            const validTeams = Array.from({ length: room.teamCount || 2 }, (_, index) => 'team-' + (index + 1));
            if (!validTeams.includes(team) || room.teamAssignments[socket.player.id] === team) return;
            room.teamRequests = (room.teamRequests || []).filter((request) => request.playerId !== socket.player.id);
            room.teamRequests.push({ playerId: socket.player.id, playerName: socket.player.name || socket.player.id, team });
            sendTeamRequests(room);
        }

        if (message.type === 'teamRequestDecision' && room.kind !== 'tournament' && room.adminId === socket.player.id) {
            const playerId = String(message.playerId || '');
            const request = (room.teamRequests || []).find((item) => item.playerId === playerId);
            room.teamRequests = (room.teamRequests || []).filter((item) => item.playerId !== playerId);
            if (message.accept && request) {
                room.teamAssignments[playerId] = request.team;
                broadcastRoom(room, { type: 'teamAssignments', assignments: room.teamAssignments });
            }
            sendTeamRequests(room);
            broadcastRoomList();
        }

        if (message.type === 'startMatch' && room.kind !== 'tournament' && room.adminId === socket.player.id) {
            room.status = 'started';
            room.startedAt = Date.now();
            room.settings.duration = Number(message.duration || room.settings.duration || 180);
            room.settings.timed = Boolean(message.timed);
            broadcastRoom(room, {
                type: 'matchStarted',
                room: roomSummary(room),
                assignments: room.teamAssignments
            });
            broadcastRoomList();
        }

        if (message.type === 'tournamentRoundComplete' && room.kind === 'tournament') {
            finishTournamentMatch(room);
            return;
        }

        if (message.type === 'playerState') {
            socket.player.state = message.state;
            socket.player.name = message.state?.name || socket.player.name;
            socket.player.profileId = message.profileId || socket.player.profileId;
            broadcastRoom(room, {
                type: 'playerState',
                id: socket.player.id,
                color: socket.player.color,
                state: message.state
            }, socket);
        }

        if (message.type === 'kettleLaunch') {
            broadcastRoom(room, {
                type: 'kettleLaunch',
                id: socket.player.id,
                color: Number(message.color || socket.player.color),
                position: message.position,
                velocity: message.velocity,
                sizeMultiplier: message.sizeMultiplier || 1,
                damage: message.damage || 25,
                powerLevel: Math.max(0, Number(message.powerLevel || 0)),
                advanced: Boolean(message.advanced)
            }, socket);
        }
    });

    socket.on('close', () => {
        leaveCurrentRoom(socket);
    });
});
