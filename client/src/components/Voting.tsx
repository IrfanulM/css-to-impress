import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Star, Check } from 'lucide-react';

export function Voting({ room }: { room: any }) {
  const { socket } = useSocket();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [givenVotes, setGivenVotes] = useState<Record<string, number>>({});

  const opponents = room.players.filter((p: any) => p.id !== socket?.id);
  const currentPlayerInView = opponents.find((p: any) => p.id === selectedPlayerId) || opponents[0];

  const handleVote = (score: number) => {
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
      <header style={{ padding: '24px 32px', borderBottom: 'var(--line-thickness) solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
        <div>
          <h2 className="title-small" style={{ margin: 0, fontSize: '1.8rem' }}>Voting Phase</h2>
        </div>
        <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-muted)' }}>Rate the designs of the other players</p>
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
              <span style={{ fontWeight: '600', fontSize: '1.2rem', textTransform: 'capitalize' }}>{p.name}</span>
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
                          ${room.htmlTemplate || '<div style="color: #666;">Preview unvailable.</div>'}
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
    </div>
  );
}
