var fs = require('fs');
var path = require('path');
var emitter = require('./emit.js')

var filepath = process.argv[2];
var pascal_source = fs.readFileSync(filepath, "utf8");

emitter.parse(pascal_source);
