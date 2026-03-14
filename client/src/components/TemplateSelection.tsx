import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Timer, CheckCircle2 } from 'lucide-react';

export function TemplateSelection({ room }: { room: any }) {
  const { socket } = useSocket();
  const [timeLeft, setTimeLeft] = useState(0);
  const startSoundPlaying = useRef(false);

  useEffect(() => {
    if (!room.endTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, room.endTime - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        startSoundPlaying.current = false;
      } else if (remaining <= 4000 && !startSoundPlaying.current) {
        const audio = new Audio("/sounds/game-start1.mp3");
        audio.volume = 0.5;
        audio.play();
        startSoundPlaying.current = true;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room.endTime]);

  const handleVote = (index: number) => {
    if (socket) {
      socket.emit('submitTemplateVote', { roomId: room.id, templateIndex: index });
      const audio = new Audio("/sounds/vote2.mp3");
      audio.volume = 0.5;
      audio.play();
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    return totalSeconds.toString();
  };

  return (
    <div className="screen-center" style={{ background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: 'var(--line-thickness) solid var(--border-color)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h2 style={{ margin: 0, padding: 0, fontSize: '1.5rem' }} className="title-small">Code to Impress</h2>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Room {room.id}</span>
        </div>
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '1.25rem', 
            fontWeight: '600',
            color: timeLeft <= 10000 ? 'var(--primary)' : 'var(--text-main)', 
          }}>
            <Timer size={20} />
            0:{formatTime(timeLeft).padStart(2, '0')}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', boxSizing: 'border-box' }}>
        <h1 className="title-linear" style={{ marginBottom: '8px' }}>Vote for an Interface</h1>
        <p className="subtitle" style={{ marginBottom: '64px', textAlign: 'center' }}>Choose the prompt you want to build. Most votes wins.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', width: '100%', maxWidth: '900px' }}>
          {room.templateOptions?.map((opt: any) => {
            const isSelected = opt.votes.includes(socket?.id);
            
            return (
              <button
                key={opt.index}
                className="no-swoop"
                onClick={() => handleVote(opt.index)}
                style={{
                  background: isSelected ? 'rgba(0,0,0,0.03)' : 'white',
                  border: isSelected ? '4px solid var(--text-main)' : '4px solid var(--border-color)',
                  padding: '32px',
                  borderRadius: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: isSelected ? '8px 8px 0px var(--text-main)' : '4px 4px 0px var(--border-color)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isSelected ? 'translate(-4px, -4px)' : 'none'
                }}
                onMouseEnter={(e) => {
                    if(!isSelected) {
                        e.currentTarget.style.transform = 'translate(-2px, -2px)';
                        e.currentTarget.style.boxShadow = '6px 6px 0px var(--border-color)';
                    }
                }}
                onMouseLeave={(e) => {
                    if(!isSelected) {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '4px 4px 0px var(--border-color)';
                    }
                }}
              >
                {isSelected && (
                    <div style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-main)' }}>
                        <CheckCircle2 size={24} fill="var(--text-main)" color="white" />
                    </div>
                )}
                
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{opt.name}</h3>
                
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: opt.voteCount > 0 ? 'var(--secondary)' : '#f0f0f0', 
                    padding: '8px 16px', 
                    borderRadius: '20px', 
                    width: 'fit-content',
                    color: opt.voteCount > 0 ? 'white' : 'var(--text-muted)'
                }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{opt.voteCount}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {opt.voteCount === 1 ? 'Vote' : 'Votes'}
                    </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="linear-accent-bar" style={{ height: '4px' }}>
        <div className="bar-red"></div>
        <div className="bar-blue"></div>
        <div className="bar-yellow"></div>
      </div>
    </div>
  );
}
