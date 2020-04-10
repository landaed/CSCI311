var player;
var playerContainer;
var speedMultiplyer = 3;
var bullets = [];
var players = [];
var enemies = [];
var initPlayers = false;
var itemGroup;
var id; // our socket id
// offsets to figure out where to draw other players
var yOffset = 0;
var xOffset = 0;
var rotation;
var map;
var mapGrid = [];
var finder;
var direction = "right";


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

var HttpClient = function() {
    console.log("httpClient");
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() {

            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200){
                console.log("got call back!");
                aCallback(anHttpRequest.responseText);
              }
              else{
                console.log("failed callback");
              }
        }

        anHttpRequest.open( "GET", aUrl, true );
        anHttpRequest.send( null );
    }
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

var client;
var client_id;


var game = new Phaser.Game(config);

// Projectile code based on example from https://phaser.io/examples/v3/view/games/topdownshooter/topdowncombatmechanics
var Projectile = new Phaser.Class({

   Extends: Phaser.GameObjects.Sprite,

   initialize:
      // Projectile Constructor
      function Projectile(scene) {
         Phaser.GameObjects.Sprite.call(this, scene, 0, 0, 'projectile');
         this.speed = 1;
         this.born = 0;
         this.direction = 0;
         this.xSpeed = 0;
         this.ySpeed = 0;
         this.setSize(1, 1, true);
      },

   // Fires a bullet from the player to the reticle
   fire: function(shooter, target, angle) {
      this.setPosition(shooter.x, shooter.y); // Initial position
      this.direction = Math.atan((target.x - this.x) / (target.y - this.y));

      this.anims.play('arrow');
      // Calculate X and y velocity of bullet to moves it from shooter to target
      if (target.y >= this.y) {
         this.xSpeed = this.speed * Math.sin(this.direction);
         this.ySpeed = this.speed * Math.cos(this.direction);
      } else {
         this.xSpeed = -this.speed * Math.sin(this.direction);
         this.ySpeed = -this.speed * Math.cos(this.direction);
      }
      this.rotation = angle+4.6;
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
   this.load.path = 'assets/sprite/';
   this.load.image('player', 'Archer/Archer_Idle_1.png'); // from https://superdark.itch.io/16x16-free-npc-pack
   this.load.image('item', 'item.png');
   this.load.image('target', 'target.png'); // from https://www.kenney.nl/assets/crosshair-pack under CC0
   this.load.spritesheet('enemy', 'enemy.png', { frameWidth: 64, frameHeight: 64, endFrame: 24 }); //by @LazyHamsters from https://lhteam.itch.io/zombie-toast
   this.load.spritesheet('projectile', 'arrow.png', { frameWidth: 32, frameHeight: 32, endFrame: 3 }); //from https://opengameart.org/content/rotating-arrow-projectile

   // from https://superdark.itch.io/16x16-free-npc-pack
   this.load.image('playerIdle1', 'Archer/Archer_Idle_1.png');
   this.load.image('playerIdle2', 'Archer/Archer_Idle_2.png');
   this.load.image('playerIdle3', 'Archer/Archer_Idle_3.png');
   this.load.image('playerIdle4', 'Archer/Archer_Idle_4.png');
   this.load.image('playerWalk1', 'Archer/Archer_Walk_1.png');
   this.load.image('playerWalk2', 'Archer/Archer_Walk_2.png');
   this.load.image('playerWalk3', 'Archer/Archer_Walk_3.png');
   this.load.image('playerWalk4', 'Archer/Archer_Walk_4.png');

   this.load.image("tiles", "../map/tileset.png"); // tileset from https://elthen.itch.io/2d-pixel-art-dungeon-tileset
   this.load.tilemapTiledJSON("map", "../map/map.json");
}

function create() {
  //get id from cookie
  var x = getCookie("_id").split(':');
  x = x[1];
  var result = x.substring(1, x.length-1);
  console.log("\n \n meow \n");
  console.log(result);
  client_id=result;

  //get name from cookies
  x = getCookie("username");
  console.log(x);
  var username = x;
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
   itemGroup = this.physics.add.staticGroup({
        key: 'item',
        frameQuantity: 10,
        immovable: true,
        width: 0.1,
        height: 0.1,
    });
    var children = itemGroup.getChildren();

    for (var i = 0; i < children.length; i++)
    {
        var x = Phaser.Math.Between(50, 750);
        var y = Phaser.Math.Between(50, 550);
        children[i].setScale(.1);
        children[i].setPosition(x, y);
        children[i].name = "potion of truth";
        children[i].type = "potion";
        children[i].image = 'assets/sprite/item.png';
    }
    itemGroup.refresh();

   map = this.make.tilemap({key:"map"});
   const tileset = map.addTilesetImage("ProjTileset", "tiles");
   const floorLayer = map.createStaticLayer("Floor", tileset, 0, 0);
   const floorDetailLayer = map.createStaticLayer("FloorDetail", tileset, 0, 0);
   const wallsLayer = map.createStaticLayer("Walls", tileset, 0, 0);
   const obstaclesLayer = map.createStaticLayer("Obstacles", tileset, 0, 0);
   const aboveLayer = map.createStaticLayer("Above",tileset,0, 0);
   const playerSpawn = map.findObject("SpawnPoints", obj => obj.name === "PlayerSpawn");
   aboveLayer.setDepth(10);
   wallsLayer.setCollisionByProperty({collide:true});
   obstaclesLayer.setCollisionByProperty({collide:true});

   // setup pathfinding
   // based on https://www.dynetisgames.com/2018/03/06/pathfinding-easystar-phaser-3/
   finder = new EasyStar.js();
   for (var y = 0; y < map.height; y++) {
      var col = [];
      for (var x = 0; x < map.width; x++) {
         // In each cell we store the ID of the tile, which corresponds
         // to its index in the tileset of the map ("ID" field in Tiled)
         col.push(map.getTileAt(x, y, true, "Obstacles").index);
      }
      mapGrid.push(col);
   }
   finder.setGrid(mapGrid);
   var acceptableTiles = [-1]; // -1 represents lack of tile in obstacle layer
   finder.setAcceptableTiles(acceptableTiles);

   this.anims.create({
      key: 'playerIdle',
      frames: [
         { key: 'playerIdle1' },
         { key: 'playerIdle2' },
         { key: 'playerIdle3' },
         { key: 'playerIdle4', duration: 50 }
      ],
      frameRate: 8,
      repeat: -1
   });

   this.anims.create({
      key: 'playerMoveRight',
      frames: [
         { key: 'playerWalk1' },
         { key: 'playerWalk2' },
         { key: 'playerWalk3' },
         { key: 'playerWalk4', duration: 50 }
      ],
      frameRate: 8,
      repeat: -1
   });

   this.anims.create({
      key: 'playerMoveLeft',
      frames: [
         { key: 'playerWalk1' },
         { key: 'playerWalk2' },
         { key: 'playerWalk3' },
         { key: 'playerWalk4', duration: 50 }
      ],
      frameRate: 8,
      repeat: -1,
      flipX: true
   })

   this.anims.create({
      key: 'enemyIdle',
      frames: this.anims.generateFrameNumbers('enemy', {start: 0, end: 1, first: 0 }),
      repeat: -1,
      duration: 200,
      framerate: 20
   });

   this.anims.create({
      key: 'enemyChase',
      frames: this.anims.generateFrameNumbers('enemy', {start: 2, end: 5, first: 2 }),
      repeat: -1,
      duration: 400,
      framerate: 20
   });

   this.anims.create({
      key: 'arrow',
      frames: this.anims.generateFrameNumbers('projectile', {start: 0, end: 3, first: 0 }),
      framerate: 20
   });

   // Creating a player
   player = this.physics.add.sprite(0, -10, 'player').setSize(64, 64, true).setDisplaySize(64, 64).play('playerIdle');
   //player.setBounce(0.2).setCollideWorldBounds(true);
   player.setDataEnabled();
   //this.physics.add.collider(this.player, obstaclesLayer);

   // Setup username display
   player.data.set('name', username); // replace with username
   nameText = this.add.text(0, 30, '', {
      font: '16px Courier',
      fill: '#00ff00'
   }).setOrigin(0.5);
   nameText.setText([
      player.data.get('name')
   ]);

   player.data.set('health', 5);

   reticle = this.physics.add.sprite(800, 600, 'target');
   reticle.setOrigin(0.5, 0.5).setDisplaySize(25, 25).setCollideWorldBounds(true);

   // Creating our projectiles
   projectiles = this.physics.add.group({
      classType: Projectile,
      runChildUpdate: true
   });

   this.playersGroup = this.physics.add.group({
      classType:  Phaser.GameObjects.Sprite,
      runChildUpdate: true
   });

   // Fires bullet from player on left click of mouse
   this.input.on('pointerdown', function(pointer) {
      let angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.movementX + this.cameras.main.scrollX, pointer.movementY + this.cameras.main.scrollY);
      var projectile = projectiles.get().setActive(true).setVisible(true);
      if (projectile) {
         projectile.fire(playerContainer, reticle, rotation);
         socket.emit("fire", id, reticle.x, reticle.y, rotation);
         this.physics.add.collider(this.spawns, projectile, enemyHitCallback);
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
   playerContainer = this.add.container(playerSpawn.x, playerSpawn.y, [player, nameText]);
   playerContainer.setSize(12,46);
   this.physics.world.enable(playerContainer);
   playerContainer.body.setBounce(0.2).setCollideWorldBounds(true);
   //this.physics.add.collider(this.container, this.spawns);
   // Creating a camera
   this.cameras.main.setZoom(1.5);
   this.cameras.main.setBounds(0, 0, width, height);
   this.cameras.main.startFollow(playerContainer);

   // enemy group
   this.spawns = this.physics.add.group({
      classType: Phaser.GameObjects.Sprite.Enemy
   });

   this.playersGroup.add(playerContainer);

   // Creating player colliders
   this.physics.add.collider(this.playersGroup, this.spawns, playerHitCallback);
   this.physics.add.collider(this.playersGroup, wallsLayer);
   this.physics.add.collider(this.playersGroup, obstaclesLayer);

   socket = io();
   socket.on('initPlayers', function(p) {
      id = socket.id;
      players[id] = player;
      players[id].data.set('id', id);
      startGameOnConnect(p, self);
   });
  this.physics.add.overlap(playerContainer, itemGroup, pickup);

}

function pickup(player, item){
  //add item to db
    console.log("img b4: " + item.image);
    console.log("ITEM: " + item);
    getItem(item.name, item.type, item.image);
  //  Hide the sprite
    itemGroup.killAndHide(item);

    //  And disable the body
    item.body.enable = false;

    console.log("pickedup item");
}


function update() {
   // controls
   cursors = this.input.keyboard.createCursorKeys();
   if (cursors.left.isDown) {
      playerContainer.body.setVelocityX(-160);
      direction = "left";
      player.anims.play('playerMoveLeft', true);
   } else if (cursors.right.isDown) {
      playerContainer.body.setVelocityX(160);
      direction = "right";
      player.anims.play('playerMoveRight', true);
   } else {
      playerContainer.body.setVelocityX(0);
   }
   if (cursors.up.isDown) {
      playerContainer.body.setVelocityY(-160);
      if (direction == "left")
      {
         player.anims.play('playerMoveLeft', true);
      }
      else
      {
         player.anims.play('playerMoveRight', true);
      }
   } else if (cursors.down.isDown) {
      playerContainer.body.setVelocityY(160);
      if (direction == "left")
      {
         player.anims.play('playerMoveLeft', true);
      }
      else
      {
         player.anims.play('playerMoveRight', true);
      }
   } else {
      playerContainer.body.setVelocityY(0);
   }
   if (id != null) {
      socket.emit("updateLoc", id, playerContainer.x, playerContainer.y);
   }

   if (!(cursors.down.isDown || cursors.up.isDown || cursors.left.isDown || cursors.right.isDown))
   {
      player.anims.play('playerIdle', true);
   }

   rotation = Phaser.Math.Angle.Between(playerContainer.x, playerContainer.y, reticle.x, reticle.y)
   reticle.body.velocity.x = playerContainer.body.velocity.x;
   reticle.body.velocity.y = playerContainer.body.velocity.y;
   constrainReticle(reticle);

   // set enemies with a target to chase their target
   for (var i = 0, len = enemies.length; i < len; i++) {
      if (enemies[i] != null && enemies[i].hasTarget && !enemies[i].chasing)
      {
         enemies[i].chasing = true;
         enemies[i].interval = setInterval(path, 250, enemies[i].id, enemies[i].targetID, this);
         // don't send the server updates on this enemy if it's chasing someone else
         if(enemies[i].targetID != id)
         {
            enemies[i].noUpdate = true;
         }
      }
      else if (enemies[i] != null && enemies[i].chasing)
      {
         enemies[i].anims.play('enemyChase', true);
      }
   }
   if(enemies)
   {
      socket.emit("updateEnemies", enemies); // send server updated enemy positions
   }

}

// find a path from the enemy to the player
function path(enemyID, playerID, self)
{
   var x = players[playerID].parentContainer.x;
   var y = players[playerID].parentContainer.y;
   var toX = Math.floor(x/32);
   var toY = Math.floor(y/32);
   var fromX = Math.floor(enemies[enemyID].x/32);
   var fromY = Math.floor(enemies[enemyID].y/32);

   finder.findPath(fromX, fromY, toX, toY, function( path ) {
        if (path === null) {
            console.warn("Path was not found.");
        } else if(enemies[enemyID].tween == null || !this.tweens.isPlaying){
            moveCharacter(enemies[enemyID], path, self);
        }
    });
   finder.calculate();
}

// tween the character along the path
function moveCharacter(character, path, self){
    // Sets up a list of tweens, one for each tile to walk, that will be chained by the timeline
    var tweens = [];
    for(var i = 0; i < path.length-1; i++){
        var ex = path[i+1].x;
        var ey = path[i+1].y;

        tweens.push({
            targets: character,
            x: {value: ex*map.tileWidth, duration: 200},
            y: {value: ey*map.tileHeight, duration: 200}
        });
    }

    self.tweens.timeline({
        tweens: tweens
    });
};

function enemyHitCallback(projectileHit, enemyHit)
{
   if (projectileHit.active === true && enemyHit.active === true)
   {
      projectileHit.setVisible(false).setActive(false).destroy;
      socket.emit("hitEnemy", enemyHit.id, 1);
   }
}

function playerHitCallback(playerContainer, enemyHit)
{
   playerHit = playerContainer.first;
   if (enemyHit.active === true && playerHit.active === true)
   {
      // kill the enemy that hit the player
      socket.emit("hitEnemy", enemyHit.id, enemyHit.health);
      socket.emit("hitPlayer", playerHit, playerHit.data.get('id'), playerHit.data.get('health'), 1);
   }
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
      if (id != key && p[key] != null) {
         console.log("key: " + key + " index: " + index);
         let pServ = p[key];

         //store that component in a local list of players
         players[key] = self.add.sprite(0, -10, 'player').setSize(64, 64, true).setDisplaySize(64, 64);
         players[key].setDataEnabled();
         players[key].data.set('health', pServ.health);
         players[key].data.set('id', key);
         // Setup username display
         players[key].data.set('name', pServ.user);
         otherPlayerText = self.add.text(0, 35, '', {
            font: '14px Courier',
            fill: '#00ff00'
         }).setOrigin(0.5);
         otherPlayerText.setText([
            players[key].data.get('name')
         ]);

         // Setup container for player and name
         // Note: player position is relative to container, so use container position for coordinates
         container = self.add.container(pServ.x, pServ.y, [players[key], otherPlayerText]);
         container.setSize(12, 46);
         self.playersGroup.add(container);
      }

   });

   // passing the player object to the server
   socket.emit("addPlayer", player.parentContainer.x, player.parentContainer.y, player.data.get('name'));

   socket.on("recieveWorld", function(p) {
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
   socket.on("recievePlayers", function(p) {
      if (p.id != id) {
         players[p.id].parentContainer.x = p.x;
         players[p.id].parentContainer.y = p.y;
      }
   });

   socket.on('fired', function(otherID, targetX, targetY, angle) {
      if (otherID != id) {
         var proj = projectiles.get().setActive(true).setVisible(true);
         var dest = {
            x: targetX,
            y: targetY
         }
         if (proj) {
            proj.fire(players[otherID].parentContainer, dest, angle);
         }
      }
   });

   socket.on("newPlayer", function(p) {
      if (p.id != id) {
         //store that component in a local list of players
         players[p.id] = self.add.sprite(0, 0, 'player').setDisplaySize(64, 64);
         players[p.id].setDataEnabled();
         players[p.id].data.set('id', p.id);
         players[p.id].data.set('health', p.health);

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

   // spawn an enemy where the server told us to
   socket.on("spawnEnemy", function(spawn) {
      var enemy = new Enemy(self, spawn.x, spawn.y, spawn.sprite, spawn.id, spawn.health, spawn.speed, spawn.range);
      // Setup container for enemy and bar
      //enemyContainer = self.add.container(spawn.x, spawn.y, [enemy, healthBar]);
      self.spawns.add(enemy); // switch to enemyContainer when healthbar is added
      enemies[spawn.id] = enemy;
   });

   // damage an enemy
   socket.on("hurtEnemy", function(enemyID, damage) {
      enemies[enemyID].health -= damage;
      if (enemies[enemyID].health <= 0) // kill the enemy
      {
         console.log("killing enemy " + enemyID);
         // stop pathing calcualations for the enemy
         if (enemies[enemyID].interval != null) {
            clearInterval(enemies[enemyID].interval);
         }
         enemies[enemyID].setActive(false).setVisible(false).destroy;
         enemies[enemyID] = null;
      }
   });

   // damage a player
   socket.on("hurtPlayer", function(playerHitID, damage) {
      players[playerHitID].data.set("health", players[playerHitID].data.get('health') - damage);
      if (players[playerHitID].data.get("health") <= 0) {
         if (playerHitID == id) // we died
         {
            // game over
         }
         playerHit.setActive(false).setVisible(false).destroy;
      }
   });

   socket.on("target", function(enemyID, playerID) {
      if (enemies[enemyID] != null) {
         enemies[enemyID].hasTarget = true;
         enemies[enemyID].targetID = playerID;
      }
   });

   // update locations of enemies
   socket.on("recieveEnemies", function(newEnemies) {
      if (enemies.length >= newEnemies.length) // don't update enemies until we're caught up with the server
      {
         self.spawns.children.each(function(enemy) {
            if (enemies[enemy.id] != null && newEnemies[enemy.id] != null) {
               enemies[enemy.id].x = newEnemies[enemy.id].x;
               enemies[enemy.id].y = newEnemies[enemy.id].y;
            }
         }, this);
      }
   });

   socket.on("deletePlayer", function(pID) {
      if (pID != id) {
         // update any enemies that were chasing that player
         for (var i = 0, len = enemies.length; i < len; i++) {
            if (enemies[i] != null && enemies[i].hasTarget) {
               if (enemies[i].chasing) {
                  enemies[i].chasing = false;
                  clearInterval(enemies[i].interval)
               }
               enemies[i].noUpdate = false;
               enemies[i].hasTarget = false;
               enemies[i].targetID = null;
            }
         }
         players[pID].parentContainer.setActive(false).setVisible(false).destroy;
         delete players[pID];
      }
   });
}

function resetProjectile(projectile) {
   // Destroy the projectile
   projectile.kill();
}



function getItem(name, type, image) {
  console.log(client_id);
  console.log("img after: " + image);
  var data = {
    id: client_id,
    name: name,
    type: type,
    image: image
  };
  $.ajax({
    type: 'POST',
    url: '/item',
    data,
    success: function (data) {
      console.log('user picked up item successfully, client_id: ' + client_id);
    },
    error: function (xhr) {
      console.log("failed to pickup item " + JSON.stringify(xhr));
    }
  });
}
