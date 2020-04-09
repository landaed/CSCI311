// reads in our .env file and makes those values available as environment variables
require('dotenv').config();
const Dungeon = require('./public/assets/js/dungeon.min.js');
const Easystar = require('./public/assets/js/easystar.min.js')
const classes = require('./public/assets/js/classes.js');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const mongoose = require('mongoose');
const routes = require('./routes/main');
const express = require('express');
const bodyParser = require('body-parser');
const secureRoutes = require('./routes/secure');
// create an instance of an express app
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var enemies = [];
var players = {};
var particles = [];
var obstacles = [];
var worldWidth = 800;
var worldHeight = 600;
var enemyID = 0;
var map = [];
var living = 0;
// setup mongo connection
const uri = process.env.MONGO_CONNECTION_URL;
mongoose.connect(uri, { useNewUrlParser : true, useCreateIndex: true, useUnifiedTopology: true});
mongoose.connection.on('error', (error) => {
  console.log(error);
  process.exit(1);
});
mongoose.connection.on('connected', function () {
  console.log('connected to mongo');
});


//set up obstacles
/*
for(var i = 0; i < worldWidth/32; i++){
  for(var k = 0; k < worldHeight/32; k++){
    if(map[i][k] == 1){
      obstacle = new obj(0, 0, "grey", k*32, i*32, "color", k+i * i * i * i);
      //console.log("objX: " + obstacle.x +
    //", objY: " + obstacle.y + ", objW: " + obstacle.width + ", objH: " + obstacle.height);
      obstacles[k+i * i * i * i] = obstacle;
    }
  }
}*/

// update express settings
app.use(bodyParser.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(cookieParser());

// require passport auth
require('./auth/auth');
app.get('/game.html', passport.authenticate('jwt', { session : false }), function (req, res) {
  res.sendFile(__dirname + '/public/game.html');
});
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
 res.sendFile(__dirname + '/index.html');
});

app.get('/changeLog', function (req, res) {
 res.sendFile(__dirname + '/public/changelog.html');
});

// main routes
app.use('/', routes);
app.use('/', passport.authenticate('jwt', { session : false }), secureRoutes);

// catch all other routes
app.use((req, res, next) => {
  res.status(404);
  res.json({ message: '404 - Not Found' });
});

// handle errors
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({ error : err });
});

// have the server start listening on the provided port
http.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});
io.on('connection', function(socket){
  console.log('a user connected, id: ' + socket.id);
  socket.emit("initPlayers", players);
  socket.on('disconnect', function(){
    console.log('user disconnected, id: ' + socket.id);
    io.sockets.emit("deletePlayer", socket.id);
    delete players[socket.id];
  });
  //socket.emit("recieveWorld", obstacles);
  socket.on("addPlayer", function (posX, posY, name){
     console.log("new name is " + name);
    //newPlayer = new obj(player.width, player.height, player.color, player.x, player.y, player.type, player.id);
    players[socket.id] = {
       x: posX,
       y: posY,
       user: name,
       health: 5,
       id: socket.id
    };
    //console.log("serverside player length: " + Object.keys(players).length + " Added ID: " + socket.id);
    //console.log("Player name was " + players[socket.id].user);
    // spawn enemies already on the server
    for (var i = 0, len = enemies.length; i < len; i++) {
      if (enemies[i] != null)
      {
         console.log("spawning enemy " + i);
         socket.emit("spawnEnemy", enemies[i]);
      }
    }

    io.sockets.emit("newPlayer", players[socket.id]);

   });
   socket.on("fire", function (id, targetX, targetY, rotation){
     io.sockets.emit("fired", id, targetX, targetY, rotation);
   });
   socket.on("getPlayers", function(){
     //console.log(Object.keys(players).length);
     //socket.emit("initPlayers", players);
   });
   socket.on("hitPlayer", function(playerHit, hitID, health, damage){
     players[hitID].health -= damage;
     if (players[hitID].health <= 0)
     {
        //game over
     }
     io.sockets.emit("hurtPlayer", hitID, damage);
   });
   socket.on("hitEnemy", function(enemyID, damage){
     if (enemies[enemyID] != null)
     {
        enemies[enemyID].health -= damage;
        if (enemies[enemyID].health <= 0)
        {
           console.log("Killing enemy " + enemyID);
           enemies[enemyID].destroy;
           enemies[enemyID] = null;
           living--;
        }
        io.sockets.emit("hurtEnemy", enemyID, damage);
     }
   });
   socket.on("updateEnemies", function(newEnemies){
      for (var i = 0, len = enemies.length; i < len; i++) {
         // don't try to update if the client has not spawned this enemy
         // or the enemy is dead
         if (newEnemies[i] != null && enemies[i] != null && !newEnemies[i].noUpdate)
         {
            enemies[i].x = newEnemies[i].x;
            enemies[i].y = newEnemies[i].y;
         }
      }
   });
   socket.on("updateLoc", function(id,x,y){
    //console.log("id: " + id + ", size: " + Object.keys(players).length);
    //console.log("Updating location of ID: " + id);
    players[id].x = x;
    players[id].y = y;
    //console.log("servX: " + players[id].x + ", servY: " + players[id].y);
    io.sockets.emit("recievePlayers", players[id]);
   });
});
// update enemy locations at static interval
setInterval(() => {
   if (enemies.length != 0)
   {
      io.sockets.emit("recieveEnemies", enemies);
      targetCheck();
   }
}, 100, enemies);

// spawn a new enemy every 2 seconds if there are less than 5
setInterval(() => {
   if (living < 5)
   {
      enemies[enemyID] = new Enemy(Math.floor(Math.random()*370)+352, 50, enemyID, 'enemy', 3, 5, 200); // need a list of safe locations to spawn
      io.sockets.emit("spawnEnemy", enemies[enemyID]);
      enemyID++;
      living++;
   }
}, 2000, enemies)

// check if any players are in range to be targeted by an enemy
// pathing happens clientside (probably a bad idea)
function targetCheck()
{
   for (var i = 0, len = enemies.length; i < len; i++)
	{
      if(enemies[i] != null && !enemies[i].hasTarget)// only check for living enemies that need a target
      {
         for(var id in players)// target the first player in range
			{
            // get distance
            var dist = (Math.sqrt(Math.pow((players[id].x - enemies[i].x),2)
                                + Math.pow((players[id].y - enemies[i].y),2)));

            if (dist <= enemies[i].range)
            {
               //console.log(enemies[i].hasTarget);
               enemies[i].targetID = id;
               enemies[i].hasTarget = true;
               io.sockets.emit("target", enemies[i].id, id);
            }
         }
      }
   }
}

function Enemy(x, y, id, sprite, health, speed, range) {
   this.x = x;
   this.y = y;
   this.sprite = sprite;
   this.id = id;
   this.health = health;
   this.speed = speed;
   this.range = range;
   this.hasTarget = false;
   this.chasing = false;
   this.interval = null;
}

function obj(width, height, color, x, y, type, id) {
  this.type = type;
  this.color = color;
  this.width = width;
  this.height = height;
  this.speedX = 0;
  this.speedY = 0;
  this.x = x;
  this.y = y;
  this.id = id;
}
