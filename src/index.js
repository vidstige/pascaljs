var fs = require('fs');
var parser = require('./pascal.js')

//  __dirname + '/test.txt'
fs.readFile('tests/first.pas', function (err, data) {
  if (err) {
    throw err; 
  }
  //console.log(data.toString());
  parser.parse(data.toString());
});
