const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));

const { initGame, gameLoop, getUpdatedVel } = require("./game");
const { FRAME_RATE } = require("./constants");
const { makeid } = require("./utils");
const { clearInterval } = require("timers");
const { emit } = require("cluster");

const state = {};
const clientRooms = {}; //will allow us to lookup room name of a particular client id
//socket.io gives an id on the client object (client.id)

io.on("connection", (client) => {
  //const state= createGameState(); (as now we have created  a global state)

  client.on("keydown", handleKeyDown);
  client.on("newGame", handleNewGame);
  client.on("joinGame", handleJoinGame);

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms.get(roomName);

    let numClients = 0;
    if (room) {
      //if room exists
      numClients = room.size; //in Socket.IO v4+, use .size instead of counting sockets
    }
    if (numClients === 0) {
      client.emit("unknownCode");
      return;
    } else if (numClients > 1) {
      client.emit("tooManyPlayers");
      return;
    }

    clientRooms[client.id] = roomName;
    client.join(roomName);
    client.number = 2;
    client.emit("init", 2);

    startGameInterval(roomName);
  }

  function handleNewGame() {
    //we need to create a new socket room
    let roomName = makeid(5); //length of id we'll generate
    clientRooms[client.id] = roomName;
    client.emit("gameCode", roomName);

    state[roomName] = initGame();

    client.join(roomName);
    client.number = 1;
    client.emit("init", 1);
  }

  function handleKeyDown(keyCode) {
    const roomName = clientRooms[client.id];

    if (!roomName) return;
    //defining this inside this function as we want access to the client
    //if we had defined it elsewhere, we wont have access to it, tho there are ways like where we can use bind
    //or sm kinda curried function

    //this keycode is gonna come out as a string, just like all socket.io info goes back & forth
    //(we were JSON-parsing the objects coming back up until here)
    //but now we have an int coming as a string, so we wanna parse the int

    try {
      keyCode = parseInt(keyCode);
    } catch (err) {
      console.error(err);
      return;
    }

    const vel = getUpdatedVel(keyCode);
    if (vel) {
      state[roomName].players[client.number - 1].vel = vel;
      //state.player.vel=vel;
    }
  }

  //startGameInterval(client, state);  becuase this would mean game interval starts immediately as soon as any player connects to the server
});

function startGameInterval(roomName) {
  const intervalID = setInterval(() => {
    //triggering game mechanics for each loop here
    const winner = gameLoop(state[roomName]);

    //gameloop accepts the state of world in that instance
    //it will move us forward 1 step in game world,/which will give us the state of next frame,
    //and will return a value based on the game is over or not
    //if 0-> game is continuing, 1->player lost(int single player version)
    //in multiplayer ver, 0->continue, 1->player1 wins, 2->2 wins

    if (!winner) {
      emitGameState(roomName, state[roomName]);
      //client.emit('gameState', JSON.stringify(state));
    } else {
      emitGameOver(roomName, winner);
      //client.emit('gameOver');
      state[roomName] = null; //reset the state for that room
      clearInterval(intervalID);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(roomName, state) {
  // Send this event to everyone in the room.
  io.sockets.in(roomName).emit("gameState", JSON.stringify(state)); //emit to all clients in roomName
}

function emitGameOver(roomName, winner) {
  io.sockets.in(roomName).emit("gameOver", JSON.stringify({ winner }));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
