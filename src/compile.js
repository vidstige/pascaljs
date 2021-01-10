var fs = require('fs');
var parser = require('./pascal.js')
var emitter = require('./backend/js.js');

function repeat(str, n) {
    return Array(n + 1).join(str);
}

var filepath = process.argv[2];
var pascal_source = fs.readFileSync(filepath, "utf8");

try {
    var ast = parser.parse(pascal_source);
    var e = new emitter.Emitter({unit_search_paths: ['build']});
    e.emit(ast);
} catch (e) {
    if (e instanceof(parser.SyntaxError)) {
        console.error(e.message);
        var location = e.location;
        var lines = pascal_source.split(/\r?\n/);
        if (location.start.line == location.end.line) {
            console.error(lines[location.start.line - 1]);
            console.error(repeat(' ', location.start.column - 1) + repeat('^', location.end.column - location.start.column));
        } else {
            console.error("multiline error not supported");
        }
    } else {
        console.error(e);
        throw e;
    }
    
    process.exit(-1);
} 
