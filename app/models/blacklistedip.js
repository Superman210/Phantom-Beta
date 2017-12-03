var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate");

var ipSchema = new mongoose.Schema({
  ip: { 
    type: String, 
    unique: true, 
    index: true
  },
  description: String,
  network: String,
  location: String,
  link_id: String,
  time: Date,
  connection: {}
});
ipSchema.plugin(mongoosePaginate);

ipSchema.statics.autoblacklist = function(req, ip, link, connection) {
  return this.create({
    ip,
    link_id: link._id,
    description: "Auto blacklisted from link: " + link.link_generated,
    network: link.network,
    time: new Date(),
    connection
  }, err => {
    if (err) console.error(err);
  });
};

mongoose.model("BlacklistedIP", ipSchema);