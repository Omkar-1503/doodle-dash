import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const Game = () => {
  const { gameId } = useParams();
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [drawer, setDrawer] = useState(null);
  const [playerName] = useState('Player ' + (Math.random().toString(36).substring(7))); // Unique player name
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // Join game room
    socket.emit('joinGame', { gameId, playerName });

    // Listen for game updates
    socket.on('gameUpdate', (game) => {
      setPlayers(game.players);
      setGameStatus(game.gameStatus);
      setDrawer(game.drawer); // Set current drawer
    });

    // Listen for drawing data from the server
    socket.on('drawingData', (data) => {
      drawOnCanvas(data);
    });

    // Setup canvas size
    const canvas = canvasRef.current;
    if (canvas) {
      const width = window.innerWidth * 0.9; // Large canvas size
      const height = window.innerHeight * 0.7;
      canvas.width = width; 
      canvas.height = height; 
      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.strokeStyle = 'black';
      context.lineWidth = 5;
      contextRef.current = context;
    }

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, [gameId, playerName]);

  const getRelativeCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;   // Relationship bitmap vs. element for X
    const scaleY = canvas.height / rect.height; // Relationship bitmap vs. element for Y
    return {
      offsetX: (event.clientX - rect.left) * scaleX,
      offsetY: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (event) => {
    const { offsetX, offsetY } = getRelativeCoordinates(event);
    if (playerName === drawer && contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    }
  };

  const draw = (event) => {
    if (!isDrawing || playerName !== drawer || !contextRef.current) return;
    const { offsetX, offsetY } = getRelativeCoordinates(event);
    console.log('Drawing at:', offsetX, offsetY); // Debug log
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    // Emit drawing data to the server
    socket.emit('drawingData', { gameId, offsetX, offsetY });
  };

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
      setIsDrawing(false);
    }
  };

  const drawOnCanvas = (data) => {
    if (contextRef.current) {
      const { offsetX, offsetY } = data;
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    }
  };

  const handleStartGame = () => {
    socket.emit('startGame', gameId);
  };

  return (
    <div>
      <h2>Game Lobby: {gameId}</h2>
      <h3>Players:</h3>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ul>
      {gameStatus === 'waiting' && <button onClick={handleStartGame}>Start Game</button>}
      {gameStatus === 'inProgress' && (
        <div>
          <p>Current drawer: {drawer}</p>
          <canvas
            ref={canvasRef}
            style={{ border: '1px solid black', width: '90%', height: '70%' }} // Large canvas style
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      )}
    </div>
  );
};

export default Game;
