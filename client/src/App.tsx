import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { SocketProvider, useSocket } from './context/SocketContext';
import { useEffect, useState } from 'react';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { TemplateSelection } from './components/TemplateSelection';
import { Voting } from './components/Voting';
import { Results } from './components/Results';

function GameController() {
  const { roomId } = useParams();
  const { socket, isConnected } = useSocket();
  const [room, setRoom] = useState<any>(null);
  const [hostReassignToast, setHostReassignToast] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRoomUpdated = (updatedRoom: any) => {
      console.log('Room updated:', updatedRoom);
      setRoom(updatedRoom);
      if (updatedRoom.id && updatedRoom.id !== roomId) {
        navigate(`/room/${updatedRoom.id}`);
      }
    };

    const handleHostReassigned = ({ newHostId, newHostName }: { newHostId: string; newHostName: string }) => {
      const message = socket.id === newHostId ? 'You are now the host' : `${newHostName} has now been made as host`;
      setHostReassignToast(message);
      setTimeout(() => setHostReassignToast(null), 3000);
    };

    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('errorMsg', (msg: string) => alert(msg));
    socket.on('hostReassigned', handleHostReassigned);

    // Auto-navigate to home if lobby destroyed while inside
    socket.on('disconnect', () => {
        navigate('/');
        setRoom(null);
    });

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('errorMsg');
      socket.off('hostReassigned', handleHostReassigned);
      socket.off('disconnect');
    };
  }, [socket, isConnected, navigate, roomId]);

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
    </>
  );
}

function App() {
  return (
    <SocketProvider>
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
