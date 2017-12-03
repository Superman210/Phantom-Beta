const mongoose = require('mongoose');
const Angle = mongoose.model('Angle');

module.exports.getAngles = function(req, res) {
  var { page, pagesize, sort } = req.body;

  var params = { 
    page: parseInt(page), 
    limit: parseInt(pagesize)
  };

  if (sort)
    params.sort = sort;

  Angle.paginate({}, params, (err, result) => {
    if (!result) result = {};

    res.json({
      angles:   result.docs  || [],
      total:    result.total || 0,
      limit:    result.limit || pagesize,
      page:     result.page  || 1,
      pages:    result.pages || 0
    });
  });
};

module.exports.getAngle = function(req, res) {
  Angle.findById(req.params.id, (err, doc) => {
    if (err) console.error(err);

    res.json(
      err ? { id: false } : doc
    );
  });
};

module.exports.deleteAngle = function(req, res) {
  if (req.session.role !== 'admin')
    return res.status(401).json({ 'message': 'API access unauthorized' });
  
  if (!req.body._id) 
    return res.json({ "result": false });

  Angle.findByIdAndRemove(req.body._id, err => {
    if (err) console.error(err);
    
    res.json({
      "result": !err
    });
  });
};

module.exports.newOrUpdateAngle = function(req, res) {
  var { _id, angle, description } = req.body;

  var updated_angle = {
    angle, description
  };

  var dupCriteria = { 
    angle
  };

  if (_id)
    dupCriteria._id = { '$ne': _id };

  if (_id) {

    if (req.session.role !== 'admin')
      return res.status(401);

    Angle.findByIdAndUpdate(req.body._id, updated_angle, (err, doc) => {
      if (err || !doc) {
        console.error(err);
        return res.json({ id: false });
      }

      let query = { "angle": doc.angle };
      let update = { '$set': { angle } };

      mongoose.model('Traffic-Link').update(query, update);
      mongoose.model('Traffic-Offer').update(query, update);
      mongoose.model('Link').update(query, update);

      res.json(updated_angle);
    });

  } else {
    
    Angle.create(updated_angle, (err, doc) => {
      if (err) console.error(err);
      
      res.json(
        err ? { id: false } : doc
      );
    });

  }
};
