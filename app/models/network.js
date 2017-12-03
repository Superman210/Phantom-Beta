var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var networkSchema = new mongoose.Schema({
  network: {
    'type': String,
    'unique': true
  },
  description: String,
});
networkSchema.plugin(mongoosePaginate);

mongoose.model('Network', networkSchema);