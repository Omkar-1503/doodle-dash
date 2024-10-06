import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import './Game.css'; // Assuming you have a Game.css file for styling

const socket = io('http://localhost:5000');

const Game = () => {
  const { gameId } = useParams(); // Getting gameId from the URL params
  const location = useLocation(); // Get playerName passed from Home.js
  const playerName = location.state?.playerName || 'Player 1'; // Fallback to 'Player 1' if not provided

  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [drawingPrompt, setDrawingPrompt] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawer, setDrawer] = useState(null); // Track who is the drawer

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    // Join the game room
    socket.emit('joinGame', { gameId, playerName });

    // Listen for game updates
    socket.on('gameUpdate', (game) => {
      setPlayers(game.players);
      setGameStatus(game.gameStatus);
      setDrawingPrompt(game.drawingPrompt);
      setDrawer(game.drawer); // Set the drawer (player who is currently drawing)
    });

    // Listen for drawing data from the server
    socket.on('drawingData', (data) => {
      if (contextRef.current) {
        drawOnCanvas(data);
      }
    });

    // Setup the canvas
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.7;
    canvas.height = window.innerHeight * 0.7;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = 5;
    contextRef.current = context;

    // Cleanup on component unmount
    return () => socket.disconnect();
  }, [gameId, playerName]);

  const startDrawing = ({ nativeEvent }) => {
    if (playerName !== drawer) return; // Only the current drawer can draw

    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || playerName !== drawer) return; // Only allow the drawer to draw
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    // Send drawing data to the server
    socket.emit('draw', { gameId, offsetX, offsetY });
  };

  const stopDrawing = () => {
    if (playerName !== drawer) return; // Only the drawer can stop drawing
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const drawOnCanvas = (data) => {
    const { offsetX, offsetY } = data;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const handleStartGame = () => {
    socket.emit('startGame', gameId);
  };

  return (
    <div className="game-container">
      <h2>Game Lobby: {gameId}</h2>
      <h3>Players:</h3>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ul>
      <button onClick={handleStartGame}>Start Game</button>

      <div>
        <h3>Game Status: {gameStatus}</h3>
        {drawingPrompt && <p>Drawing Prompt: {drawingPrompt}</p>}
        {drawer && <p>Current Drawer: {drawer}</p>} {/* Display the current drawer's name */}
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        className="drawing-canvas"
      />
    </div>
  );
};

export default Game;
