var fs = require('fs');
var parser = require('./pascal.js')

function verify(filename) {
    fs.readFile(filename, function (err, data) {
        if (err) {
            throw err; 
        }
        parser.parse(data.toString());
    });
}

const testFolder = 'tests/';
fs.readdir(testFolder, (err, files) => {
  if (err) {
      throw err;
  }
  files.forEach(file => {
    console.log(file + "...");
    verify(testFolder + file);
  });
})

