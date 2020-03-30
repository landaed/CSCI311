const mongoose = require("mongoose");

const Item = mongoose.model(
  'items',
  new mongoose.Schema({
    name: String,
    type: String,
    id: mongoose.ObjectId
  })
);
module.exports = Item;
