var yelp = require("yelp").createClient({
  consumer_key: "Rf7uNnk2hIixyx_y_DPFvQ", 
  consumer_secret: "BTNoPKfX7FKlz_I1nv1zYwIwzvQ",
  token: "yVdpRN18qZlv3sz8PHr8MaivhJXlCTxW",
  token_secret: "zKkZVANtIqZYyy3WGBtaTtkrLMA"
});

// businesses:
//  - id
//  - name
//  - location
//  - lat/lon
//  - review_count
//  - rating

var visited_businesses = [];

function getNewBusiness(terms, location) {
	yelp.search({term: terms, location: location}, function(err, data) {
		var business_list = [];
		data.businesses.forEach(function(i) {
			business_list.push(stripData(i));
		});
		visited_businesses.push(getBestBusiness(business_list, visited_businesses));
		console.log(getBestBusiness(business_list, visited_businesses));
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