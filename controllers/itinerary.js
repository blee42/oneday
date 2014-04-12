/**
 * GET /
 * Itinerary Pages
 */
var secrets = require("../config/secrets");
var async = require("async");
var yelp = require("yelp").createClient(secrets.yelp);

var visited_businesses = [];

function getNewBusiness(terms, location) {
  yelp.search({term: terms, location: location}, function(err, data) {
    var business_list = [];
    data.businesses.forEach(function(i) {
      business_list.push(stripData(i));
    });
    visited_businesses.unshift(getBestBusiness(business_list, visited_businesses));
  });
};

function stripData(data) {
  var info = {};
  info["name"] = data["name"];
  info["id"] = data["id"];
  info["rating"] = data["rating"];
  info["review_cnt"] = data["review_count"];
  info["location"] = data["location"]["address"] + ", " + data["location"]["city"] + " " + data["location"]["state_code"];

  return info;
};

function getBestBusiness(businesses, visited) {
  var scores = []
  for (var i=0; i < businesses.length; i++) {
    scores.push([scoreBusiness(businesses[i]), i]);
  }

  scores.sort(function(x, y) {
    return y[0] - x[0];
  });

  j = 0;
  while (alreadyVisited(businesses[scores[j][1]], visited)) {
    j++;
  }
  return businesses[scores[j][1]];
};

// Probably requires profile data.
function scoreBusiness(business) {
  return business["rating"];
};

function alreadyVisited(business, visited) {
  var bool = 0;
  for (var i=0; i < visited.length; i++) {
    if (business["name"] == visited[i]["name"]) {
      bool++;
    }
  }
  return bool;
};

exports.getItinerary = function(req, res) {
  res.render('itinerary/itinerary', {
    title: 'Itinerary',
    searchTerm: "CITY"
  });
};


exports.getDetail = function(req, res) {
  res.render('itinerary/detail', {
    title: 'Detail Page'
  });
};

exports.searchYelp = function(req, res) {
  getNewBusiness("brunch", req.body.city);
  console.log(visited_businesses);
	res.render('itinerary/itinerary', {
		searchTerm: req.body.city,
		title: 'Itinerary',
    brunchPlace: visited_businesses[0],
	});
};