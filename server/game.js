const { GRID_SIZE } = require("./constants");

module.exports = {
  //createGameState, (we'll instead have an initGame that creates a new game and generates random food on start)
  initGame,
  gameLoop,
  getUpdatedVel,
};

function initGame() {
  const state = createGameState();
  randomFood(state);
  return state;
}

function createGameState() {
  return {
    players: [
      {
        pos: {
          x: 3,
          y: 10,
        },
        vel: {
          x: 1,
          y: 0,
        },
        snake: [
          { x: 1, y: 10 },
          { x: 2, y: 10 },
          { x: 3, y: 10 },
        ],
      },
      {
        pos: {
          x: 18,
          y: 10,
        },
        vel: {
          x: 0,
          y: 0,
        },
        snake: [
          { x: 20, y: 10 },
          { x: 19, y: 10 },
          { x: 18, y: 10 },
        ],
      },
    ],
    food: {},
    gridsize: GRID_SIZE,
  };
}

function gameLoop(state) {
  if (!state) return;

  const player1 = state.players[0];
  const player2 = state.players[1];

  player1.pos.x += player1.vel.x;
  player1.pos.y += player1.vel.y;

  player2.pos.x += player2.vel.x;
  player2.pos.y += player2.vel.y;

  if (
    player1.pos.x < 0 ||
    player1.pos.x > GRID_SIZE ||
    player1.pos.y < 0 ||
    player1.pos.y > GRID_SIZE
  ) {
    return 2;
    //if player1 goes off teh edges of canvas, player2 wins
  }

  if (
    player2.pos.x < 0 ||
    player2.pos.x > GRID_SIZE ||
    player2.pos.y < 0 ||
    player2.pos.y > GRID_SIZE
  ) {
    return 1;
  }

  if (state.food.x == player1.pos.x && state.food.y == player1.pos.y) {
    //eaten food
    player1.snake.push({ ...player1.pos }); //making snake bigger

    //now we want to be ahead of where we were before eating food
    player1.pos.x += player1.vel.x;
    player1.pos.y += player1.vel.y;
    randomFood(state); //now that we have eaten the food, we need to create a new food
  }

  if (state.food.x == player2.pos.x && state.food.y == player2.pos.y) {
    player2.snake.push({ ...player2.pos });
    player2.pos.x += player2.vel.x;
    player2.pos.y += player2.vel.y;
    randomFood(state);
  }
  if (player1.vel.x || player1.vel.y) {
    //to ensure snake is actually moving before we start moving the body of snake

    //checking if the snake has bumped into itself
    for (let cell of player1.snake) {
      if (cell.x === player1.pos.x && cell.y == player1.pos.y) {
        //implies one of the cell mking up the body overlaps with current head of snake
        return 2;
      }
    }
    //move the snake fwd
    //can do either by looping through the snake's body or just push a new val in array and
    //shift the last one off the end
    player1.snake.push({ ...player1.pos });
    player1.snake.shift();
  }
  if (player2.vel.x || player2.vel.y) {
    for (let cell of player2.snake) {
      if (cell.x === player2.pos.x && cell.y == player2.pos.y) {
        return 1;
      }
    }
    player2.snake.push({ ...player2.pos });
    player2.snake.shift();
  }

  return 0;
}

function randomFood(state) {
  food = {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };

  for (let cell of state.players[0].snake) {
    if (cell.x == food.x && cell.y == food.y) {
      //new food generated is on top of snake
      return randomFood(state);
    }
  }
  for (let cell of state.players[1].snake) {
    if (cell.x == food.x && cell.y == food.y) {
      return randomFood(state);
    }
  }
  state.food = food;
}

function getUpdatedVel(keyCode) {
  switch (keyCode) {
    case 37: {
      //left
      return { x: -1, y: 0 };
    }
    case 38: {
      return { x: 0, y: -1 };
    }
    case 39: {
      return { x: 1, y: 0 };
    }
    case 40: {
      return { x: 0, y: 1 };
    }
  }
}
