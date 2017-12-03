const url = require("url");
var mongoose = require("mongoose");
var Tag = mongoose.model("Tag");

module.exports.getUTMKeyWords = function(link) {
  var keywords = [];
  var parsed_url = url.parse(link);
  var query;

  if (!parsed_url || !parsed_url.search) return "";

  query = parsed_url.search;

  if (query.startsWith("?")) query = query.substring(1);

  for (var queryParam of query.split("&"))
    keywords.push(queryParam.split("=")[1]);
  
  return keywords.join(", ");
};

module.exports.parseGenerated = function(link_generated) {
  var parsed_url = url.parse(link_generated);
  var link = parsed_url.pathname;

  if (link.startsWith("/"))
    link = link.substring(1);

  if (link.endsWith("/"))
    link = link.substring(0, link.length - 1);

  if (link.lastIndexOf("/") !== -1)
    link = link.substring(link.lastIndexOf("/")+1);

  if (link.endsWith("/"))
    link = link.substring(0, link.length - 1);

  //if (parsed_url.search) link += parsed_url.search;

  return link;
};

module.exports.formSearchQuery = function (keyword, field, query) {
  if (!query)
    query = {};
  
  if (!keyword) return query;

  var or_conditions = query["$or"] || [];
  
  var condition = {
    [field]: new RegExp(keyword, "i")
  };

  or_conditions.push(condition);

  return {
    "$or": or_conditions
  };
};

module.exports.updateTagsIfRequired = function (tags) {
  for (let tag of tags) {
    Tag.findOne({ tag }, function (err, doc) {
      if (err) console.error(err);
      if (err || doc) return;
      
      Tag.create({ tag }, () => {});
    });
  }
};

module.exports.copyLinkRegions = function (original_criteria) {
  var criteria = [];

  for (let crit of original_criteria) {
    criteria.push({
      "country": crit.country || "",
      "region":  crit.region || "",
      "city":    crit.city || ""
    });
  } 

  return criteria;
};

module.exports.removeQuotes = function (str) {
  return str.replace(/"/i, "");
};