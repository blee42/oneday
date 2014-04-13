/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

exports.about = function(req, res) {
  res.render('about', {
    title: 'About Us'
  });
};