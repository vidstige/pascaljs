{
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
    var variables = {};

    
    // emit std unit
    emit_raw("function WriteLn() { console.log(arguments); }");

    function emit_raw(js) {
      console.log(js);
    }

    function emit(node) {
      for (var i = 0; i < node.statements.length; i++)
      {
        emit_raw(node.statements[i]);
      }
    }

    emit_raw('// Genrated by pascaljs');
  }


program
  = "program" _ identifier ";" _ root:block "."  { emit(root); }

block
  = d:declarations? "begin" _ s:statements _ "end"  { return {'declarations': d, 'statements': s}; }

statements
  = all:(statement ";" _)*  { return nth(all, 0); }

declarations 
  = vars

vars
  = "var" _ var+
  
var
  = variable_name:identifier ":" _ type ";" _

type "type"
  = identifier

statement "statement"
  = procedure_call / assignment

assignment
  = variable_name:identifier _ ":=" _ value:expression { return variable_name + '=' + value + ';' }

procedure_call "procedure call"
  = procedure:identifier _ "(" args:argument_list ")"  { return procedure + '(' + args + ');'; }

argument_list
  = first:argument? rest:("," _ argument)* { return [first].concat(nth(rest, 2)); }

argument "argument"
  = expression

expression "expression"
  = literal / variable

variable "variable"
  = variable_name:identifier 

identifier "identifier"
   = [A-Za-z][A-Za-z0-9]* { return text(); } 

literal "literal"
  = string_literal

string_literal
  = "'" s:[A-Za-z0-9 ]* "'"  { return "'" + to_str(s) + "'"; }

_ "whitespace"
  = [ \t\n\r]* { return '' }