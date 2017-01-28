var parser = require('./js/pascal.js')
var emitter = require('./js/backend/js.js');

function run(source_id, output_id) {
    console.log('hi there!');
    console.log('id: #' + source_id);
    console.log('id: #' + output_id);

    var object_code = "";
    var raw_emit = function (line) {
        object_code += line + "\n";
    };

    var pascal_source = document.getElementById(source_id).value;
    var ast = parser.parse(pascal_source);
    var e = new emitter.Emitter(raw_emit);
    e.emit(ast);

    // TODO: Special variant of WriteLn that does not write to console.log
    var original = console.log;
    var output = "";    
    console.log = function (line) {
        output += line;
    }

    // Run js object code
    eval(object_code);

    console.log = original;

    document.getElementById(output_id).innerHTML = output;
}

window.demo = { run: run }
