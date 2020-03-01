var myGamePiece;
var wall;
var myBackground;
var speedMultiplyer = 3;
var bullets = [];
var socket = io();
var players = {};
var initPlayers = false;
var id; // our socket id
// offsets to figure out where to draw other players
var yOffset = 0;
var xOffset = 0;

socket.on('connect', function()
{
   id = socket.id;
   startGameOnConnect();
})

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
    socket.on("initPlayers", function(p){
      //iterate through each player in the server's list
      Object.keys(p).forEach((key, index) =>{
        if(id != key){
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
    myBackground = new component(800, 800, "./assets/js/ground.jpg", 0, 0, "image", id);

    //create an obstacle
    wall = new component(30, 30, "blue", 300, 300, "color", id);
    wall.worldPos.x = 300;
    wall.worldPos.y = 300;
    myGameArea.start();

}
//used to track this clients player characters global position (not sure if needed,
//still thinking about how to handle movement accross server)
var localPos = new Vector(400,300);

//this is the canvas essentially.
//we probably should make this larger and responsive
var myGameArea = {
    canvas : document.getElementById("game"),
    start : function() {
      this.canvas.width = 800;
      this.canvas.height = 600;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(updateGameArea, 20);
        window.addEventListener('keydown', function (e) {
            myGameArea.keys = (myGameArea.keys || []);
            myGameArea.keys[e.keyCode] = (e.type == "keydown");
        })
        window.addEventListener('keyup', function (e) {
            myGameArea.keys[e.keyCode] = (e.type == "keydown");
        })
    },
    clear : function(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

//runs every frame
function updateGameArea() {
   //console.log(socket.id);
  //get new player list every frame
  //(likely super inefficient to get a list of object each frame, perhaps just location values is better?)
  socket.on("recievePlayers", function(p){
    //empty our local array of players
    players = {};
    //refill the array from the servers array
      Object.keys(p).forEach((key, index) =>{
         let pServ = p[key];

         // if it's us, render in the center
         if (key == id)
         {
            locP = new component(pServ.width, pServ.height, pServ.color, 400, 300, pServ.type, id);
         }
         else // otherwise, figure out the right place to render them relative to us
         {
           locP = new component(pServ.width, pServ.height, pServ.color, pServ.x + xOffset, pServ.y + yOffset, pServ.type, pServ.id);
         }
         players[pServ.id] = locP;
      })
   })
  //clear the screen
  myGameArea.clear();
  //reset movement speed to 0
  myBackground.speedX = 0;
  myBackground.speedY = 0;
  wall.speedX = 0;
  wall.speedY = 0;

  //user input
  if (myGameArea.keys && myGameArea.keys[37]) {
    myBackground.speedX = 1 * speedMultiplyer;
    wall.speedX = 1 * speedMultiplyer;
    localPos.x += -1 * speedMultiplyer;
    xOffset += 1 * speedMultiplyer;
  }
  if (myGameArea.keys && myGameArea.keys[39]) {
    myBackground.speedX = -1 * speedMultiplyer;
    wall.speedX = -1 * speedMultiplyer;
    localPos.x += 1 * speedMultiplyer;
    xOffset -= 1 * speedMultiplyer
  }
  if (myGameArea.keys && myGameArea.keys[38]) {
    myBackground.speedY = 1 * speedMultiplyer;
    wall.speedY = 1 * speedMultiplyer;
    localPos.y += -1 * speedMultiplyer;
    yOffset += 1 * speedMultiplyer;
  }
  if (myGameArea.keys && myGameArea.keys[40]) {
    myBackground.speedY = -1 * speedMultiplyer;
    wall.speedY = -1 * speedMultiplyer;
    localPos.y += 1 * speedMultiplyer;
    yOffset -= 1 * speedMultiplyer;
  }
  // possible optimization: update locations way less frequently and tween sprites into new positions
  socket.emit("updateLoc", id, localPos.x, localPos.y);

  //move background image
  myBackground.newPos();
  //redraw the background image since it has moved
  myBackground.update();
  //same process for this wall
  wall.newPos();
  wall.update();

  //re draw all the players and bullets
   Object.keys(players).forEach((key, index) =>{
      players[key].update();
   })
  bullets.forEach(function(bullet) {
    bullet.update();
    bullet.newPos();
  });



}
//handle clicking (for instantiating bullets)
myGameArea.canvas.addEventListener('click', function() {
  var sX = event.clientX;
  var sY = event.clientY;
  var mouse  = new Vector(sX, sY);
  var origin = new Vector(400, 300);
  mouse.sub(origin);
  mouse.normalize();
  bullet = new component(20, 20, "red", 400, 300, "color", id);
  bullet.speedX= mouse.x* speedMultiplyer * 4;
  bullet.speedY= mouse.y * speedMultiplyer * 4;
  bullets.push(bullet);
}, false);
