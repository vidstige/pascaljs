var fs = require('fs');
var parser = require('./pascal.js')

fs.readFile('tests/first.pas', function (err, data) {
  if (err) {
    throw err; 
  }
  parser.parse(data.toString());
});
