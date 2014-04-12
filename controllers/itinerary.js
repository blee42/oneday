/**
 * GET /
 * Itinerary Pages
 */
var secrets = require("../config/secrets");
var async = require("async");
var yelp = require("yelp").createClient(secrets.yelp);

// var visited_businesses = [];

function stripData(data) {
  var info = {};
  info["name"] = data["name"];
  info["id"] = data["id"];
  info["rating"] = data["rating"];
  info["phone"] = data["phone"];
  info["url"] = data["url"];
  info["snippet_text"] = data["snippet_text"];
  info["review_cnt"] = data["review_count"];
  info["categories"] = data["categories"];
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
	var visited_brunches = [];
	var visited_events = [];
	var visited_dinners = [];
	var visited_nightlife = [];
	var brunches = [];
	var events = [];
	var dinners = [];
	var nightlives = [];
	yelp.search({term: "lunch or brunch or breakfast", location: req.body.city}, function(err, brunchData) {
		brunchData.businesses.forEach(function(i) {
			brunches.push(stripData(i));
		});
		visited_brunches.unshift(getBestBusiness(brunches, visited_brunches));

		yelp.search({term:"park or museum or landmark or zoo or hike", location: req.body.city}, function(err, eventsData) {
			eventsData.businesses.forEach(function(i) {
				events.push(stripData(i));
			});
			visited_events.unshift(getBestBusiness(events, visited_events));
				
			yelp.search({term:"dinner", location: req.body.city}, function(err, dinnerData) {
				dinnerData.businesses.forEach(function(i) {
					dinners.push(stripData(i));
				});
				visited_dinners.unshift(getBestBusiness(dinners, visited_events));
					
				yelp.search({term:"nightlife or pub or bar or club or lounge", location: req.body.city}, function(err, barsData) {
					barsData.businesses.forEach(function(i) {
						nightlives.push(stripData(i));
					});
					visited_nightlife.unshift(getBestBusiness(nightlives, visited_events));
					console.log(visited_brunches);

						console.log(brunches);
					res.render('itinerary/itinerary', {
						searchTerm: req.body.city,
						title: 'Itinerary',
						brunchPlace: brunches[0],
						eventPlace1: events[0],
						eventPlace2: events[1],
						dinnerPlace: dinners[0],
						nightPlace: nightlives[0],
					});
				});
			});
		});
	});
};