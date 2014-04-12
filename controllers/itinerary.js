/**
 * GET /
 * Itinerary Pages
 */


exports.getItinerary = function(req, res) {
  res.render('itinerary/itinerary', {
    title: 'Itinerary'
  });
};


exports.getDetail = function(req, res) {
  res.render('itinerary/detail', {
    title: 'Detail Page'
  });
};

exports.searchYelp = function(req, res) {
	res.render('itinerary/itinerary', {
		searchTerm: req.body.city,
		title: 'Itinerary'
	});
};