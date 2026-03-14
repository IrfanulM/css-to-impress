import { htmlPrompts } from './htmlPrompts.js';

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> { id, host, state, players: [ { id, name, css, ready, score, votesReceived: [] } ], htmlIndex, endTime }
    this.playerRooms = new Map(); // socketId -> roomId
    this.disconnectTimers = new Map(); // socketId -> timeoutId for grace-period disconnects
    this.explicitLeaves = new Set(); // socketIds that chose "Leave" (button or tab close) so we skip grace period
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

  reconnectRoom(socket, roomId, previousId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit('errorMsg', 'Room not found or reconnect window expired');
      return;
    }

    if (room.state !== 'PLAYING' && room.state !== 'VOTING') {
      socket.emit('errorMsg', 'Game is not in a reconnectable state');
      return;
    }

    const player = room.players.find(
      (p) => p.id === previousId && p.temporarilyDisconnected
    );

    if (!player) {
      socket.emit('errorMsg', 'Unable to reconnect to this game');
      return;
    }

    const timer = this.disconnectTimers.get(previousId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(previousId);
    }

    // Rebind this logical player to the new socket
    this.playerRooms.delete(previousId);
    player.id = socket.id;
    delete player.temporarilyDisconnected;
    this.playerRooms.set(socket.id, roomId);
    socket.join(roomId);

    this.io.to(roomId).emit('playerReconnected', {
      playerId: player.id,
      playerName: player.name,
    });
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

    const room = this.rooms.get(roomId);
    if (!room) {
      this.playerRooms.delete(socketId);
      return;
    }

    // Explicit leave (Leave button or tab close with confirm): remove immediately, no grace period
    if (this.explicitLeaves.has(socketId)) {
      this.explicitLeaves.delete(socketId);
      this.playerRooms.delete(socketId);
      this._removePlayerFromRoom(roomId, room, socketId);
      return;
    }

    const isActiveGame = room.state === 'PLAYING' || room.state === 'VOTING';

    // For active games (PLAYING/VOTING), start a 60s grace period instead of
    // immediately removing the player and resolving the game.
    if (isActiveGame) {
      const player = room.players.find(p => p.id === socketId);
      if (!player) {
        this.playerRooms.delete(socketId);
        return;
      }

      // Mark player as temporarily disconnected
      player.temporarilyDisconnected = true;
      const expiresAt = Date.now() + 60_000;

      // Clear any existing timer for this socket
      const existingTimer = this.disconnectTimers.get(socketId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Notify remaining players that the game is paused waiting on this player
      this.io.to(roomId).emit('playerTemporarilyDisconnected', {
        roomId,
        playerId: player.id,
        playerName: player.name,
        expiresAt,
      });

      const timeoutId = setTimeout(() => {
        const currentRoom = this.rooms.get(roomId);
        if (!currentRoom) {
          this.disconnectTimers.delete(socketId);
          return;
        }

        const idx = currentRoom.players.findIndex(p => p.id === socketId);
        if (idx === -1) {
          // Player no longer in this room (rejoined under a new id or was removed)
          this.disconnectTimers.delete(socketId);
          return;
        }

        const disconnectedPlayer = currentRoom.players[idx];
        if (!disconnectedPlayer.temporarilyDisconnected) {
          // Player already marked as reconnected
          this.disconnectTimers.delete(socketId);
          return;
        }

        const wasTwoPlayerGame = currentRoom.players.length === 2;

        if (wasTwoPlayerGame) {
          // 2-player game: after grace period, remaining player wins by forfeit
          currentRoom.players.splice(idx, 1); // remove disconnected

          if (currentRoom.players.length === 1) {
            currentRoom.state = 'RESULTS';
            currentRoom.players[0].score = 1;
            currentRoom.forfeitWin = true;
            this.io.to(roomId).emit('resultsCalculated');
            this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(currentRoom));
          } else if (currentRoom.players.length === 0) {
            this.rooms.delete(roomId);
          }
        } else {
          // 3+ player game: remove disconnected player and continue
          currentRoom.players.splice(idx, 1);

          const activePlayers = currentRoom.players.filter(p => this.playerRooms.has(p.id));

          if (currentRoom.host === socketId && activePlayers.length > 0) {
            currentRoom.host = activePlayers[0].id;
            const newHost = currentRoom.players.find(p => p.id === currentRoom.host);
            if (newHost) {
              this.io.to(roomId).emit('hostReassigned', { newHostId: currentRoom.host, newHostName: newHost.name });
            }
          }

          this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(currentRoom));
        }

        this.disconnectTimers.delete(socketId);
      }, 60_000);

      this.disconnectTimers.set(socketId, timeoutId);

      // Mark socket as inactive for future activePlayers calculations
      this.playerRooms.delete(socketId);
      return;
    }

    // Non-active game (LOBBY, TEMPLATE_VOTING, RESULTS): keep immediate behavior
    this.playerRooms.delete(socketId);

    const nonActiveRoom = this.rooms.get(roomId);
    if (!nonActiveRoom) return;

    // Do not remove players from RESULTS so leaderboard stays intact
    if (nonActiveRoom.state !== 'RESULTS') {
      nonActiveRoom.players = nonActiveRoom.players.filter(p => p.id !== socketId);
    }

    const activePlayers = nonActiveRoom.players.filter(p => this.playerRooms.has(p.id));

    if (activePlayers.length === 0) {
      this.rooms.delete(roomId);
    } else {
      if (nonActiveRoom.host === socketId && activePlayers.length > 0) {
        nonActiveRoom.host = activePlayers[0].id;
        const newHost = nonActiveRoom.players.find(p => p.id === nonActiveRoom.host);
        if (newHost) {
          this.io.to(roomId).emit('hostReassigned', { newHostId: nonActiveRoom.host, newHostName: newHost.name });
        }
      }
      this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(nonActiveRoom));
    }
  }

  leaveRoom(socket) {
    this.explicitLeaves.add(socket.id);
    const roomId = this.playerRooms.get(socket.id);
    if (roomId) {
      socket.leave(roomId);
    }
    this.handleDisconnect(socket.id);
  }

  /** Mark a socket as having left explicitly (e.g. tab-close beacon). Next disconnect will skip grace. */
  markExplicitLeave(socketId) {
    this.explicitLeaves.add(socketId);
  }

  /** Remove one player from a room and apply forfeit / host reassignment / room delete. */
  _removePlayerFromRoom(roomId, room, socketId) {
    if (room.state !== 'RESULTS') {
      room.players = room.players.filter(p => p.id !== socketId);
    }
    const activePlayers = room.players.filter(p => this.playerRooms.has(p.id));
    if (activePlayers.length === 0) {
      this.rooms.delete(roomId);
      return;
    }
    if (room.players.length === 1) {
      room.state = 'RESULTS';
      room.players[0].score = 1;
      room.forfeitWin = true;
      this.io.to(roomId).emit('resultsCalculated');
      this.io.to(roomId).emit('roomUpdated', this._sanitizeRoom(room));
    } else {
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
