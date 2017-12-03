const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");

const StringIndex = { 'type': String, 'index': true };

var ipSchema = new mongoose.Schema({
  description: String,
  network: String,
  location: String,
  link_id: String,
  time: Date,
  connection: {}
});

ipSchema.plugin(mongoosePaginate);

mongoose.model("BlacklistedIP", ipSchema);