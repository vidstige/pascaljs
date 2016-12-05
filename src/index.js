var fs = require('fs');
var path = require('path');
var parser = require('./pascal.js')

function run(pascal_source) {
    var stdout = '';
    var original = console.log;
    console.log = function (msg) { stdout += msg + "\n"; };
    parser.parse(pascal_source);
    console.log = original;
    return {'stdout': stdout, 'stderr': null};
}

function verify(filepath) {
    var data = fs.readFileSync(filepath, "utf8");
    x = run(data.toString());

    expected_stdout = path.dirname(filepath) + '/expectations/' + path.basename(filepath, '.pas') + ".out";
    if (fs.existsSync(expected_stdout)) {
        var expected = fs.readFileSync(expected_stdout, "utf8");
        if (expected != x.stdout) {
            console.error("Output missmatch! " + filepath);
            console.error("expected:\n" + expected);
            console.error("actual:\n" + x.stdout);
        }
    }
}

function verifyAll() {
    const testFolder = 'tests/';
    files = fs.readdirSync(testFolder); // sync because of console.log capture
    for (var i = 0; i < files.length; i++) {
        var path = testFolder + files[i];
        if (!fs.lstatSync(path).isDirectory())
        {
            console.log(files[i] + "...");
            verify(path);
        }
    }
}
verifyAll();