const express = require('express');
const UserModel = require('../models/userModel');
const db = require("../models/models.js");
const router = express.Router();
const mongoose = require("mongoose");


router.get('/index', function (req, res){
 console.log("meow");
 res.status(200).json({ message: 'logged in' });
});

router.post('/getInventory', async (req, res) => {
  var id = req.body.id;
  var str = "";
  var i;
for (i = 0; i < id.length; i++) {
  if(id[i] != '"'){
    str = str + id[i];
  }
  else{
    console.log("bang!");
  }
}
console.log(str);
  //var id = mongoose.Types.ObjectId(req.body.id);


  const items = await db.find({id: str}, 'image name type');
  console.log(items);
  res.status(200).json({items: items});
});
module.exports = router;
