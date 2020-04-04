class Enemy extends Phaser.GameObjects.Sprite {
   constructor(scene, x, y, sprite, id, health, speed, range)
   {
      super(scene, x, y, sprite).setOrigin(0);
      scene.add.existing(this);
      this.id = id;
      this.health = health;
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.range = range;
   }
}
