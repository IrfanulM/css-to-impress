import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Users, Code2, Copy, ArrowRight } from 'lucide-react';

export function Lobby({ room, defaultRoomId }: { room?: any, defaultRoomId?: string }) {
  const { socket } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [roomIdToJoin, setRoomIdToJoin] = useState(defaultRoomId || '');
  const [isJoinMode, setIsJoinMode] = useState(!!defaultRoomId);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !socket) return;
    socket.emit('createRoom', { playerName });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomIdToJoin.trim() || !socket) return;
    socket.emit('joinRoom', { roomId: roomIdToJoin, playerName });
  };

  const handleStartGame = () => {
    if (!socket || !room) return;
    socket.emit('startGame', { roomId: room.id });
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/room/${room.id}`;
    navigator.clipboard.writeText(url);
  };

  if (room) {
    const isHost = socket?.id === room.host;
    return (
      <div className="screen-center">
        <div className="flat-card animate-fade-in" style={{ width: '100%', maxWidth: '700px', padding: 0 }}>
          <div className="linear-accent-bar">
            <div className="bar-red"></div>
            <div className="bar-blue"></div>
            <div className="bar-yellow"></div>
          </div>
          
          <div style={{ padding: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: 'var(--line-thickness) solid var(--border-color)', paddingBottom: '32px', marginBottom: '32px' }}>
              <div>
                <h2 className="title-small" style={{ fontSize: '2.5rem', margin: 0 }}>Room / {room.id}</h2>
                <p className="subtitle" style={{ margin: '8px 0 0 0' }}>Waiting for players...</p>
              </div>
              <button onClick={copyInviteLink} style={{ padding: '10px 16px', fontSize: '0.9rem' }}>
                <Copy size={16} /> Link
              </button>
            </div>

            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontWeight: 600, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>
                <Users size={18} />
                Players ({room.players.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {room.players.map((p: any, i: number) => {
                  const colors = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--text-main)'];
                  const color = colors[i % colors.length];
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: 'var(--line-thickness) solid var(--border-color)' }}>
                      <div style={{ width: '12px', height: '12px', background: color, borderRadius: '50%' }}></div>
                      <span style={{ fontWeight: p.id === socket?.id ? '600' : '400', fontSize: '1.1rem' }}>
                        {p.name} {p.id === socket?.id && '(You)'}
                      </span>
                      {p.id === room.host && <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Host</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {isHost ? (
                <button onClick={handleStartGame} disabled={room.players.length < 2} className="btn-primary" style={{ padding: '16px 40px' }}>
                  Start Game <ArrowRight size={20} />
                </button>
              ) : (
                <span style={{ fontWeight: 500, padding: '16px 32px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  Waiting for host to start
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create/Join screen
  return (
    <div className="screen-center">
      <div className="flat-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: 0 }}>
        <div className="linear-accent-bar">
          <div className="bar-blue"></div>
          <div className="bar-yellow"></div>
          <div className="bar-red"></div>
        </div>
        
        <div style={{ padding: '48px' }}>
          <div style={{ marginBottom: '40px' }}>
            <Code2 size={32} color="var(--primary)" style={{ marginBottom: '16px' }} />
            <h1 className="title-linear">Code <span style={{ fontWeight: 400 }}>To</span><br/>Impress</h1>
            <p className="subtitle" style={{ marginTop: '16px' }}>Dress To Impress, but for developers.</p>
          </div>

          <div style={{ display: 'flex', borderBottom: 'var(--line-thickness) solid var(--border-color)', marginBottom: '32px' }}>
            <button 
              type="button"
              style={{ flex: 1, border: 'none', background: 'transparent', color: !isJoinMode ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: !isJoinMode ? '2px solid var(--primary)' : '2px solid transparent' }}
              onClick={() => setIsJoinMode(false)}
            >
              CREATE
            </button>
            <button 
              type="button"
              style={{ flex: 1, border: 'none', background: 'transparent', color: isJoinMode ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: isJoinMode ? '2px solid var(--primary)' : '2px solid transparent' }}
              onClick={() => setIsJoinMode(true)}
            >
              JOIN
            </button>
          </div>

          {!isJoinMode ? (
            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <input 
                type="text" 
                placeholder="Your Nickname" 
                value={playerName} 
                onChange={(e) => setPlayerName(e.target.value)} 
                required 
                maxLength={20}
              />
              <button type="submit" style={{ width: '100%', marginTop: '16px' }}>Create Room</button>
            </form>
          ) : (
            <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <input 
                type="text" 
                placeholder="Room ID" 
                value={roomIdToJoin} 
                onChange={(e) => setRoomIdToJoin(e.target.value)} 
                required 
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
              />
              <input 
                type="text" 
                placeholder="Your Nickname" 
                value={playerName} 
                onChange={(e) => setPlayerName(e.target.value)} 
                required 
                maxLength={20}
              />
              <button type="submit" style={{ width: '100%', marginTop: '16px' }}>
                Join Room
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
