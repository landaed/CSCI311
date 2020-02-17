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


function component(width, height, color, x, y, type, id) {
    this.type = type;
    this.color = color;
    if (type == "image") {
        this.image = new Image();
        this.image.src = color;
    }
    this.worldPos = new Vector(0,0);
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
    this.x = x;
    this.y = y;
    this.id = id;
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
