var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var angleSchema = new mongoose.Schema({
  'angle': {
    'type': String,
    'unique': true
  },
  'description': String
});

angleSchema.plugin(mongoosePaginate);

mongoose.model('Angle', angleSchema);