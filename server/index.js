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

// Array of words to choose from
const words = ['house', 'tree', 'dog', 'car', 'apple', 'sun', 'boat'];

app.use(cors());
app.use(express.json());

app.post('/create-game', (req, res) => {
  const gameId = Math.random().toString(36).substring(2, 10);
  games[gameId] = { players: [], gameStatus: 'waiting', drawer: null, drawingPrompt: null };
  res.json({ gameId });
});

app.post('/join-game', (req, res) => {
  const { gameId, playerName } = req.body;
  if (games[gameId]) {
    games[gameId].players.push(playerName);
    res.json({ success: true, gameId });
  } else {
    res.json({ success: false, message: 'Invalid Game ID' });
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinGame', ({ gameId, playerName }) => {
    socket.join(gameId);
    if (games[gameId]) {
      games[gameId].players.push(playerName);
      io.to(gameId).emit('gameUpdate', games[gameId]);
    }
  });

  socket.on('startGame', (gameId) => {
    if (games[gameId]) {
      games[gameId].gameStatus = 'inProgress';
      games[gameId].drawer = games[gameId].players[0]; // Set the first player as the drawer

      // Select a random word from the array
      const randomWord = words[Math.floor(Math.random() * words.length)];
      games[gameId].drawingPrompt = randomWord;

      io.to(gameId).emit('gameUpdate', games[gameId]);
    } else {
      socket.emit('error', { message: 'Game not found' });
    }
  });

  socket.on('draw', (data) => {
    const { gameId, offsetX, offsetY } = data;
    socket.to(gameId).emit('drawingData', { offsetX, offsetY });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
