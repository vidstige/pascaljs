{
    var procedures = {};
    var functions = {};

    // Import builtins
    procedures['WriteLn'] = function (args) { console.log(args) };

    function call_procedure(name) {
        var f = procedures[name];
        if (f) {
            f('dummy args');
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
  = procedure:identifier _ "(" _ literal _ ")"  { call_procedure(procedure.join("")); }

identifier "identifier"
   = [A-Za-z0-9]+ 

literal "literal"
  = string_literal

string_literal
  = "'" [A-Za-z0-9 ]* "'"

_ "whitespace"
  = [ \t\n\r]*