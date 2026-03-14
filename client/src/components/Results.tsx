import { ArrowRight } from 'lucide-react';
import Avatar from 'boring-avatars';
import { useEffect, useState } from 'react';

export function Results({ room }: { room: any }) {
  const [sortedPlayers, setSortedPlayers] = useState<any[]>([]);

  useEffect(() => {
    const storageKey = `game_results_${room.id}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      setSortedPlayers(JSON.parse(stored));
    } else {
      setSortedPlayers(room.players);
      localStorage.setItem(storageKey, JSON.stringify(room.players));
    }
  }, [room.id, room.players]);

  const playAgain = () => {
    const audio = new Audio("/sounds/button1.mp3");
    audio.play();
    window.location.href = '/';
  };

  return (
    <div className="screen-center overflow-y-auto" style={{ background: 'var(--bg-main)' }}>
      <div className="container animate-fade-in" style={{ maxWidth: '900px', padding: '64px 0' }}>
        
        <div style={{ marginBottom: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: 'var(--line-thickness) solid var(--border-color)', paddingBottom: '24px' }}>
          <div>
            <h1 className="title-linear">Final Results</h1>
            <p className="subtitle" style={{ margin: '8px 0 0 0' }}>Room {room.id} Rankings</p>
            {room.forfeitWin && (
              <p className="subtitle" style={{ margin: '12px 0 0 0', fontWeight: 600, color: 'var(--primary)' }}>
                Winner by forfeit — opponent left the game.
              </p>
            )}
          </div>
          <button onClick={playAgain} className="btn-primary" style={{ padding: '14px 32px' }}>
            Play Again <ArrowRight size={20} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {sortedPlayers.map((player: any, index: number) => {
            const isTop = index === 0;

            return (
              <div 
                key={player.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'stretch', 
                  background: isTop ? 'var(--text-main)' : 'white',
                  color: isTop ? 'white' : 'var(--text-main)',
                  position: 'relative',
                  border: 'var(--line-thickness) solid var(--border-color)',
                  borderTop: index === 0 ? 'var(--line-thickness) solid var(--border-color)' : 'none',
                  overflow: 'hidden'
                }}
              >
                {isTop && (
                  <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '200px',
                    height: '200px',
                    background: 'var(--primary)',
                    opacity: 0.1,
                    borderRadius: '50%',
                    pointerEvents: 'none'
                  }}></div>
                )}
                {isTop && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-30px',
                    left: '100px',
                    width: '60px',
                    height: '60px',
                    border: '10px solid var(--accent)',
                    opacity: 0.2,
                    pointerEvents: 'none',
                    transform: 'rotate(45deg)'
                  }}></div>
                )}
                {/* Ranking block */}
                <div style={{ 
                  width: '80px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRight: isTop ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-color)',
                  fontWeight: '800',
                  fontSize: '1.5rem',
                  color: isTop ? 'var(--accent)' : 'var(--text-muted)'
                }}>
                  {index + 1}
                </div>

                {/* Name & Avatar */}
                <div style={{ 
                  flex: 1, 
                  padding: '32px', 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '24px'
                }}>
                  <div style={{ width: isTop ? '64px' : '48px', height: isTop ? '64px' : '48px', border: 'var(--line-thickness) solid var(--border-color)', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    <Avatar 
                      size={isTop ? 64 : 48} 
                      name={player.name} 
                      variant="beam" 
                      colors={[['#E03C31', '#005BBB', '#FFD100'][(player.name || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 3]]} 
                    />
                  </div>
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: isTop ? '2.5rem' : '1.5rem', 
                    fontWeight: '600', 
                    textTransform: 'capitalize'
                  }}>
                    {player.name}
                  </h2>
                </div>

                {/* Score */}
                <div style={{ 
                  width: '200px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  borderLeft: isTop ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-color)',
                  background: isTop ? 'rgba(255, 255, 255, 0.05)' : '#FAFAFA'
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                      {player.score.toFixed(1)}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: '500', color: isTop ? 'var(--text-muted)' : 'var(--text-muted)' }}>
                      AVG
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="linear-accent-bar" style={{ marginTop: '64px', height: '4px' }}>
          <div className="bar-red"></div>
          <div className="bar-yellow"></div>
          <div className="bar-blue"></div>
        </div>

      </div>
    </div>
  );
}
