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
      endTime: null,
      settings: {
        gameDuration: 10,
        disableCopyPaste: false
      }
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
    
    room.state = 'TEMPLATE_VOTING';
    const VOTING_DURATION_MS = 20 * 1000; // 20 sec timer
    room.endTime = Date.now() + VOTING_DURATION_MS;
    
    // Pick 4 unique random templates
    const availableIndices = Array.from(htmlPrompts.keys());
    const selectedIndices = [];
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        selectedIndices.push(availableIndices[randomIndex]);
        availableIndices.splice(randomIndex, 1);
    }
    
    room.templateOptions = selectedIndices.map(index => ({
        index,
        name: htmlPrompts[index].name,
        votes: [] // array of socketIds who voted for this
    }));

    this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(room));

    room.timerTimeout = setTimeout(() => {
      this.startActualGame(roomId);
    }, VOTING_DURATION_MS);
  }

  submitTemplateVote(socketId, roomId, templateIndex) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'TEMPLATE_VOTING') return;

    // Remove old vote
    room.templateOptions.forEach(opt => {
        opt.votes = opt.votes.filter(id => id !== socketId);
    });

    // Add new vote
    const selectedOption = room.templateOptions.find(opt => opt.index === templateIndex);
    if (selectedOption) {
        selectedOption.votes.push(socketId);
    }

    this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(room));
  }

  startActualGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'TEMPLATE_VOTING') return;

    // Determine winner
    let maxVotes = -1;
    let winningIndex = room.templateOptions[0].index;
    
    room.templateOptions.forEach(opt => {
        if (opt.votes.length > maxVotes) {
            maxVotes = opt.votes.length;
            winningIndex = opt.index;
        }
    });

    room.state = 'PLAYING';
    room.htmlIndex = winningIndex;
    room.templateOptions = null; // Clean up

    const durationMins = room.settings?.gameDuration || 10;
    const GAME_DURATION_MS = durationMins * 60 * 1000;
    room.endTime = Date.now() + GAME_DURATION_MS;

    const htmlPrompt = htmlPrompts[room.htmlIndex];

    this.io.to(roomId).emit('gameStarted', {
      endTime: room.endTime,
      html: htmlPrompt.html,
      promptName: htmlPrompt.name
    });
    this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(room));

    room.timerTimeout = setTimeout(() => {
      this.finishGameTime(roomId);
    }, GAME_DURATION_MS);
  }

  updateRoomSettings(roomId, socketId, settings) {
    const room = this.rooms.get(roomId);
    if (!room || room.host !== socketId || room.state !== 'LOBBY') return;
    room.settings = settings;
    this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(room));
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
    
    // Mark as inactive by removing from tracking map
    this.playerRooms.delete(socketId);
    
    const room = this.rooms.get(roomId);
    if (room) {
      // 1. Forfeit Logic: check if this was a 2-player game in progress
      const wasTwoPlayerGame = room.players.length === 2 && 
        (room.state === 'PLAYING' || room.state === 'VOTING' || room.state === 'TEMPLATE_VOTING');

      // 2. Player removal policy: 
      // Do NOT remove players if we are in RESULTS state (so names stay on the leaderboard).
      if (room.state !== 'RESULTS') {
        room.players = room.players.filter(p => p.id !== socketId);
      }
      
      // Calculate how many people are actually still connected to the room
      const activePlayers = room.players.filter(p => this.playerRooms.has(p.id));
      
      if (activePlayers.length === 0) {
        // Garbage collection: no one is left, delete room
        this.rooms.delete(roomId);
      } else if (room.players.length === 1 && wasTwoPlayerGame) {
        // Forfeit Win for the survivor
        room.state = 'RESULTS';
        room.players[0].score = 1;
        room.forfeitWin = true;
        this.io.to(roomId).emit('resultsCalculated');
        this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(room));
      } else {
        // Standard reassignment: if host left, pick a new host from active players
        if (room.host === socketId && activePlayers.length > 0) {
          room.host = activePlayers[0].id;
          const newHost = room.players.find(p => p.id === room.host);
          if (newHost) {
            this.io.to(roomId).emit('hostReassigned', { newHostId: room.host, newHostName: newHost.name });
          }
        }
        this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(room));
      }
    }
  }

  leaveRoom(socket) {
    const roomId = this.playerRooms.get(socket.id);
    if (roomId) {
      socket.leave(roomId);
    }
    this.handleDisconnect(socket.id);
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
      htmlTemplate: (room.state !== 'LOBBY' && room.state !== 'TEMPLATE_VOTING') ? htmlPrompts[room.htmlIndex].html : null,
      promptName: (room.state !== 'LOBBY' && room.state !== 'TEMPLATE_VOTING') ? htmlPrompts[room.htmlIndex].name : null,
      templateOptions: room.templateOptions ? room.templateOptions.map(opt => ({
          index: opt.index,
          name: opt.name,
          voteCount: opt.votes.length,
          votes: opt.votes // array of socket IDs who voted for this
      })) : null,
      settings: room.settings,
      forfeitWin: room.forfeitWin || false
    };
  }
}
