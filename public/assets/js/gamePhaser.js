var myGamePiece;
var wall;
var myBackground;
var player;
var speedMultiplyer = 3;
var bullets = [];
var players = {};
var obstacles = {};
var initPlayers = false;
var id; // our socket id
// offsets to figure out where to draw other players
var yOffset = 0;
var xOffset = 0;

var config = {
   type: Phaser.AUTO,
   width: 800,
   height: 600,
   zoom: 1,
   pixelArt: true,
   parent: 'game',
   physics: {
      default: 'arcade',
      arcade: {
         debug: false
      }
   },
   scene: {
      preload: preload,
      create: create,
      update: update
   }
};

var game = new Phaser.Game(config);

var Projectile = new Phaser.Class({

   Extends: Phaser.GameObjects.Image,

   initialize:

      // Projectile Constructor
      function Projectile(scene) {
         Phaser.GameObjects.Sprite.call(this, scene, 0, 0, 'projectile');
         this.speed = 1;
         this.born = 0;
         this.direction = 0;
         this.xSpeed = 0;
         this.ySpeed = 0;
         this.setSize(10, 10, true);
      },

   // Fires a bullet from the player to the reticle
   fire: function(shooter, target, angle) {

      this.setPosition(shooter.x, shooter.y); // Initial position
      this.direction = Math.atan((target.x - this.x) / (target.y - this.y));
      //this.setRotation(this.direction);


      // Calculate X and y velocity of bullet to moves it from shooter to target
      if (target.y >= this.y) {
         this.xSpeed = this.speed * Math.sin(this.direction);
         this.ySpeed = this.speed * Math.cos(this.direction);
      } else {
         this.xSpeed = -this.speed * Math.sin(this.direction);
         this.ySpeed = -this.speed * Math.cos(this.direction);
      }
      this.rotation = shooter.rotation;
      this.born = 0; // Time since new bullet spawned
   },

   // Updates the position of the bullet each cycle
   update: function(time, delta) {
      this.x += this.xSpeed * delta;
      this.y += this.ySpeed * delta;
      this.born += delta;
      if (this.born > 1800) {
         this.setActive(false);
         this.setVisible(false);
      }
   }

});

function preload() {
   this.load.image('ground', 'assets/js/ground.jpg');
   this.load.image("wall", "assets/js/wall.png");
   this.load.image('player', 'assets/js/character.png');
   this.load.image('projec', 'assets/js/projectile.png');
   this.load.image('target', 'assets/js/target.png');
}

function create() {
   var self = this;
   const {
      width,
      height
   } = this.sys.game.config;
   // Creating a repeating background sprite
   const bg = this.add.tileSprite(0, 0, width, height, "ground");
   bg.setOrigin(0, 0);

   // Creating obstacles
   obstacles = this.physics.add.staticGroup();
   obstacles.create(600, 400, 'wall').setScale(0.15).refreshBody();


   // Creating a player
   player = this.physics.add.sprite(0, 0, 'player').setSize(350, 350, true).setScale(0.10);
   //player.setBounce(0.2).setCollideWorldBounds(true);
   player.setDataEnabled();

   // Setup username display
   player.data.set('name', 'PlayerName'); // replace with username
   nameText = this.add.text(0, 30, '', {
      font: '16px Courier',
      fill: '#00ff00'
   }).setOrigin(0.5);
   nameText.setText([
      player.data.get('name')
   ]);

   reticle = this.physics.add.sprite(800, 700, 'target');
   reticle.setOrigin(0.5, 0.5).setDisplaySize(25, 25).setCollideWorldBounds(true);
   // Creating our projectiles
   projectiles = this.physics.add.group({
      classType: Projectile,
      runChildUpdate: true
   });

   // Fires bullet from player on left click of mouse
   this.input.on('pointerdown', function(pointer) {
      let angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.movementX + this.cameras.main.scrollX, pointer.movementY + this.cameras.main.scrollY);
      var projectile = projectiles.get().setActive(true).setVisible(true);
      if (projectile) {
         projectile.fire(playerContainer, reticle);
         socket.emit("fire", id, playerContainer.x, playerContainer.y, reticle.x, reticle.y);
         //this.physics.add.collider(enemy, projectile, enemyHitCallback);
      }
   }, this);

   // Pointer lock will only work after mousedown
   game.canvas.addEventListener('mousedown', function() {
      game.input.mouse.requestPointerLock();
   });

   // Exit pointer lock when Q or escape (by default) is pressed.
   this.input.keyboard.on('keydown_Q', function(event) {
      if (game.input.mouse.locked)
         game.input.mouse.releasePointerLock();
   }, 0, this);

   this.input.on('pointermove', function(pointer) {
      if (this.input.mouse.locked) {
         reticle.x += pointer.movementX;
         reticle.y += pointer.movementY;
      }
   }, this);
   // Setup container for player and name
   // Note: player position is relative to container, so use container position for coordinates
   playerContainer = this.add.container(500, 450, [player, nameText]);
   playerContainer.setSize(30, 30);
   this.physics.world.enable(playerContainer);
   playerContainer.body.setBounce(0.2).setCollideWorldBounds(true);
   // Creating a camera
   this.cameras.main.setZoom(1.5);
   this.cameras.main.setBounds(0, 0, width, height);
   this.cameras.main.startFollow(playerContainer);
   // Creating a collider
   this.physics.add.collider(playerContainer, obstacles);


   socket = io();
   socket.on('initPlayers', function(p) {
      id = socket.id;
      players[id] = player;
      startGameOnConnect(p, self);
   })
}

function update() {
   // controls
   cursors = this.input.keyboard.createCursorKeys();
   if (cursors.left.isDown) {
      playerContainer.body.setVelocityX(-160);
      // play animations here
   } else if (cursors.right.isDown) {
      playerContainer.body.setVelocityX(160);
   } else {
      playerContainer.body.setVelocityX(0);
   }
   if (cursors.up.isDown) {
      playerContainer.body.setVelocityY(-160);
   } else if (cursors.down.isDown) {
      playerContainer.body.setVelocityY(160);
   } else {
      playerContainer.body.setVelocityY(0);
   }
   if (id != null) {
      socket.emit("updateLoc", id, playerContainer.x, playerContainer.y);
   }
   player.rotation = Phaser.Math.Angle.Between(playerContainer.x, playerContainer.y, reticle.x, reticle.y);
   reticle.body.velocity.x = playerContainer.body.velocity.x;
   reticle.body.velocity.y = playerContainer.body.velocity.y;
   constrainReticle(reticle);

}

function constrainReticle(reticle) {
   var distX = reticle.x - player.x; // X distance between player & reticle
   var distY = reticle.y - player.y; // Y distance between player & reticle

   // Ensures reticle cannot be moved offscreen (player follow)
   if (distX > 800)
      reticle.x = playerContainer.x + 800;
   else if (distX < -800)
      reticle.x = playerContainer.x - 800;

   if (distY > 600)
      reticle.y = playerContainer.y + 600;
   else if (distY < -600)
      reticle.y = playerContainer.y - 600;
}
//run once at the beginning of the game
function startGameOnConnect(p, self) {
   console.log("socketIO is working. Starting Game!");
   // set list of players that the server has to the local list of players
   //iterate through each player in the server's list
   Object.keys(p).forEach((key, index) => {
      if (id != key) {
         console.log("key: " + key + " index: " + index);
         let pServ = p[key];

         //store that component in a local list of players
         players[key] = self.add.sprite(0, 0, 'player').setScale(0.10);
         players[key].setDataEnabled();

         // Setup username display
         players[key].data.set('name', pServ.user);
         otherPlayerText = self.add.text(0, 30, '', {
            font: '16px Courier',
            fill: '#00ff00'
         }).setOrigin(0.5);
         otherPlayerText.setText([
            players[key].data.get('name')
         ]);

         // Setup container for player and name
         // Note: player position is relative to container, so use container position for coordinates
         container = self.add.container(pServ.x, pServ.y, [players[key], otherPlayerText]);
      }
   });

   // passing the player object to the server
   socket.emit("addPlayer", player.parentContainer.x, player.parentContainer.y, player.data.get('name'));

   socket.on("recieveWorld", function(p) {
      /*
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
         })*/
   });
   /*
   //create an obstacle
   z = new component(30, 30, "red", 20, 20, "color", "lolol");
   wall = new component(30, 30, "blue", 300, 300, "color", id);
   wall.worldPos.x = 300;
   wall.worldPos.y = 300;
   });
   */
   /*
   socket.emit("updateLoc", id, localPos.x, localPos.y);
   myGameArea.start();
   */
   socket.on("recievePlayers", function(p) {
      if (p.id != id) {
         players[p.id].parentContainer.x = p.x;
         players[p.id].parentContainer.y = p.y;
      }
   });

   socket.on('fired', function(id, targetX, targetY) {
      if (p.id != id) {
         //fake a shot from source to target direction
      }
      startGameOnConnect(p, self);
   })

   socket.on("newPlayer", function(p) {
      if (p.id != id) {
         //store that component in a local list of players
         players[p.id] = self.add.sprite(0, 0, 'player').setScale(0.10);
         players[p.id].setDataEnabled();

         // Setup username display
         players[p.id].data.set('name', p.user);
         otherPlayerText = self.add.text(0, 30, '', {
            font: '16px Courier',
            fill: '#00ff00'
         }).setOrigin(0.5);
         otherPlayerText.setText([
            p.user
         ]);
         console.log("Other player's name is " + p.user);

         // Setup container for player and name
         // Note: player position is relative to container, so use container position for coordinates
         container = self.add.container(p.x, p.y, [players[p.id], otherPlayerText]);
      }
   });

   socket.on("deletePlayer", function(p) {
      if (p.id != id) {
         players[p.id].parentContainer.setActive(false).setVisible(false).destroy;
         delete players[p.id];
      }
   });
}

function resetProjectile(projectile) {
   // Destroy the projectile
   projectile.kill();
}
