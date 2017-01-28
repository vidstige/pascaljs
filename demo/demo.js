var parser = require('./js/pascal.js')
var emitter = require('./js/backend/js.js');

function run(source_id, output_id) {
    console.log('hi there!');
    console.log('id: #' + source_id);
    console.log('id: #' + output_id);

    var raw_emit = function (line) {
        document.getElementById(output_id).innerHTML += line + '<br/>\n';
    };

    var pascal_source = document.getElementById(source_id).value;
    var ast = parser.parse(pascal_source);
    var e = new emitter.Emitter(raw_emit);
    e.emit(ast);
}

window.demo = { run: run }
