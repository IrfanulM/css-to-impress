import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { SocketProvider, useSocket } from './context/SocketContext';
import { useEffect, useRef, useState } from 'react';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { TemplateSelection } from './components/TemplateSelection';
import { Voting } from './components/Voting';
import { Results } from './components/Results';
import { GeometricBackground } from './components/GeometricBackground';

function GameController() {
  const { roomId } = useParams();
  const { socket, isConnected } = useSocket();
  const [room, setRoom] = useState<any>(null);
  const [hostReassignToast, setHostReassignToast] = useState<string | null>(null);
  const [nameTakenToast, setNameTakenToast] = useState(false);
  const [disconnectedInfo, setDisconnectedInfo] = useState<{ playerName: string; expiresAt: number } | null>(null);
  const [disconnectTimeLeft, setDisconnectTimeLeft] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRoomUpdated = (updatedRoom: any) => {
      console.log('Room updated:', updatedRoom);
      setRoom(updatedRoom);
      if (socket && typeof updatedRoom.id === 'string' && socket.id) {
        try {
          localStorage.setItem('cti_lastRoomId', updatedRoom.id);
          localStorage.setItem('cti_lastPlayerId', socket.id);
        } catch {
          // localStorage may be unavailable; ignore
        }
      }
      if (updatedRoom.id && updatedRoom.id !== roomId) {
        navigate(`/room/${updatedRoom.id}`);
      }
    };

    const handleHostReassigned = ({ newHostId, newHostName }: { newHostId: string; newHostName: string }) => {
      const message = socket.id === newHostId ? 'You are now the host' : `${newHostName} has now been made as host`;
      setHostReassignToast(message);
      setTimeout(() => setHostReassignToast(null), 3000);
    };

    const handlePlayerTemporarilyDisconnected = ({ playerName, expiresAt }: { playerName: string; expiresAt: number }) => {
      setDisconnectedInfo({ playerName, expiresAt });
      setDisconnectTimeLeft(Math.max(0, expiresAt - Date.now()));
    };

    const handlePlayerReconnected = () => {
      setDisconnectedInfo(null);
      setDisconnectTimeLeft(0);
    };

    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('errorMsg', (msg: string) => {
      if (msg.includes('already in this room')) {
        setNameTakenToast(true);
        setTimeout(() => setNameTakenToast(false), 3000);
      } else {
        alert(msg);
      }
    });
    socket.on('hostReassigned', handleHostReassigned);
    socket.on('playerTemporarilyDisconnected', handlePlayerTemporarilyDisconnected);
    socket.on('playerReconnected', handlePlayerReconnected);

    // Auto-navigate to home if lobby destroyed while inside
    socket.on('disconnect', () => {
        navigate('/');
        setRoom(null);
    });

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('errorMsg');
      socket.off('hostReassigned', handleHostReassigned);
      socket.off('playerTemporarilyDisconnected', handlePlayerTemporarilyDisconnected);
      socket.off('playerReconnected', handlePlayerReconnected);
      socket.off('disconnect');
    };
  }, [socket, isConnected, navigate, roomId]);

  // If we navigate to home, clear any existing room state
  useEffect(() => {
    if (!roomId && room) {
      setRoom(null);
    }
  }, [roomId, room]);

  // Drive countdown for the disconnect overlay
  useEffect(() => {
    if (!disconnectedInfo) return;

    const update = () => {
      setDisconnectTimeLeft(Math.max(0, disconnectedInfo.expiresAt - Date.now()));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [disconnectedInfo]);

  // Tab/refresh close: show "Are you sure?" and if they leave, remove immediately so the 60s timer never starts
  const isActiveGame = room?.state === 'PLAYING' || room?.state === 'VOTING';
  const socketRef = useRef(socket);
  socketRef.current = socket;
  useEffect(() => {
    if (!isActiveGame) return;

    const apiBase = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');
    const leaveUrl = `${apiBase.replace(/\/$/, '')}/api/leave-room`;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    const handleUnload = () => {
      try {
        socketRef.current?.emit('leaveRoom');
        const playerId = localStorage.getItem('cti_lastPlayerId');
        if (playerId) {
          const payload = JSON.stringify({ socketId: playerId });
          navigator.sendBeacon(leaveUrl, new Blob([payload], { type: 'application/json' }));
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [isActiveGame]);

  let content: React.ReactNode;
  if (!room) {
    content = roomId ? <Lobby defaultRoomId={roomId} /> : <Lobby />;
  } else {
    switch (room.state) {
      case 'LOBBY':
        content = <Lobby room={room} />;
        break;
      case 'TEMPLATE_VOTING':
        content = <TemplateSelection room={room} />;
        break;
      case 'PLAYING':
        content = <GameRoom room={room} />;
        break;
      case 'VOTING':
        content = <Voting room={room} />;
        break;
      case 'RESULTS':
        content = <Results room={room} />;
        break;
      default:
        content = <div>Unknown state</div>;
    }
  }

  return (
    <>
      {content}
      {room && disconnectedInfo && (room.state === 'PLAYING' || room.state === 'VOTING') && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 950,
          }}
        >
          <div
            style={{
              background: '#000',
              color: '#fff',
              padding: '32px 40px',
              borderRadius: '16px',
              textAlign: 'center',
              maxWidth: '480px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            }}
          >
            <h2 className="title-small" style={{ marginBottom: '12px', fontSize: '1.6rem' }}>
              Waiting for {disconnectedInfo.playerName} to reconnect
            </h2>
            <p style={{ marginBottom: '24px', fontSize: '0.95rem', opacity: 0.85 }}>
              The game is paused. If they don't return in{' '}
              {Math.max(0, Math.ceil(disconnectTimeLeft / 1000))} seconds,
              {room.players.length === 2
                ? ' the remaining player will win by forfeit.'
                : ' the game will continue without them.'}
            </p>
            <div
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                letterSpacing: '2px',
              }}
            >
              {String(Math.floor(disconnectTimeLeft / 1000)).padStart(2, '0')}
            </div>
          </div>
        </div>
      )}
      {hostReassignToast && (
        <div
          className="title-small"
          style={{
            position: 'fixed',
            top: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '16px 28px',
            background: '#000',
            color: '#fff',
            border: 'none',
            boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
            borderRadius: '999px',
            fontSize: '1.2rem',
            zIndex: 1000,
          }}
        >
          {hostReassignToast}
        </div>
      )}
      {nameTakenToast && (
        <div
          className="title-small"
          style={{
            position: 'fixed',
            top: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '16px 28px',
            background: '#000',
            color: '#fff',
            border: 'none',
            boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
            borderRadius: '999px',
            fontSize: '1.2rem',
            zIndex: 1000,
          }}
        >
          Name already taken
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <SocketProvider>
      <GeometricBackground />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GameController />} />
          <Route path="/room/:roomId" element={<GameController />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
