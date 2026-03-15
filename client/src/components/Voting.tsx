import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Star, Check, LogOut } from 'lucide-react';
import Avatar from 'boring-avatars';

export function Voting({ room }: { room: any }) {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [givenVotes, setGivenVotes] = useState<Record<string, number>>({});
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const opponents = room.players.filter((p: any) => p.id !== socket?.id);
  const currentPlayerInView = opponents.find((p: any) => p.id === selectedPlayerId) || opponents[0];

  const handleVote = (score: number) => {
    const audio = new Audio("/sounds/star.mp3");
    audio.play();
    if (!socket || !currentPlayerInView) return;
    socket.emit('submitVote', { roomId: room.id, votedPlayerId: currentPlayerInView.id, score });
    setGivenVotes(prev => ({ ...prev, [currentPlayerInView.id]: score }));
    
    const nextUnvoted = opponents.find((p: any) => p.id !== currentPlayerInView.id && !givenVotes[p.id]);
    if (nextUnvoted) {
      setTimeout(() => setSelectedPlayerId(nextUnvoted.id), 500);
    }
  };

  if (!opponents.length) {
    return <div className="screen-center"><h3 className="title-small" style={{ color: 'var(--text-main)' }}>You are the only player! Waiting for game to end.</h3></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', background: 'var(--bg-main)' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', borderBottom: 'var(--line-thickness) solid var(--border-color)' }}>
        <div className="linear-accent-bar" style={{ height: '4px' }}>
          <div className="bar-red"></div>
          <div className="bar-blue"></div>
          <div className="bar-yellow"></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h2 style={{ margin: 0, padding: 0, fontSize: '1.5rem' }} className="title-small">Code to Impress</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Room {room.id}</span>
            <span style={{ width: '4px', height: '4px', background: 'var(--border-color)', borderRadius: '50%' }}></span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-main)' }}>Rating Phase</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', letterSpacing: '0.5px' }}>RATE THE DESIGNS</p>
          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              border: '1px solid var(--text-muted)',
              color: 'var(--text-muted)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <LogOut size={14} /> Leave game
          </button>
        </div>
      </div>
    </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Participants Sidebar */}
        <div style={{ width: '320px', background: 'var(--bg-card)', borderRight: 'var(--line-thickness) solid var(--border-color)', overflowY: 'auto' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #EEEEEE', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px' }}>
            PLAYERS
          </div>
          {opponents.map((p: any) => (
            <div 
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id)}
              style={{
                padding: '24px',
                cursor: 'pointer',
                borderBottom: '1px solid #EEEEEE',
                background: currentPlayerInView?.id === p.id ? '#FAFAFA' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: currentPlayerInView?.id === p.id ? '4px solid var(--secondary)' : '4px solid transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', border: 'var(--line-thickness) solid var(--border-color)', borderRadius: '50%', overflow: 'hidden' }}>
                  <Avatar 
                    size={36} 
                    name={p.name} 
                    variant="beam" 
                    colors={[['#E03C31', '#005BBB', '#FFD100'][(p.name || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 3]]} 
                  />
                </div>
                <span style={{ fontWeight: '600', fontSize: '1.2rem', textTransform: 'capitalize' }}>{p.name}</span>
              </div>
              {givenVotes[p.id] ? (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)', fontWeight: '600', fontSize: '1.1rem' }}>
                   <Check size={18} strokeWidth={3} /> {givenVotes[p.id]}
                 </div>
              ) : (
                 <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }}></div>
              )}
            </div>
          ))}
        </div>

        {/* Evaluation Board */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
          {currentPlayerInView ? (
            <>
              {/* Toolbar */}
              <div style={{ padding: '24px 48px', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Design by</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{currentPlayerInView.name}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      onClick={() => handleVote(star)}
                      style={{ 
                        background: givenVotes[currentPlayerInView.id] >= star ? 'var(--text-main)' : 'white',
                        padding: '12px', 
                        border: '1px solid var(--border-color)',
                        color: givenVotes[currentPlayerInView.id] >= star ? 'var(--accent)' : 'var(--text-muted)',
                        borderRadius: '0',
                        width: '48px',
                        height: '48px'
                      }}>
                      <Star size={24} fill={givenVotes[currentPlayerInView.id] >= star ? 'var(--accent)' : 'none'} strokeWidth={givenVotes[currentPlayerInView.id] >= star ? 0 : 1.5} />
                    </button>
                  ))}
                </div>
              </div>

              {/* iframe container */}
              <div style={{ flex: 1, padding: '0 48px 48px 48px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, background: 'white', border: 'var(--line-thickness) solid var(--border-color)', position: 'relative' }}>
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <style>
                            body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; background: white; color: black; }
                            * { box-sizing: border-box; }
                            ${currentPlayerInView.css}
                          </style>
                        </head>
                        <body>
                          ${room.htmlTemplate || `
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 80vh; gap: 24px; opacity: 0.3;">
                              <div style="width: 48px; height: 48px; background: #E03C31; border-radius: 50%;"></div>
                              <div style="font-weight: 800; text-transform: uppercase; letter-spacing: 2px; font-size: 14px;">Review Phase</div>
                            </div>
                          `}
                        </body>
                      </html>
                    `}
                    style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
                    title="Preview"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="screen-center"><h3 style={{ color: 'var(--text-muted)' }}>Select a player to view</h3></div>
          )}
        </div>
      </div>
      <div className="linear-accent-bar" style={{ height: '4px' }}>
        <div className="bar-blue"></div>
        <div className="bar-yellow"></div>
        <div className="bar-red"></div>
      </div>

      {showLeaveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowLeaveModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '32px 40px',
              maxWidth: '420px',
              border: 'var(--line-thickness) solid var(--border-color)',
              boxShadow: '0 20px 48px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: '0 0 24px', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.4 }}>
              Are you sure you wish to leave? The game will proceed.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                style={{ padding: '10px 20px', border: '1px solid var(--border-color)', background: 'transparent', fontWeight: 600 }}
              >
                Stay
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('cti_lastRoomId');
                    localStorage.removeItem('cti_lastPlayerId');
                  } catch { /* ignore */ }
                  socket?.emit('leaveRoom');
                  navigate('/');
                }}
                style={{ padding: '10px 20px', background: 'var(--text-main)', color: 'white', border: 'none', fontWeight: 600 }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
