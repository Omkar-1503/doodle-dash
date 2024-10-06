const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = 5000;
let games = {}; // Store all game sessions

app.use(cors());
app.use(express.json());

// Endpoint to create a new game
app.post('/create-game', (req, res) => {
  const gameId = Math.random().toString(36).substring(2, 10);
  games[gameId] = { players: [], gameStatus: 'waiting', drawer: null, currentDrawerIndex: 0 };
  res.json({ gameId });
});

// Endpoint to join an existing game
app.post('/join-game', (req, res) => {
  const { gameId, playerName } = req.body;
  if (games[gameId]) {
    games[gameId].players.push(playerName);
    res.json({ success: true, gameId });
  } else {
    res.json({ success: false, message: 'Invalid Game ID' });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When a user joins a game
  socket.on('joinGame', ({ gameId, playerName }) => {
    socket.join(gameId);
    if (games[gameId]) {
      games[gameId].players.push({ name: playerName, id: socket.id }); // Store both name and socket ID for tracking
      io.to(gameId).emit('gameUpdate', games[gameId]);
    }
  });

  // When the game starts
  socket.on('startGame', (gameId) => {
    if (games[gameId]) {
      games[gameId].gameStatus = 'inProgress';
      games[gameId].drawer = games[gameId].players[games[gameId].currentDrawerIndex].name; // Set the first player as the drawer
      io.to(gameId).emit('gameUpdate', games[gameId]);
    } else {
      socket.emit('error', { message: 'Game not found' });
    }
  });

  // Handle drawing event
  socket.on('draw', (data) => {
    const { gameId, offsetX, offsetY } = data;

    // Ensure only the drawer can send drawing data
    const game = games[gameId];
    const drawerPlayer = game.players[game.currentDrawerIndex];
    if (socket.id === drawerPlayer.id) {
      socket.to(gameId).emit('drawingData', { offsetX, offsetY });
    } else {
      socket.emit('error', { message: 'You are not the drawer!' });
    }
  });

  // Handle player disconnects
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);

    // Remove player from any game they were part of
    for (const gameId in games) {
      const game = games[gameId];
      const playerIndex = game.players.findIndex((player) => player.id === socket.id);

      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1); // Remove the player
        // If the drawer disconnected, assign a new drawer
        if (game.players.length > 0 && playerIndex === game.currentDrawerIndex) {
          game.currentDrawerIndex = (game.currentDrawerIndex + 1) % game.players.length;
          game.drawer = game.players[game.currentDrawerIndex].name;
        }

        // Notify other players in the game
        io.to(gameId).emit('gameUpdate', game);
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
