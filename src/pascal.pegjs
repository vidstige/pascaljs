{
    // --- std unit ----
    function writeln(args) {
        console.log(args.join(''));
    }

    // --- Utils -------
    function to_str(x) {
        return x.join('');
    }
    function nth(arr, n) {
        var results = [];
        for (var i = 0; i < arr.length; i++) {
            results.push(arr[i][n]);
        }
        return results;
    }

    var procedures = {};
    var functions = {};

    // Import builtins
    procedures['WriteLn'] = writeln;

    function call_procedure(name, args) {
        var f = procedures[name];
        if (f) {
            f(args);
        } else {
            throw "No such procedure " + name;
        }
    }
}


program
  = "program" _ identifier ";" _ block "."

block
  = "begin" _ statement* _ "end"

statement "statement"
  = procedure_call ";" _

procedure_call "procedure call"
  = procedure:identifier _ "(" args:argument_list ")"  { call_procedure(to_str(procedure), args); }

argument_list
  = first:argument? rest:("," _ argument)* { return [first].concat(nth(rest, 2)); }

argument "argument"
  = expression

expression "expression"
  = literal

identifier "identifier"
   = [A-Za-z0-9]+ 

literal "literal"
  = string_literal

string_literal
  = "'" s:[A-Za-z0-9 ]* "'"  { return to_str(s); }

_ "whitespace"
  = [ \t\n\r]* { return '' }