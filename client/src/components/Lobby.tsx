import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Users, Code2, Copy, ArrowRight, Minus, Plus } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

export function Lobby({ room, defaultRoomId }: { room?: any, defaultRoomId?: string }) {
  const { socket } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [roomIdToJoin, setRoomIdToJoin] = useState(defaultRoomId || '');
  const [isJoinMode, setIsJoinMode] = useState(!!defaultRoomId);
  const [isCopyActive, setIsCopyActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const playJoinSound = (): void => {
    const audio = new Audio("/sounds/player-join.mp3");
    audio.play();
  }

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !socket) return;
    socket.emit('createRoom', { playerName });
    playJoinSound();
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomIdToJoin.trim() || !socket) return;
    socket.emit('joinRoom', { roomId: roomIdToJoin, playerName });
    playJoinSound();
  };

  const handleStartGame = () => {
    if (!socket || !room) return;
    const audio = new Audio("/sounds/button1.mp3");
    audio.play();
    socket.emit('startGame', { roomId: room.id });
  };

  const handleSettingsChange = (newSettings: any) => {
    if (!socket || !room || socket.id !== room.host) return;
    socket.emit('updateRoomSettings', { 
      roomId: room.id, 
      settings: { ...room.settings, ...newSettings } 
    });
  };

  const copyInviteLink = () => {
    if (!room?.id) return;
    const code = room.id;

    navigator.clipboard.writeText(code).then(() => {
      setIsCopyActive(true);
      const audio = new Audio("/sounds/button1.mp3");
      audio.play();
      setToastMessage(`Game code ${code} has been added to clipboard`);

      setTimeout(() => {
        setIsCopyActive(false);
      }, 180);

      setTimeout(() => {
        setToastMessage(null);
      }, 2000);
    });
  };

  if (room) {
    const isHost = socket?.id === room.host;
    return (
      <>
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
              <button
                onClick={copyInviteLink}
                style={{
                  padding: '10px 16px',
                  fontSize: '0.9rem',
                  transform: isCopyActive ? 'scale(1.07)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <Copy size={16} /> Code
              </button>
            </div>

            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontWeight: 600, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>
                <Users size={18} />
                Players ({room.players.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {room.players.map((p: any) => {
                  return (                    <div 
                      key={p.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px', 
                        padding: '16px', 
                        border: 'var(--line-thickness) solid var(--border-color)',
                        background: 'white',
                        boxShadow: '4px 4px 0px var(--border-color)',
                      }}
                    >
                      <UserAvatar name={p.name} size={40} />
                      <span style={{ fontWeight: p.id === socket?.id ? '600' : '400', fontSize: '1.1rem' }}>
                        {p.name} {p.id === socket?.id && '(You)'}
                      </span>
                      {p.id === room.host && <span className="bauhaus-label" style={{ marginLeft: 'auto' }}>Host</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ 
              marginBottom: '32px', 
              padding: '24px', 
              border: 'var(--line-thickness) solid var(--border-color)', 
              background: 'var(--bg-main)',
            }}>

              <h3 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '20px', 
                marginTop: '4px',
                fontWeight: 800, 
                fontSize: '1rem', 
                textTransform: 'uppercase', 
                letterSpacing: '1px', 
                color: 'var(--text-main)' 
              }}>
                 Lobby Settings
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'white',
                  padding: '16px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>How many minutes?</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f5f5f5', padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}>
                    {isHost ? (
                        <>
                          <button 
                            type="button"
                            className="no-swoop"
                            onClick={() => {
                                const current = room.settings?.gameDuration || 10;
                                if (current > 1) handleSettingsChange({ gameDuration: current - 1 });
                            }}
                            disabled={!isHost || (room.settings?.gameDuration || 10) <= 1}
                            style={{ padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #ccc', minWidth: 'unset', width: '24px', height: '24px', borderRadius: '4px' }}
                          >
                            <Minus size={14} />
                          </button>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--secondary)', minWidth: '24px', textAlign: 'center' }}>
                            {room.settings?.gameDuration || 10}
                          </span>
                          <button 
                            type="button"
                            className="no-swoop"
                            onClick={() => {
                                const current = room.settings?.gameDuration || 10;
                                if (current < 60) handleSettingsChange({ gameDuration: current + 1 });
                            }}
                            disabled={!isHost || (room.settings?.gameDuration || 10) >= 60}
                            style={{ padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #ccc', minWidth: 'unset', width: '24px', height: '24px', borderRadius: '4px' }}
                          >
                            <Plus size={14} />
                          </button>
                        </>
                    ) : (
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--secondary)', minWidth: '24px', textAlign: 'center', padding: '0 4px' }}>
                            {room.settings?.gameDuration || 10}
                        </span>
                    )}
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'white',
                  padding: '16px',
                  border: '1px solid var(--border-color)',
                  opacity: isHost ? 1 : 0.7
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Disable Copy/Paste</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prevent pasting code</span>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: isHost ? 'pointer' : 'default' }}>
                    <input 
                      type="checkbox" 
                      checked={room.settings?.disableCopyPaste || false} 
                      onChange={(e) => handleSettingsChange({ disableCopyPaste: e.target.checked })}
                      disabled={!isHost}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: isHost ? 'pointer' : 'default',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: room.settings?.disableCopyPaste ? 'var(--primary)' : '#ccc',
                      transition: '.3s',
                      borderRadius: '34px'
                    }}></span>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '16px',
                      width: '16px',
                      left: '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '.3s',
                      borderRadius: '50%',
                      transform: room.settings?.disableCopyPaste ? 'translateX(20px)' : 'none'
                    }}></span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {isHost ? (
                <div 
                  className={room.players.length < 2 ? "custom-tooltip" : ""} 
                  data-msg={room.players.length < 2 ? "A game must have at least 2 players to start" : undefined}
                >
                  <button 
                    onClick={handleStartGame} 
                    disabled={room.players.length < 2} 
                    className="btn-primary" 
                    style={{ padding: '16px 40px' }}
                  >
                    Start Game <ArrowRight size={20} />
                  </button>
                </div>
              ) : (
                <span style={{ fontWeight: 500, padding: '16px 32px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  Waiting for host to start
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {toastMessage && (
        <div
          className="title-small"
          style={{
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%) scale(1.05)',
            padding: '16px 28px',
            background: 'var(--bg-elevated)',
            border: 'var(--line-thickness) solid var(--border-color)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
            borderRadius: '999px',
            fontSize: '1.2rem',
            zIndex: 1000,
          }}
        >
          {toastMessage}
        </div>
      )}
      </>
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
            <div style={{ position: 'relative' }}>
              <h1 className="title-linear">CSS <span style={{ fontWeight: 400 }}>To</span><br/>Impress</h1>
            </div>
            <p className="subtitle" style={{ marginTop: '16px' }}>Dress To Impress, but for developers.</p>
          </div>

          <div style={{ display: 'flex', borderBottom: 'var(--line-thickness) solid var(--border-color)', marginBottom: '32px' }}>
            <button 
              type="button"
              className="no-swoop"
              style={{ flex: 1, border: 'none', background: 'transparent', color: !isJoinMode ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: !isJoinMode ? '2px solid var(--primary)' : '2px solid transparent' }}
              onClick={() => setIsJoinMode(false)}
            >
              CREATE
            </button>
            <button 
              type="button"
              className="no-swoop"
              style={{ flex: 1, border: 'none', background: 'transparent', color: isJoinMode ? 'var(--text-main)' : 'var(--text-muted)', borderBottom: isJoinMode ? '2px solid var(--primary)' : '2px solid transparent' }}
              onClick={() => setIsJoinMode(true)}
            >
              JOIN
            </button>
          </div>

          {!isJoinMode ? (
            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <UserAvatar name={playerName || 'Guest'} size={48} />
                <input 
                  type="text" 
                  placeholder="Your Nickname" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)} 
                  required 
                  maxLength={20}
                  style={{ flex: 1 }}
                />
              </div>
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
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <UserAvatar name={playerName || 'Guest'} size={48} />
                <input 
                  type="text" 
                  placeholder="Your Nickname" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)} 
                  required 
                  maxLength={20}
                  style={{ flex: 1 }}
                />
              </div>
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
