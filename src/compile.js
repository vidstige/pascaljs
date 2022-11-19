import { readFileSync } from 'fs';
import { parse, SyntaxError } from './pascal.js';
import { Emitter } from './backend/js.js';

var filepath = process.argv[2];
var pascal_source = readFileSync(filepath, "utf8");

function blanks(line, n) {
    // replaces all characters except tabs with space. Useful for printing errors arrows
    return Array.from(line).slice(0, n).map(c => c == '\t' ? '\t' : ' ').join('');
}

try {
    var ast = parse(pascal_source);
    var e = new Emitter({});
    await e.emit(ast);
} catch (e) {
    if (e instanceof(SyntaxError)) {
        console.error(e.message);
        var location = e.location;
        var lines = pascal_source.split(/\r?\n/);
        if (location.start.line == location.end.line) {
            const line = lines[location.start.line - 1];
            console.error(line);
            console.error(blanks(line, location.start.column - 1) + '^'.repeat(location.end.column - location.start.column));
        } else {
            console.error(' '.repeat(location.start.column - 1) + '↓')
            for (var i = location.start.line - 1; i < location.end.line - 1; i++) {
                console.error(lines[i]);
            }
            console.error(' '.repeat(location.end.column - 1) + '↑')
        }
    } else {
        console.error(e);
        throw e;
    }
    
    process.exit(-1);
} 
