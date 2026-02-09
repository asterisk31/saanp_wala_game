const BG_COLOUR = "#ebc9d2";
const SNAKE_COLOUR = "#450505";
const FOOD_COLOUR = "#e66916";

// Use current origin for socket connection (works both locally and in production)
const socket = io();

socket.on("init", handleInit);
socket.on("gameState", handleGameState);
socket.on("gameOver", handleGameOver);
socket.on("gameCode", handleGameCode);
socket.on("unknownCode", handleUnknownCode);
socket.on("tooManyPlayers", handleTooManyPlayers);

const gameScreen = document.getElementById("gameScreen");
const initialScreen = document.getElementById("initialScreen");
const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const gameCodeInput = document.getElementById("gameCodeInput");
const gameCodeDisplay = document.getElementById("gameCodeDisplay");

newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);

function newGame() {
  socket.emit("newGame");
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit("joinGame", code);
  //code is alr a string no need to stringify
}

let canvas, context, playerNumber;
let gameActive = false;

function init() {
  initialScreen.style.display = "none";
  gameScreen.style.display = "block";

  canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");

  canvas.width = canvas.height = 600;
  context.fillStyle = BG_COLOUR;
  context.fillRect(0, 0, canvas.width, canvas.height);

  document.addEventListener("keydown", keydown);
  gameActive = true;
}

function keydown(e) {
  socket.emit("keydown", e.keyCode);
}

//init(); ->now we want to remove that as we want to init only when we are joining a game or creating a new one

function paintGame(state) {
  context.fillStyle = BG_COLOUR;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const food = state.food;
  const gridsize = state.gridsize;
  const size = canvas.width / gridsize; //reconciling coor system between pixel space and game space

  context.fillStyle = FOOD_COLOUR;
  context.fillRect(food.x * size, food.y * size, size, size);

  paintPlayer(state.players[0], size, SNAKE_COLOUR);
  paintPlayer(state.players[1], size, "rgba(104, 0, 73, 0.33)");
}

function paintPlayer(playerState, size, color) {
  const snake = playerState.snake;
  context.fillStyle = color;
  for (let cell of snake) {
    context.fillRect(cell.x * size, cell.y * size, size, size);
  }
}

function handleInit(number) {
  playerNumber = number;
  init();
}

function handleGameState(gameState) {
  if (!gameActive) return;
  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
  if (!gameActive) return;
  data = JSON.parse(data);

  gameActive = false;

  if (data.winner === playerNumber) alert("JEET GAYE!!");
  else alert("gotcha :(");
  //alert('You Lose-gotcha!!!')
}

function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode;
}

function handleUnknownCode() {
  reset();
  alert("unknown game code");
}

function handleTooManyPlayers() {
    reset();
  alert("this game is alr full");
}

function reset() {
  playerNumber = null;
  gameCodeInput.value = "";
  //gameCodeDisplay.innerText = "";
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
}
