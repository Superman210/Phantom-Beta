const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const PositiveNumber = {
  'type': Number, 
  'min': 0,
  'default': 0
};

const linkSchema = new mongoose.Schema({
  'link_generated': {
    'type': String,
    'index': true,
    'unique': true
  },
  'link_safe': String,
  'link_voluum': String,
  'description': String,

  'owner': {
    'type': String,
    'index': true
  },

  // 0 - Placeholder, 1 - In Place, 2 - Redirect
  'type': PositiveNumber,
  
  'tags': [String],
  'network': String,
  'angle': String,
  'enable_at': Date,
  'disable_at': Date, //11.25 Alex added
  'use_ip_blacklist': Boolean,
  'status': Boolean,
  'criteria': [ {} ],
  'criteria_disallow': [ {} ],

  'cpc':          PositiveNumber,
  'payout':       PositiveNumber,
  'total_hits':   PositiveNumber,
  'disabled_hits': PositiveNumber,
  'real_hits':    PositiveNumber,
  'offer_hits':   PositiveNumber,
  'conversions':  PositiveNumber,

  'auto_blacklist_count': Number,
  'auto_blacklist': [String],

  'created_time': {
    'type': Date,
    'index': true,
    'default': Date.now
  },

  'updated_time': {
    'type': Date,
    'index': true,
    'default': Date.now
  }
});

linkSchema.plugin(mongoosePaginate);

mongoose.model('Link', linkSchema);