import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Timer, Flag, LogOut } from 'lucide-react';
import Editor from '@monaco-editor/react';

export function GameRoom({ room }: { room: any }) {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [css, setCss] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [activeTab, setActiveTab] = useState<'css' | 'html'>('css');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const endCountdownPlaying = useRef(false);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('gameStarted', ({ html }) => {
      setHtmlTemplate(html);
    });

    return () => {
      socket.off('gameStarted');
    };
  }, [socket]);

  useEffect(() => {
    if (room.htmlTemplate) {
      setHtmlTemplate(room.htmlTemplate);
    }
  }, [room.htmlTemplate]);

  useEffect(() => {
    if (!room.endTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, room.endTime - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        const audio = new Audio("/sounds/whistle-blow.mp3");
        audio.volume = 0.8;
        audio.play();
        clearInterval(interval);
        endCountdownPlaying.current = false;
      } else if (remaining <= 17000 && !endCountdownPlaying.current) {
        const audio = new Audio("/sounds/game-countdown.mp3");
        audio.volume = 0.8;
        audio.play();
        endCountdownPlaying.current = true;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room.endTime]);

  // Debounce CSS submission
  useEffect(() => {
    const timer = setTimeout(() => {
      if (socket && room && css) {
        socket.emit('submitCss', { roomId: room.id, css });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [css, socket, room]);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { 
                  margin: 0; 
                  padding: 24px; 
                  font-family: system-ui, sans-serif; 
                  background: #FFFFFF; 
                  color: #000000; 
                  ${room.settings?.disableCopyPaste ? 'user-select: none; -webkit-user-select: none;' : ''}
                }
                * { box-sizing: border-box; }
                ${css}
              </style>
              <script>
                if (${!!room.settings?.disableCopyPaste}) {
                  ['copy', 'paste', 'cut'].forEach(event => {
                    document.addEventListener(event, (e) => {
                      e.preventDefault();
                      if (event !== 'cut') {
                        alert(event.charAt(0).toUpperCase() + event.slice(1) + 'ing is disabled by the host!');
                      }
                    });
                  });
                }
              </script>
            </head>
            <body>
              ${htmlTemplate || `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 80vh; gap: 24px; opacity: 0.3;">
                  <div style="width: 48px; height: 48px; background: #005BBB;"></div>
                  <div style="font-weight: 800; text-transform: uppercase; letter-spacing: 2px; font-size: 14px;">Waiting for Code...</div>
                </div>
              `}
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [css, htmlTemplate, room]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', borderBottom: 'var(--line-thickness) solid var(--border-color)' }}>
        <div className="linear-accent-bar" style={{ height: '4px' }}>
          <div className="bar-red"></div>
          <div className="bar-blue"></div>
          <div className="bar-yellow"></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h2 style={{ margin: 0, padding: 0, fontSize: '1.5rem' }} className="title-small">CSS to Impress</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Room {room.id}</span>
            <span style={{ width: '4px', height: '4px', background: 'var(--border-color)', borderRadius: '50%' }}></span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-main)' }}>{room.promptName}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {room.host === socket?.id && (
              <button 
                className="btn-danger-swoop"
                onClick={() => socket?.emit('forceEndGame', { roomId: room.id })} 
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '0.8rem', 
                  border: '1px solid var(--primary)', 
                  color: 'var(--primary)', 
                  background: 'transparent', 
                }}
              >
                <Flag size={14} /> End Early
              </button>
          )}
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
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: timeLeft <= 60000 ? 'var(--primary)' : 'var(--text-main)', 
          }}>
            <Timer size={20} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
    </header>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '32px', gap: '32px', background: 'transparent' }}>
        
        {/* Editor Pane */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', border: 'var(--line-thickness) solid var(--border-color)', boxShadow: '12px 12px 0px var(--border-color)', overflow: 'hidden' }}>
          
          {/* Editor Header / Tabs */}
          <div style={{ display: 'flex',  borderBottom: 'var(--line-thickness) solid var(--border-color)', background: '#EAEAEA', height: '56px' }}>
            <button 
              className="no-swoop"
              onClick={() => setActiveTab('css')}
              style={{ flex: 1, padding: '0 24px', border: 'none', height: '100%', background: activeTab === 'css' ? 'white' : 'transparent', color: activeTab === 'css' ? 'var(--text-main)' : 'var(--text-muted)', borderRadius: 0, fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', fontWeight: '800', letterSpacing: '1px', textAlign: 'left', justifyContent: 'flex-start', position: 'relative' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', background: 'var(--secondary)', borderRadius: '50%', opacity: activeTab === 'css' ? 1 : 0.4 }}></div>
                styles.css
              </div>
            </button>
            <div style={{ width: 'var(--line-thickness)', background: 'var(--border-color)' }}></div>
            <button 
              className="no-swoop"
              onClick={() => setActiveTab('html')}
              style={{ flex: 1, padding: '0 24px', border: 'none', height: '100%', background: activeTab === 'html' ? 'white' : 'transparent', color: activeTab === 'html' ? 'var(--text-main)' : 'var(--text-muted)', borderRadius: 0, fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', fontWeight: '800', letterSpacing: '1px', textAlign: 'left', justifyContent: 'flex-start', position: 'relative' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%', opacity: activeTab === 'html' ? 1 : 0.4 }}></div>
                index.html
              </div>
            </button>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <div 
              style={{ width: '100%', height: '100%' }}
              onCopyCapture={(e) => {
                if (room.settings?.disableCopyPaste) {
                  e.preventDefault();
                  e.stopPropagation();
                  alert('Copying is disabled by the host!');
                }
              }}
              onPasteCapture={(e) => {
                if (room.settings?.disableCopyPaste) {
                  e.preventDefault();
                  e.stopPropagation();
                  alert('Pasting is disabled by the host!');
                }
              }}
              onCutCapture={(e) => {
                if (room.settings?.disableCopyPaste) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              {activeTab === 'css' ? (
                <Editor
                key="css-editor"
                height="100%"
                language="css"
                theme="light"
                value={css}
                onChange={(value) => setCss(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  fontFamily: "'JetBrains Mono', monospace",
                  wordWrap: "on",
                  lineNumbers: "on",
                  padding: { top: 24, bottom: 24 },
                  scrollBeyondLastLine: false,
                }}
              />
            ) : (
              <Editor
                key="html-editor"
                height="100%"
                language="html"
                theme="light"
                value={htmlTemplate}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 15,
                  fontFamily: "'JetBrains Mono', monospace",
                  wordWrap: "on",
                  lineNumbers: "on",
                  padding: { top: 24, bottom: 24 },
                  scrollBeyondLastLine: false,
                }}
              />
            )}
            </div>
          </div>
        </div>

        {/* Live Preview Pane */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', border: 'var(--line-thickness) solid var(--border-color)', boxShadow: '12px 12px 0px var(--border-color)', overflow: 'hidden' }}>
          <div style={{ height: '56px', padding: '0 24px', background: 'var(--accent)', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: 'var(--line-thickness) solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', background: 'white', borderRadius: '50%', border: '2px solid var(--text-main)' }}></div>
            Live Preview
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <iframe
              ref={iframeRef}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Preview"
            />
          </div>
        </div>
      </div>
      <div className="linear-accent-bar" style={{ height: '4px' }}>
        <div className="bar-yellow"></div>
        <div className="bar-blue"></div>
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
