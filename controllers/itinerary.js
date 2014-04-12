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

function phoneFormat(phone) {
  phone = phone.replace(/[^0-9]/g, '');
  phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
  return phone;
}

function stripDataDetail(data) {
  var info = {};
  info["name"] = data["name"];
  info["id"] = data["id"];
  info["rating"] = data["rating"];
  info["phone"] = phoneFormat(data["phone"]);
  info["url"] = data["url"];
  info["snippet_text"] = data["snippet_text"];
  info["review_cnt"] = data["review_count"];
  info["categories"] = data["categories"];
  info["location"] = data["location"]["display_address"]

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

function getEvent(events, requser, datafield) {
  var returnEvent;
  if (requser) {
    User.findById(requser.id, function(err, user) {
      returnEvent = getBestBusiness(events, user.user_history[datafield]);
      user.user_history[datafield].unshift(returnEvent);
      user.save();
    });
  }
  else {
    returnEvent = getBestBusiness(events, []);
  }

  return returnEvent;
}

exports.getItinerary = function(req, res) {
  res.render('itinerary/itinerary', {
	title: 'Itinerary',
	searchTerm: "CITY"
  });
};


exports.getDetail = function(req, res) {
	var location = [];
	var locID = req.params.id
	yelp.business(locID, function(err, locationData) {
		// console.log(locationData);
		location.push(stripDataDetail(locationData));
		res.render('itinerary/detail', {
			title: 'Detail Page',
			loc: location[0]
		});
	}) 
};

exports.searchYelp = function(req, res) {
	var brunches = [];
	var events1 = [];
  var events2 = [];
	var dinners = [];
	var nightlives = [];

  var brunch, event1, event2, dinner, nightlife;

  // Brunch
	yelp.search({term: "lunch or brunch or breakfast", location: req.body.city}, function(err, brunchData) {
		brunchData.businesses.forEach(function(i) {
			brunches.push(stripData(i));
		});

    brunch = getEvent(brunches, req.user, "brunches");

    // Event ("outdoors")
		yelp.search({term:"park or zoo or hike", location: req.body.city}, function(err, eventsData) {
			eventsData.businesses.forEach(function(i) {
				events1.push(stripData(i));
			});

      event1 = getEvent(events1, req.user, "events1");

      // Event ("indoors")
      yelp.search({term:"museum or landmark", location: req.body.city}, function(err, eventsData) {
      eventsData.businesses.forEach(function(i) {
        events2.push(stripData(i));
      });

      event2 = getEvent(events2, req.user, "events2");

        // Dinner							
  			yelp.search({term:"dinner", location: req.body.city}, function(err, dinnerData) {
  				dinnerData.businesses.forEach(function(i) {
  					dinners.push(stripData(i));
  				});

          dinner = getEvent(dinners, req.user, "dinners");
          	
          // Nightlife		
  				yelp.search({term:"nightlife or pub or bar or club or lounge", location: req.body.city}, function(err, barsData) {
  					barsData.businesses.forEach(function(i) {
  						nightlives.push(stripData(i));
  					});
  					User.findById(req.user.id, function(err, user) {
              user.user_history.nightlives.unshift(getBestBusiness(nightlives, user.user_history.nightlives));
              user.save();
    					res.render('itinerary/itinerary', {
    						searchTerm: req.body.city.charAt(0).toUpperCase() + req.body.city.slice(1).toLowerCase(),
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