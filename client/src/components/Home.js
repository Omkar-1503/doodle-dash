import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [gameId, setGameId] = useState('');
  const navigate = useNavigate();

  const createGame = async () => {
    const response = await fetch('http://localhost:5000/create-game', { method: 'POST' });
    const data = await response.json();
    navigate(`/game/${data.gameId}`);
  };

  const joinGame = () => {
    navigate(`/game/${gameId}`);
  };

  return (
    <div>
      <h1>Welcome to Doodle Dash</h1>
      <button onClick={createGame}>Create Game</button>
      <br />
      <input
        type="text"
        placeholder="Enter Game ID"
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
      />
      <button onClick={joinGame}>Join Game</button>
    </div>
  );
};

export default Home;
