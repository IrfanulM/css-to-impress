import { htmlPrompts } from './htmlPrompts.js';

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> { id, host, state, players: [ { id, name, css, ready, score, votesReceived: [] } ], htmlIndex, endTime }
    this.playerRooms = new Map(); // socketId -> roomId
  }

  createRoom(socket, playerName) {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const player = { id: socket.id, name: playerName, css: '', ready: false, score: 0, votesReceived: [] };
    
    this.rooms.set(roomId, {
      id: roomId,
      host: socket.id,
      state: 'LOBBY',
      players: [player],
      htmlIndex: Math.floor(Math.random() * htmlPrompts.length),
      endTime: null
    });
    
    this.playerRooms.set(socket.id, roomId);
    socket.join(roomId);
    
    socket.emit('roomCreated', { roomId, player });
    this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(this.rooms.get(roomId)));
  }

  joinRoom(socket, roomId, playerName) {
    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit('errorMsg', 'Room not found');
      return;
    }
    if (room.state !== 'LOBBY') {
      socket.emit('errorMsg', 'Game already in progress');
      return;
    }

    const player = { id: socket.id, name: playerName, css: '', ready: false, score: 0, votesReceived: [] };
    room.players.push(player);
    this.playerRooms.set(socket.id, roomId);
    socket.join(roomId);

    socket.emit('roomJoined', { roomId, player });
    this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(room));
  }

  startGame(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room || room.host !== socketId || room.state !== 'LOBBY') return;
    
    room.state = 'PLAYING';
    const GAME_DURATION_MS = 10 * 60 * 1000; // 10 minutes
    room.endTime = Date.now() + GAME_DURATION_MS;

    const htmlPrompt = htmlPrompts[room.htmlIndex];

    this.io.to(roomId).emit('gameStarted', {
      endTime: room.endTime,
      html: htmlPrompt
    });
    this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(room));

    // Basic timer handling. In a robust production app, use scheduled jobs.
    setTimeout(() => {
      this.finishGameTime(roomId);
    }, GAME_DURATION_MS);
  }

  submitCss(socketId, roomId, css) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'PLAYING') return;

    const player = room.players.find(p => p.id === socketId);
    if (player) {
      player.css = css;
    }
  }

  finishGameTime(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'PLAYING') return;
    
    room.state = 'VOTING';
    this.io.to(roomId).emit('votingStarted');
    this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(room));
  }

  forceEndGame(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'PLAYING') return;
    if (room.host !== socketId) return; // Only host can force end

    // End exactly like a timer finish
    this.finishGameTime(roomId);
  }

  submitVote(socketId, roomId, votedPlayerId, score) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'VOTING') return;

    if (socketId === votedPlayerId) return;

    const targetPlayer = room.players.find(p => p.id === votedPlayerId);
    if (!targetPlayer) return;

    const existingVoteIndex = targetPlayer.votesReceived.findIndex(v => v.voterId === socketId);
    if (existingVoteIndex >= 0) {
        targetPlayer.votesReceived[existingVoteIndex].score = score;
    } else {
        targetPlayer.votesReceived.push({ voterId: socketId, score });
    }

    const expectedTotalVotes = (room.players.length - 1) * room.players.length;
    let actualTotalVotes = 0;
    room.players.forEach(p => actualTotalVotes += p.votesReceived.length);

    if (actualTotalVotes >= expectedTotalVotes) {
      this._calculateResultsAndEnd(room);
    }
  }

  _calculateResultsAndEnd(room) {
    room.state = 'RESULTS';
    room.players.forEach(p => {
      const totalScore = p.votesReceived.reduce((sum, v) => sum + v.score, 0);
      p.score = p.votesReceived.length ? (totalScore / p.votesReceived.length) : 0;
    });

    room.players.sort((a, b) => b.score - a.score);

    this.io.to(room.id).emit('resultsCalculated');
    this.io.to(room.id).emit('roomUpdated', this._sanitizeRoom(room));
  }

  handleDisconnect(socketId) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) return;
    
    const room = this.rooms.get(roomId);
    if (room) {
      room.players = room.players.filter(p => p.id !== socketId);
      if (room.players.length === 0) {
        this.rooms.delete(roomId);
      } else {
        if (room.host === socketId) {
          room.host = room.players[0].id; // Reassign host
        }
        this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(room));
      }
    }
    this.playerRooms.delete(socketId);
  }

  _sanitizeRoom(room) {
    return {
      id: room.id,
      host: room.host,
      state: room.state,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        hasVoted: p.votesReceived.length, 
        css: room.state === 'PLAYING' ? null : p.css
      })),
      endTime: room.endTime,
      htmlTemplate: room.state !== 'LOBBY' ? htmlPrompts[room.htmlIndex] : null
    };
  }
}
