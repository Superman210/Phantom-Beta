const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const mongooseBcrypt = require('mongoose-bcrypt');

var userSchema = new mongoose.Schema({
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true, bcrypt: true },
  role: String
});

userSchema.plugin(mongoosePaginate);
userSchema.plugin(mongooseBcrypt);

mongoose.model('User', userSchema);