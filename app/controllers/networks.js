const mongoose = require('mongoose');
const Network = mongoose.model('Network');

module.exports.getNetworks = function(req, res) {
  var { page, pagesize, sort } = req.body;

  var params = { 
    page: parseInt(page), 
    limit: parseInt(pagesize)
  };

  if (sort)
    params.sort = sort;

  Network.paginate({}, params, (err, result) => {
    if (!result) result = {};

    res.json({
      networks: result.docs  || [],
      total:    result.total || 0,
      limit:    result.limit || pagesize,
      page:     result.page  || 1,
      pages:    result.pages || 0
    });
  });
};

module.exports.getNetwork = function(req, res) {
  Network.findById(req.params.id, (err, doc) => {
    if (err) console.error(err);

    res.json(
      err ? { id: false } : doc
    );
  });
};

module.exports.deleteNetwork = function(req, res) {
  if (req.session.role !== 'admin')
    return res.status(401).json({ 'message': 'API access unauthorized' });
  
  if (!req.body._id) 
    return res.json({ "result": false });

  Network.findByIdAndRemove(req.body._id, err => {
    if (err) console.error(err);
    
    res.json({
      "result": !err
    });
  });
};

module.exports.newOrUpdateNetwork = function(req, res) {
  var { _id, network, description } = req.body;

  var updated_network = {
    network, description
  };

  var dupCriteria = { 
    network
  };

  if (_id)
    dupCriteria._id = { '$ne': _id };

  if (_id) {

    if (req.session.role !== 'admin')
      return res.status(401);

    Network.findByIdAndUpdate(req.body._id, updated_network, (err, doc) => {
      if (err || !doc) {
        console.error(err);
        return res.json({ id: false });
      }

      let query = { "network": doc.network };
      let update = { '$set': { network } };

      mongoose.model("Traffic-Link").update(query, update);
      mongoose.model("Traffic-Offer").update(query, update);
      mongoose.model('Link').update(query, update);

      res.json(updated_network);
    });

  } else {
    
    Network.create(updated_network, (err, doc) => {
      if (err) console.error(err);
      
      res.json(
        err ? { id: false } : doc
      );
    });

  }
};
