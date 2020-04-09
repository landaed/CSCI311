class Enemy extends Phaser.GameObjects.Sprite {
   constructor(scene, x, y, sprite, id, health, speed, range)
   {
      super(scene, x, y, sprite).setDisplaySize(64,64).setSize(32,32).setOrigin(0,0.5).play('enemyIdle');
      scene.add.existing(this);
      this.id = id;
      this.health = health;
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.range = range;
      this.hasTarget = false;
      this.targetID = -1;
      this.chasing = false;
      this.interval = null;
      this.noUpdate = false; // bad, hacky way of making enemy tweening a little smoother over the network
   }
}
