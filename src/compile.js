var fs = require('fs');
var path = require('path');
var emitter = require('./emit.js')

var filepath = process.argv[2];
var pascal_source = fs.readFileSync(filepath, "utf8");

try {
    emitter.parse(pascal_source);
} catch (e) {
    console.error(e);
    process.exit(-1);
} 
