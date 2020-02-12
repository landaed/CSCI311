var myGamePiece;
var myBackground;
var speedMultiplyer = 3;
var bullets = [];
function startGame() {
    myGamePiece = new component(60, 50, "./assets/js/Character.png", 200, 100, "image");
    myBackground = new component(800, 800, "./assets/js/ground.jpg", 0, 0, "image");
    myGameArea.start();

}

var Vector = function(x, y) {
    this.x = x;
    this.y = y;
};
Vector.prototype.add = function(v) {
  this.y = this.y + v.y;
  this.x = this.x + v.x;
};
Vector.prototype.sub = function(v) {
  this.y = this.y - v.y;
  this.x = this.x - v.x;
};
Vector.prototype.div = function(n) {
   this.x = this.x / n;
   this.y = this.y / n;
}
Vector.prototype.mult = function(n) {
   this.x = this.x * n;
   this.y = this.y * n;
}
Vector.prototype.mag = function() {
    return Math.sqrt(this.x*this.x + this.y*this.y);
};
Vector.prototype.normalize = function() {
  var m = this.mag();
  if (m > 0) {
    this.div(m);
  }
};
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

function component(width, height, color, x, y, type) {
    this.type = type;
    if (type == "image") {
        this.image = new Image();
        this.image.src = color;
    }
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
    this.x = x;
    this.y = y;
    this.update = function() {
        ctx = myGameArea.context;
        if (type == "image") {
            ctx.drawImage(this.image,
                this.x,
                this.y,
                this.width, this.height);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    this.newPos = function() {
        this.x += this.speedX;
        this.y += this.speedY;
    }
}

function updateGameArea() {
  myGameArea.clear();
  myBackground.speedX = 0;
  myBackground.speedY = 0;
  if (myGameArea.keys && myGameArea.keys[37]) {myBackground.speedX = 1 * speedMultiplyer; }
  if (myGameArea.keys && myGameArea.keys[39]) {myBackground.speedX = -1 * speedMultiplyer; }
  if (myGameArea.keys && myGameArea.keys[38]) {myBackground.speedY = 1 * speedMultiplyer; }
  if (myGameArea.keys && myGameArea.keys[40]) {myBackground.speedY = -1 * speedMultiplyer; }
  myBackground.newPos();
  myBackground.update();
  bullets.forEach(function(bullet) {
    bullet.update();
    bullet.newPos();
    //bullet.speedY= myBackground.speedY;
  });
  myGamePiece.update();

}
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
