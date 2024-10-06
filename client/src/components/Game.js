import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const Game = () => {
  const { gameId } = useParams();
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [drawingPrompt, setDrawingPrompt] = useState(null);
  const [playerName, setPlayerName] = useState('Player 1'); // Set player name here
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  useEffect(() => {
    // Join the game room
    socket.emit('joinGame', { gameId, playerName });

    // Listen for game updates
    socket.on('gameUpdate', (game) => {
      console.log('Received game update:', game);
      setPlayers(game.players);
      setGameStatus(game.gameStatus);
      setDrawingPrompt(game.drawingPrompt);
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
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    // Send drawing data to the server
    socket.emit('draw', { gameId, offsetX, offsetY });
  };

  const stopDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const drawOnCanvas = (data) => {
    const { offsetX, offsetY } = data;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const handleStartGame = () => {
    console.log('Starting game with gameId:', gameId);
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
      <button onClick={handleStartGame}>Start Game</button>

      <div>
        <h3>Game Status: {gameStatus}</h3>
        {drawingPrompt && <p>Drawing Prompt: {drawingPrompt}</p>} {/* Display the drawing word */}
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
