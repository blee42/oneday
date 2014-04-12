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

    if (req.user) {
      User.findById(req.user.id, function(err, user) {
        brunch = getBestBusiness(brunches, user.user_history.brunches);
        user.user_history.brunches.unshift(brunch);
        user.save();
      });
    }
    else {
      brunch = getBestBusiness(brunches, []);
    }

    // Event ("outdoors")
    yelp.search({term:"park or zoo or hike", location: req.body.city}, function(err, eventsData) {
      eventsData.businesses.forEach(function(i) {
        events1.push(stripData(i));
      });

      if (req.user) {
        User.findById(req.user.id, function(err, user) {
          event1 = getBestBusiness(events1, user.user_history.events1);
          user.user_history.events1.unshift(event1);
          user.save();
        });
      }
      else {
        event1 = getBestBusiness(events1, []);
      }

      // Event ("indoors")
      yelp.search({term:"museum or landmark", location: req.body.city}, function(err, eventsData) {
      eventsData.businesses.forEach(function(i) {
        events2.push(stripData(i));
      });

        if (req.user) {
          User.findById(req.user.id, function(err, user) {
            event2 = getBestBusiness(events2, user.user_history.events2);
            user.user_history.events2.unshift(event2);
            user.save();
          });
        }
        else {
          event2 = getBestBusiness(events2, []);
        }

        // Dinner             
        yelp.search({term:"dinner", location: req.body.city}, function(err, dinnerData) {
          dinnerData.businesses.forEach(function(i) {
            dinners.push(stripData(i));
          });

          if (req.user) {
            User.findById(req.user.id, function(err, user) {
              dinner = getBestBusiness(dinners, user.user_history.dinners);
              user.user_history.dinners.unshift(dinner);
              user.save();
            });
          }
          else {
            dinner = getBestBusiness(dinners, []);
          }
            
          // Nightlife    
          yelp.search({term:"nightlife or pub or bar or club or lounge", location: req.body.city}, function(err, barsData) {
            barsData.businesses.forEach(function(i) {
              nightlives.push(stripData(i));
            });

            if (req.user) {
              User.findById(req.user.id, function(err, user) {
                nightlife = getBestBusiness(nightlives, user.user_history.nightlives);
                user.user_history.nightlives.unshift(nightlife);
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