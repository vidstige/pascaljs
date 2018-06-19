var parser = require('../src/pascal.js')
var emitter = require('../src/backend/js.js');

function run(pascal_source, output_id) {
  try {
    var object_code = "";
    var raw_emit = function (line) {
        object_code += line + "\n";
    };

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

    const element = document.getElementById(output_id);
    element.classList.remove("error");
    console.log(output);
    element.innerHTML = output;
  } catch (e) {
    if (e instanceof(parser.SyntaxError)) {
        // specific error
        const element = document.getElementById(output_id);
        element.innerHTML = e.message;
        element.classList.add("error");
        console.error(e);
    } else {
      throw e;
    }
  }
}

window.demo = { run: run }
