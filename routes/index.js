var express = require('express');
var router = express.Router();

/* Redirect to books. */
router.get('/', function(req, res){
  res.redirect('/books');
});

/* GET generated error route - create and throw 500 server error */
router.get('/error', (req, res, next) => {

  // Log out custom error handler indication
  console.log('Custom error route called');

  const err = new Error();
  err.message = `Custom 500 error thrown`
  err.status = 500;
  throw err;
});



module.exports = router;
