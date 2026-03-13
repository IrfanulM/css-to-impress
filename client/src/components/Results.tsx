import { ArrowRight } from 'lucide-react';

export function Results({ room }: { room: any }) {
  const sortedPlayers = room.players;

  const playAgain = () => {
    window.location.href = '/';
  };

  return (
    <div className="screen-center overflow-y-auto" style={{ background: 'var(--bg-main)' }}>
      <div className="container animate-fade-in" style={{ maxWidth: '900px', padding: '64px 0' }}>
        
        <div style={{ marginBottom: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: 'var(--line-thickness) solid var(--border-color)', paddingBottom: '24px' }}>
          <div>
            <h1 className="title-linear">Final Results</h1>
            <p className="subtitle" style={{ margin: '8px 0 0 0' }}>Room {room.id} Rankings</p>
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
                  borderTop: index === 0 ? 'var(--line-thickness) solid var(--border-color)' : 'none'
                }}
              >
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

                {/* Name */}
                <div style={{ 
                  flex: 1, 
                  padding: '32px', 
                  display: 'flex', 
                  alignItems: 'center',
                }}>
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: '2rem', 
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
