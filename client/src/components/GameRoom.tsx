import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Timer, Flag } from 'lucide-react';
import Editor from '@monaco-editor/react';

export function GameRoom({ room }: { room: any }) {
  const { socket } = useSocket();
  const [css, setCss] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [activeTab, setActiveTab] = useState<'css' | 'html'>('css');
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
      if (remaining === 0) {
        clearInterval(interval);
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
                body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; background: #FFFFFF; color: #000000; }
                * { box-sizing: border-box; }
                ${css}
              </style>
            </head>
            <body>
              ${htmlTemplate || '<div style="color: #888; font-family: sans-serif;">Wait for it...</div>'}
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [css, htmlTemplate]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: 'var(--bg-main)', borderBottom: 'var(--line-thickness) solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h2 style={{ margin: 0, padding: 0, fontSize: '1.5rem' }} className="title-small">Code to Impress</h2>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Room {room.id}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {room.host === socket?.id && (
              <button 
                onClick={() => socket?.emit('forceEndGame', { roomId: room.id })} 
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '0.8rem', 
                  border: '1px solid var(--primary)', 
                  color: 'var(--primary)', 
                  background: 'transparent', 
                  marginRight: '24px' 
                }}
              >
                <Flag size={14} /> End Early
              </button>
          )}
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
      </header>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Editor Pane */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: 'var(--line-thickness) solid var(--border-color)', background: '#FAFAFA' }}>
          
          {/* Editor Header / Tabs */}
          <div style={{ display: 'flex', borderBottom: 'var(--line-thickness) solid var(--border-color)', background: 'white' }}>
            <button 
              onClick={() => setActiveTab('css')}
              style={{ flex: 1, padding: '12px 16px', border: 'none', background: 'transparent', color: activeTab === 'css' ? 'var(--text-main)' : 'var(--text-muted)', borderRadius: 0, fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', fontWeight: '600', letterSpacing: '1px', borderBottom: activeTab === 'css' ? '2px solid var(--secondary)' : '2px solid transparent', textAlign: 'left', justifyContent: 'flex-start' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: 'var(--secondary)', borderRadius: '50%', opacity: activeTab === 'css' ? 1 : 0 }}></div>
                styles.css
              </div>
            </button>
            <div style={{ width: 'var(--line-thickness)', background: 'var(--border-color)' }}></div>
            <button 
              onClick={() => setActiveTab('html')}
              style={{ flex: 1, padding: '12px 16px', border: 'none', background: 'transparent', color: activeTab === 'html' ? 'var(--text-main)' : 'var(--text-muted)', borderRadius: 0, fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', fontWeight: '600', letterSpacing: '1px', borderBottom: activeTab === 'html' ? '2px solid var(--primary)' : '2px solid transparent', textAlign: 'left', justifyContent: 'flex-start' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', opacity: activeTab === 'html' ? 1 : 0 }}></div>
                index.html
              </div>
            </button>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
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

        {/* Live Preview Pane */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
          <div style={{ padding: '12px 24px', background: 'white', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: 'var(--line-thickness) solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }}></div>
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
    </div>
  );
}
