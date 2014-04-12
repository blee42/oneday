/**
 * GET /
 * Itinerary Pages
 */
var secrets = require("../config/secrets");
var async = require("async");
var yelp = require("yelp").createClient(secrets.yelp);
var User = require("../models/User");

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
	if (business["id"] == visited[i]["id"]) {
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
	var brunches = [];
	var events1 = [];
  var events2 = [];
	var dinners = [];
	var nightlives = [];

  //Brunch
	yelp.search({term: "lunch or brunch or breakfast", location: req.body.city}, function(err, brunchData) {
		brunchData.businesses.forEach(function(i) {
			brunches.push(stripData(i));
		});

    User.findById(req.user.id, function(err, user) {
      user.user_history.brunches.unshift(getBestBusiness(brunches, user.user_history.brunches));
      user.save();
    })

    // Event ("outdoors")
		yelp.search({term:"park or zoo or hike", location: req.body.city}, function(err, eventsData) {
			eventsData.businesses.forEach(function(i) {
				events1.push(stripData(i));
			});

      User.findById(req.user.id, function(err, user) {
        user.user_history.events1.unshift(getBestBusiness(events1, user.user_history.events1));
        user.save();
      })

      // Event ("indoors")
      yelp.search({term:"museum or landmark", location: req.body.city}, function(err, eventsData) {
      eventsData.businesses.forEach(function(i) {
        events2.push(stripData(i));
      });

      User.findById(req.user.id, function(err, user) {
        user.user_history.events2.unshift(getBestBusiness(events2, user.user_history.events2));
        user.save();
      });

        // Dinner							
  			yelp.search({term:"dinner", location: req.body.city}, function(err, dinnerData) {
  				dinnerData.businesses.forEach(function(i) {
  					dinners.push(stripData(i));
  				});

          User.findById(req.user.id, function(err, user) {
            a = getBestBusiness(dinners, user.user_history.dinners);
            user.user_history.dinners.unshift(a);
            user.save();
          });
  				
          // Nightlife		
  				yelp.search({term:"nightlife or pub or bar or club or lounge", location: req.body.city}, function(err, barsData) {
  					barsData.businesses.forEach(function(i) {
  						nightlives.push(stripData(i));
  					});
  					User.findById(req.user.id, function(err, user) {
              user.user_history.nightlives.unshift(getBestBusiness(nightlives, user.user_history.nightlives));
              user.save();
    					res.render('itinerary/itinerary', {
    						searchTerm: req.body.city,
    						title: 'Itinerary',
    						brunchPlace: user.user_history.brunches[0],
    						eventPlace1: user.user_history.events1[0],
    						eventPlace2: user.user_history.events2[0],
    						dinnerPlace: user.user_history.dinners[0],
    						nightPlace: user.user_history.nightlives[0],
  					 });
            });
  				});
  			});
      });
		});
	});
};