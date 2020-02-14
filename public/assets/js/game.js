var myGamePiece;
var wall;
var myBackground;
var speedMultiplyer = 3;
var bullets = [];
var socket = io();
var players =[];
var initPlayers = false;

//run once at the beginning of the game
function startGame() {
    // creating a player game object
    var player = new component(60, 50, "./assets/js/Character.png", 200, 100, "image");

    // passing the player object to the server
    socket.emit("addPlayer", player);

    // request players list from the server
    socket.emit("getPlayers");

    // set list of players that the server has to the local list of players
    socket.on("recievePlayers", function(p){
      //iterate through each player in the server's list
      p.forEach(function(pServ) {
        //this is a listener socket so it is always accessible despite being in the start function.
        //to make our initialization only occur on start, we use a boolean (initPlayers).
        if(!initPlayers){
          initPlayers = true;

          //create a new component based on what we recieved from the server.
          locP = new component(pServ.width, pServ.height, pServ.color, pServ.x, pServ.y, pServ.type)

          //store that component in a local list of players
          players.push(locP);

          //update will draw the component to the screen.
          locP.update();

          //here I am trying to get the index on the list that this player is located inspect
          //this is so we can move just this clients player Character, not all the players in the server.
          myGamePiece = players.length-1;
        //  console.log(myGamePiece);
        }
      });
    });

    //create a background
    myBackground = new component(800, 800, "./assets/js/ground.jpg", 0, 0, "image");

    //create an obstacle
    wall = new component(30, 30, "blue", 300, 300, "color");
    wall.worldPos.x = 300;
    wall.worldPos.y = 300;
    myGameArea.start();

}
//used to track this clients player characters global position (not sure if needed,
//still thinking about how to handle movement accross server)
var localPos = new Vector(200,100);

//this is the canvas essentially.
//we probably should make this larger and responsive
var myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 480;
        this.canvas.height = 270;
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
  //get new player list every frame
  //(likely super inefficient to get a list of object each frame, perhaps just location values is better?)
  socket.on("recievePlayers", function(p){
    //empty our local array of players
    players = [];
    //refill the array from the servers array
    //(possibly is causing my issues with binding the client to a single player)
    var i = 0;
    p.forEach(function(pServ) {

      if(i == myGamePiece){
        locP = new component(pServ.width, pServ.height, pServ.color, 200, 100, pServ.type)
      }
      else{
        locP = new component(pServ.width, pServ.height, pServ.color, pServ.x, pServ.y, pServ.type)
      }
      players.push(locP);
      i++;
    });
  });
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
    localPos.x += 1 * speedMultiplyer;
    socket.emit("updateLoc", myGamePiece, localPos.x, localPos.y);
  }
  if (myGameArea.keys && myGameArea.keys[39]) {
    myBackground.speedX = -1 * speedMultiplyer;
    wall.speedX = -1 * speedMultiplyer;
    localPos.x += -1 * speedMultiplyer;
    socket.emit("updateLoc", myGamePiece, localPos.x, localPos.y);
  }
  if (myGameArea.keys && myGameArea.keys[38]) {
    myBackground.speedY = 1 * speedMultiplyer;
    wall.speedY = 1 * speedMultiplyer;
    localPos.y += 1 * speedMultiplyer;
    socket.emit("updateLoc", myGamePiece, localPos.x, localPos.y);
  }
  if (myGameArea.keys && myGameArea.keys[40]) {
    myBackground.speedY = -1 * speedMultiplyer;
    wall.speedY = -1 * speedMultiplyer;
    localPos.y += -1 * speedMultiplyer;
    socket.emit("updateLoc", myGamePiece, localPos.x, localPos.y);
  }
  //console.log("myGamePiece: " + myGamePiece +", localX: " + localPos.x + ", localY: " + localPos.y);


  //move background image
  myBackground.newPos();
  //redraw the background image since it has moved
  myBackground.update();
  //same process for this wall
  wall.newPos();
  wall.update();

  //re draw all the players and bullets
  players.forEach(function(p) {
    p.update();
  });
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
  var origin = new Vector(200, 100);
  mouse.sub(origin);
  mouse.normalize();
  bullet = new component(20, 20, "red", 200, 100, "color");
  bullet.speedX= mouse.x* speedMultiplyer * 4;
  bullet.speedY= mouse.y * speedMultiplyer * 4;
  bullets.push(bullet);
}, false);
