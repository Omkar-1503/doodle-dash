import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';  // Assuming you have some CSS for styling

const Home = () => {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState(''); // Add input for player name
  const navigate = useNavigate();

  const createGame = async () => {
    const response = await fetch('http://localhost:5000/create-game', { method: 'POST' });
    const data = await response.json();
    navigate(`/game/${data.gameId}`, { state: { playerName } }); // Pass playerName to Game component
  };

  const joinGame = () => {
    navigate(`/game/${gameId}`, { state: { playerName } }); // Pass playerName to Game component
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to Doodle Dash</h1>
      <div className="home-button-container">
        <input
          className="home-input-field"
          type="text"
          placeholder="Enter Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}  // Update player name
        />
        <button className="home-btn" onClick={createGame} disabled={!playerName}>
          Create Game
        </button>
        <br />
        <input
          className="home-input-field"
          type="text"
          placeholder="Enter Game ID"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
        />
        <button className="home-btn home-join-btn" onClick={joinGame} disabled={!playerName}>
          Join Game
        </button>
      </div>
    </div>
  );
};

export default Home;
