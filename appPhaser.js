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
       id: socket.id
    };
    //console.log("serverside player length: " + Object.keys(players).length + " Added ID: " + socket.id);
    //console.log("Player name was " + players[socket.id].user);
    // spawn enemies already on the server
    for (var i = 0, len = enemies.length; i < len; i++) {
      socket.emit("spawnEnemy", enemies[i]);
    }

    // spawn a new enemy for testing
    enemies[enemyID] = {x:352,y:192,sprite:'troll',id:enemyID, health: 1, speed: 5, range:100}; // need a list of safe locations to spawn
    io.sockets.emit("spawnEnemy", enemies[enemyID]);
    console.log(enemies[enemyID]);
    enemyID++;

    io.sockets.emit("newPlayer", players[socket.id]);

   });
   socket.on("fire", function (id, targetX, targetY){
     io.sockets.emit("fired", id, targetX, targetY);
   });
   socket.on("getPlayers", function(){
     //console.log(Object.keys(players).length);
     //socket.emit("initPlayers", players);
   });
   socket.on("updateLoc", function(id,x,y){
    //console.log("id: " + id + ", size: " + Object.keys(players).length);
    //console.log("Updating location of ID: " + id);
    players[socket.id].x = x;
    players[socket.id].y = y;
    //console.log("servX: " + players[id].x + ", servY: " + players[id].y);
    io.sockets.emit("recievePlayers", players[id]);
   });
});
// update enemy locations at static interval
setInterval(() => {
   if (enemies[0] != null)
      io.sockets.emit("recieveEnemies", enemies);
}, 100, enemies);

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
