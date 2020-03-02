// reads in our .env file and makes those values available as environment variables
require('dotenv').config();
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
var obstacles = {};
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
http.listen(process.env.PORT || 443, () => {
  console.log(`Server started on port ${process.env.PORT || 443}`);
});
io.on('connection', function(socket){

  console.log('a user connected, id: ' + socket.id);
  socket.on('disconnect', function(){
    console.log('user disconnected, id: ' + socket.id);
      delete players[socket.id];
  });
  socket.on('updatePos', function(player){
    //console.log('posX' + player.x + ", posY" + player.y);
  });
  socket.on("addPlayer", function (player){
    newPlayer = new obj(player.width, player.height, player.color, player.x, player.y, player.type, player.id);
    players[player.id] = newPlayer;
    console.log("serverside player length: " + Object.keys(players).length + " Added ID: " + player.id);
  })
  socket.on("getPlayers", function(){
     //console.log(Object.keys(players).length);
  //  socket.emit("initPlayers", players);
  });
  socket.on("updateLoc", function(id,x,y){
    //console.log("id: " + id + ", size: " + Object.keys(players).length);
    players[id].x = x;
    players[id].y = y;
   // console.log("servX: " + players[id].x + ", servY: " + players[id].y);
    io.sockets.emit("recievePlayers", players);
  });

});

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
