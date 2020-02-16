const mongoose = require('mongoose')
const bcrypt = require('bcryptjs');
 
const Schema = mongoose.Schema;
 
const UserSchema = new Schema({
  email : {
    type : String,
    required : true,
    unique : true
  },
  password : {
    type : String,
    required : true
  },
  name : {
    type: String,
    required: true
  },
  highScore : {
    type: Number,
    default: 0
  }
});
 
UserSchema.pre('save', async function (next) {
  const user = this;
  const hash = await bcrypt.hashSync(this.password, 10);
  this.password = hash;
  next();
});
 
UserSchema.methods.isValidPassword = async function (password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);
  return compare;
}
 
const UserModel = mongoose.model('user', UserSchema);
 
module.exports = UserModel;