import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { SocketProvider, useSocket } from './context/SocketContext';
import { useEffect, useState } from 'react';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { Voting } from './components/Voting';
import { Results } from './components/Results';

function GameController() {
  const { roomId } = useParams();
  const { socket, isConnected } = useSocket();
  const [room, setRoom] = useState<any>(null);
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

    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('errorMsg', (msg: string) => alert(msg));
    
    // Auto-navigate to home if lobby destroyed while inside
    socket.on('disconnect', () => {
        navigate('/');
        setRoom(null);
    });

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('errorMsg');
      socket.off('disconnect');
    };
  }, [socket, isConnected, navigate, roomId]);

  if (!room) {
    if (roomId) {
        // Assume trying to join via URL
        return <Lobby defaultRoomId={roomId} />;
    }
    // No room data yet, show Lobby
    return <Lobby />;
  }

  // Handle routing based on game state
  switch (room.state) {
    case 'LOBBY':
      return <Lobby room={room} />;
    case 'PLAYING':
      return <GameRoom room={room} />;
    case 'VOTING':
      return <Voting room={room} />;
    case 'RESULTS':
      return <Results room={room} />;
    default:
      return <div>Unknown state</div>;
  }
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
