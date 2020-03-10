/*var myGamePiece;
var wall;
var myBackground;
var speedMultiplyer = 3;
var bullets = [];
var socket = io();
var players = {};
var obstacles = {};
var initPlayers = false;
var id; // our socket id
// offsets to figure out where to draw other players
var yOffset = 0;
var xOffset = 0;*/

var config = {
   type: Phaser.AUTO,
   width: 800,
   height: 600,
   physics: {
      default: 'arcade',
      arcade: {
         debug: false
      }
   },
   scene: {
      preload: preload,
      create: create,
      update:update
   }
};

var game = new Phaser.Game(config);
/*
socket.on('connect', function() {
   id = socket.id;
   startGameOnConnect();
})
*/
function preload()
{
   this.load.image('ground', 'assets/js/ground.jpg');
   this.load.image("wall", "assets/js/wall.png");
   this.load.image('player', 'assets/js/character.png');
}

function create ()
{
   const { width, height } = this.sys.game.config;

   // Creating a repeating background sprite
   const bg = this.add.tileSprite(0, 0, width, height, "ground");
   bg.setOrigin(0, 0);

   // Creating obstacles
   obstacles = this.physics.add.staticGroup();
   obstacles.create(600, 400, 'wall').setScale(0.25).refreshBody();

   // Creating a player
   player = this.physics.add.sprite(100,450,'player').setScale(0.25);
   player.setBounce(0.2);
   player.setCollideWorldBounds(true);

   // Creating a collider
   this.physics.add.collider(player, obstacles);
}

function update ()
{
   // controls
   cursors = this.input.keyboard.createCursorKeys();
   if (cursors.left.isDown)
   {
      player.setVelocityX(-160);
      // play animations here
   }
   else if (cursors.right.isDown)
   {
      player.setVelocityX(160);
   }
   else
   {
      player.setVelocityX(0);
   }
   if (cursors.up.isDown)
   {
      player.setVelocityY(-160);
   }
   else if (cursors.down.isDown)
   {
      player.setVelocityY(160);
   }
   else
   {
      player.setVelocityY(0);
   }
}
/*
//run once at the beginning of the game
function startGameOnConnect() {
   console.log("socketIO is working. Starting Game!");
   // creating a player game object
   var player = new component(60, 50, "./assets/js/Character.png", 400, 300, "image", id);
   // passing the player object to the server
   socket.emit("addPlayer", player);
   // request players list from the server
   socket.emit("getPlayers");

   // set list of players that the server has to the local list of players
   socket.on("initPlayers", function(p) {
      //iterate through each player in the server's list
      Object.keys(p).forEach((key, index) => {
         if (id != key) {
            console.log("key: " + key + " index: " + index);
            let pServ = p[key];

            //create a new component based on what we recieved from the server.
            locP = new component(pServ.width, pServ.height, pServ.color, pServ.x + xOffset, pServ.y + yOffset, pServ.type, pServ.id)

            //store that component in a local list of players
            players[key] = locP;
            //update will draw the component to the screen.
            locP.update();
         }

      });
   });

   //create a background
   myBackground = new component(900, 900, "./assets/js/ground.jpg", 0, 0, "image", id);
   socket.on("recieveWorld", function(p) {
      //  console.log(p);
      //empty our local array of players
      obstacles = {};
      //refill the array from the servers array
      Object.keys(p).forEach((key, index) => {
         let pServ = p[key];
         locO = new component(pServ.width, pServ.height, pServ.color, pServ.x + xOffset, pServ.y + yOffset, pServ.type, pServ.id);
         locO.worldPos.x = locO.x;
         locO.worldPos.y = locO.y;
         obstacles[pServ.id] = locO;
      })
   });
   //create an obstacle
   z = new component(30, 30, "red", 20, 20, "color", "lolol");
   wall = new component(30, 30, "blue", 300, 300, "color", id);
   wall.worldPos.x = 300;
   wall.worldPos.y = 300;

   socket.emit("updateLoc", id, localPos.x, localPos.y);
   myGameArea.start();

}
//used to track this clients player characters global position (not sure if needed,
//still thinking about how to handle movement accross server)
var localPos = new Vector(400, 300);

//this is the canvas essentially.
//we probably should make this larger and responsive
var myGameArea = {
   canvas: document.getElementById("game"),
   start: function() {
      this.canvas.width = 800;
      this.canvas.height = 600;
      this.context = this.canvas.getContext("2d");
      document.body.insertBefore(this.canvas, document.body.childNodes[0]);
      this.interval = setInterval(updateGameArea, 20);
      window.addEventListener('keydown', function(e) {
         myGameArea.keys = (myGameArea.keys || []);
         myGameArea.keys[e.keyCode] = (e.type == "keydown");
      })
      window.addEventListener('keyup', function(e) {
         myGameArea.keys[e.keyCode] = (e.type == "keydown");
      })
   },
   clear: function() {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
   }
}

function collisionDetection(playerX, playerY, sign, axis) {
   var isTrue = false;
   Object.keys(obstacles).forEach((key, index) => {
      if (playerX > obstacles[key].worldPos.x - (obstacles[key].width) && playerX < obstacles[key].worldPos.x + (obstacles[key].width / 2) &&
         playerY > obstacles[key].worldPos.y - (obstacles[key].height) && playerY < obstacles[key].worldPos.y + obstacles[key].height / 2) {
         console.log("Collided");
         console.log("playerX: " + playerX + ", playerY: " + playerY + ", objX: " + obstacles[key].worldPos.x +
            ", objY: " + obstacles[key].worldPos.y + ", objW: " + obstacles[key].width + ", objH: " + obstacles[key].height);
         z.x = obstacles[key].x;
         z.y = obstacles[key].y;
         isTrue = true;
      }
   });
   if (!isTrue) {
      move(sign, axis);
   }

   //console.log("NoCol");
   return false;
}

function move(sign, axis) {
   if (axis == 'x') {
      myBackground.speedX = sign * speedMultiplyer;
      wall.speedX = sign * speedMultiplyer;
      z.speedX = sign * speedMultiplyer;
      Object.keys(obstacles).forEach((key, index) => {
         obstacles[key].speedX = sign * speedMultiplyer;
      });
      localPos.x += -sign * speedMultiplyer;
      xOffset += sign * speedMultiplyer;
   } else {
      myBackground.speedY = sign * speedMultiplyer;
      wall.speedY = sign * speedMultiplyer;
      z.speedY = sign * speedMultiplyer;
      Object.keys(obstacles).forEach((key, index) => {
         obstacles[key].speedY = sign * speedMultiplyer;
      });
      localPos.y += -sign * speedMultiplyer;
      yOffset += sign * speedMultiplyer;
   }

   // possible optimization: update locations way less frequently and tween sprites into new positions
   socket.emit("updateLoc", id, localPos.x, localPos.y);
}
//runs every frame
function updateGameArea() {
   //console.log(socket.id);
   //get new player list every frame
   //(likely super inefficient to get a list of object each frame, perhaps just location values is better?)
   socket.on("recievePlayers", function(p) {
      //  console.log(p);
      //empty our local array of players
      players = {};
      //refill the array from the servers array
      Object.keys(p).forEach((key, index) => {
         let pServ = p[key];

         // if it's us, render in the center
         if (key == id) {
            locP = new component(pServ.width, pServ.height, pServ.color, 400, 300, pServ.type, id);
         } else // otherwise, figure out the right place to render them relative to us
         {
            locP = new component(pServ.width, pServ.height, pServ.color, pServ.x + xOffset, pServ.y + yOffset, pServ.type, pServ.id);
         }
         players[pServ.id] = locP;
      })
   });
   //clear the screen
   myGameArea.clear();
   //reset movement speed to 0
   myBackground.speedX = 0;
   myBackground.speedY = 0;
   wall.speedX = 0;
   wall.speedY = 0;
   z.speedX = 0;
   z.speedY = 0;
   Object.keys(obstacles).forEach((key, index) => {
      obstacles[key].speedX = 0;
      obstacles[key].speedY = 0;
   });
   //user input
   if (myGameArea.keys && myGameArea.keys[37]) {
      if (!collisionDetection(localPos.x - 1 * speedMultiplyer, localPos.y, 1, 'x')) {
         //  move(1,'x');
      } else {
         move(-1, 'x');
         console.log("cant go L");
      }
   }
   if (myGameArea.keys && myGameArea.keys[39]) {
      if (!collisionDetection(localPos.x + 1 * speedMultiplyer, localPos.y, -1, 'x')) {
         //  move(-1,'x');
      } else {
         move(1, 'x');
         console.log("cant go R");
      }
   }
   if (myGameArea.keys && myGameArea.keys[38]) {
      if (!collisionDetection(localPos.x, localPos.y - 1 * speedMultiplyer, 1, 'y')) {
         //  move(1,'y');
      } else {
         move(-1, 'y');
         console.log("cant go U");
      }
   }
   if (myGameArea.keys && myGameArea.keys[40]) {
      if (!collisionDetection(localPos.x, localPos.y + 1 * speedMultiplyer, -1, 'y')) {
         //  move(-1,'y');
      } else {
         move(1, 'y');
         console.log("cant go D");
      }
   }


   //move background image
   myBackground.newPos();
   //redraw the background image since it has moved
   myBackground.update();
   //same process for this wall


   wall.newPos();
   wall.update();

   //re draw all the players and bullets
   Object.keys(players).forEach((key, index) => {
      players[key].update();
   })
   Object.keys(obstacles).forEach((key, index) => {
      obstacles[key].newPos();
      obstacles[key].update();
   })
   bullets.forEach(function(bullet) {
      bullet.update();
      bullet.newPos();
   });
   z.newPos();
   z.update();


}
//handle clicking (for instantiating bullets)
myGameArea.canvas.addEventListener('click', function() {
   var sX = event.clientX;
   var sY = event.clientY;
   var mouse = new Vector(sX, sY);
   var origin = new Vector(400, 300);
   mouse.sub(origin);
   mouse.normalize();
   bullet = new component(20, 20, "red", 425, 325, "color", id);
   bullet.speedX = mouse.x * speedMultiplyer * 4;
   bullet.speedY = mouse.y * speedMultiplyer * 4;
   bullets.push(bullet);
}, false);
-->
*/
