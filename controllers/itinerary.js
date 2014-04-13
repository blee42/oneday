/**
 * GET /
 * Itinerary Pages
 */
var secrets = require("../config/secrets");
var async = require("async");
var yelp = require("yelp").createClient(secrets.yelp);
var User = require("../models/User");

// var visited_businesses = [];
var nullLocation = {}
nullLocation["name"] = "Oops! Data does not seem to be available for this location.";
nullLocation["id"] = "no-data";
nullLocation["rating"] = 0;
nullLocation["location"] = ["Try to find a cool activity in a different city! We'll update our databases as new data becomes available. Check back soon!"];

function stripData(data) {
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

function phoneFormat(phone) {
  if (typeof phone != 'undefined') {
    phone = phone.replace(/[^0-9]/g, '');
    phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    return phone;
  } else {
    return "";
  }
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
  if (scores == [] || typeof(scores[0]) == "undefined") {
    return nullLocation;
  }
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
  var location = [];
  var locID = req.params.id
 
  yelp.business(locID, function(err, locationData) {
    // console.log(locationData);
    if (locID == "no-data") {
      location.push(nullLocation);
    }
    else {
      location.push(stripDataDetail(locationData));
    }
    res.render('itinerary/detail', {
      title: 'Detail Page',
      loc: location[0]
      
    });
  }) 
};

// currently lacks a button
exports.clearHistory = function(req, res) {
  User.findById(req.user.id, function(err, user) {
    user.user_history.brunches = [];
    user.user_history.events1 = [];
    user.user_history.events2 = [];
    user.user_history.dinners = [];
    user.user_history.nightlives = [];
  })
};

exports.searchYelp = function(req, res) {
  if (!(req.body.city && req.body.city.length > 0)) {
    return res.redirect("/");
  }

  var brunches = [];
  var events1 = [];
  var events2 = [];
  var dinners = [];
  var nightlives = [];

  var brunch, event1, event2, dinner, nightlife;

  var bquery;
  var e1query;
  var e2query;
  var dquery;
  var nlquery;

  if (req.user) {
    bquery = req.user.queries.brunch;
    e1query = req.user.queries.event1;
    e2query = req.user.queries.event2;
    dquery = req.user.queries.dinner;
    nlquery = req.user.queries.nightlife;
  }
  else {
    bquery = "lunch or brunch or breakfast";
    e1query = "park or zoo or hike";
    e2query = "museum or landmark or concert";
    dquery = "dinner";
    nlquery = "bar or nightlife or club";
  }

  // Brunch
  yelp.search({term: bquery, location: req.body.city}, function(err, brunchData) {
    brunchData.businesses.forEach(function(i) {
      brunches.push(stripData(i));
    });

    if (req.user) {
      User.findById(req.user.id, function(err, user) {
        brunch = getBestBusiness(brunches, user.user_history.brunches);
        user.user_history.brunches.unshift(brunch);
        if (user.user_history.brunches.length > 10) {
          user.user_history.brunches.pop();
        }
        user.save();
      });
    }
    else {
      brunch = getBestBusiness(brunches, []);
    }

    // Event ("outdoors")
    yelp.search({term: e1query, location: req.body.city}, function(err, eventsData) {
      eventsData.businesses.forEach(function(i) {
        events1.push(stripData(i));
      });

      if (req.user) {
        User.findById(req.user.id, function(err, user) {
          event1 = getBestBusiness(events1, user.user_history.events1);
          user.user_history.events1.unshift(event1);
          if (user.user_history.events1.length > 10) {
            user.user_history.events1.pop();
          }
          user.save();
        });
      }
      else {
        event1 = getBestBusiness(events1, []);
      }

      // Event ("indoors")
      yelp.search({term: e2query, location: req.body.city}, function(err, eventsData) {
        eventsData.businesses.forEach(function(i) {
          events2.push(stripData(i));
        });

        if (req.user) {
          User.findById(req.user.id, function(err, user) {
            event2 = getBestBusiness(events2, user.user_history.events2);
            user.user_history.events2.unshift(event2);
            if (user.user_history.events2.length > 10) {
              user.user_history.events2.pop();
            }
            user.save();
          });
        }
        else {
          event2 = getBestBusiness(events2, []);
        }

        // Dinner             
        yelp.search({term: dquery, location: req.body.city}, function(err, dinnerData) {
          dinnerData.businesses.forEach(function(i) {
            dinners.push(stripData(i));
          });

          if (req.user) {
            User.findById(req.user.id, function(err, user) {
              dinner = getBestBusiness(dinners, user.user_history.dinners);
              user.user_history.dinners.unshift(dinner);
              if (user.user_history.dinners.length > 10) {
                user.user_history.dinners.pop();
              }
              user.save();
            });
          }
          else {
            dinner = getBestBusiness(dinners, []);
          }
            
          // Nightlife    
          yelp.search({term: nlquery, location: req.body.city}, function(err, barsData) {
            barsData.businesses.forEach(function(i) {
              nightlives.push(stripData(i));
            });

            if (req.user) {
              User.findById(req.user.id, function(err, user) {
                nightlife = getBestBusiness(nightlives, user.user_history.nightlives);
                user.user_history.nightlives.unshift(nightlife);
                if (user.user_history.nightlives.length > 10) {
                  user.user_history.nightlives.pop();
                }
                user.save();
                res.render('itinerary/itinerary', {
                  searchTerm: req.body.city,
                  title: 'Itinerary',
                  brunchPlace: brunch,
                  eventPlace1: event1,
                  eventPlace2: event2,
                  dinnerPlace: dinner,
                  nightPlace: nightlife,
                });
              });
            }
            else {
              nightlife = getBestBusiness(nightlives, []);
              res.render('itinerary/itinerary', {
                searchTerm: req.body.city.charAt(0).toUpperCase() + req.body.city.slice(1).toLowerCase(),
                title: 'Itinerary',
                brunchPlace: brunch,
                eventPlace1: event1,
                eventPlace2: event2,
                dinnerPlace: dinner,
                nightPlace: nightlife,
              });
            }
          });
        });
      });
    });
  });
}