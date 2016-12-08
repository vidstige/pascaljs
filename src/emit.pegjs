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
    emit_raw('// Genrated by pascaljs');
    emit_raw("function WriteLn() { var args = Array.prototype.slice.call(arguments); console.log(args.join('')); }");

    function emit_raw(js) {
      console.log(js);
    }

    function emit(node) {
      var v = node.declarations.variables;
      if (v) {
        for (var i = 0; i < v.length; i++)
        {
          emit_raw("var " + v[i] + ";");
        }
      }

      for (var i = 0; i < node.statements.length; i++)
      {
        emit_raw(node.statements[i]);
      }
    }
  }


program
  = "program" _ identifier ";" _ root:block "."  { emit(root); }

block
  = d:declarations "begin" _ s:statements _ "end" { return {'declarations': d, 'statements': s}; }

statements
  = all:(statement ";" _)*  { return nth(all, 0); }

declarations 
  = procs:procedure_declaration* vars:vars? { return {'procedures': procs, 'variables': vars}; }

// PROCEDURE DECLARATION
procedure_declaration 
  = "procedure" _ proc_name:identifier "(" argument_list_declaration ")" _ ";" _ block ";" _ { return "HI " + proc_name; }

argument_list_declaration
  = first:argument_declaration? rest:("," _ argument_declaration)* { return [first].concat(nth(rest, 2)); }

argument_declaration
  = first:identifier? rest:("," _ identifier)* ":" _ type { [first].concat(nth(rest, 2)); }

// VARIABLE DECLARATION
vars
  = "var" _ vars:var+ { return vars; } 
  
var
  = variable_name:identifier ":" _ type ";" _ { return variable_name; }

type "type"
  = identifier

// STATEMENTS
statement "statement"
  = compound / procedure_call / assignment / if_stmt

compound
  = "begin" _ stmts:statements _ "end" { return '{' + stmts + '}'; }

assignment
  = variable_name:identifier _ ":=" _ value:expression { return variable_name + '=' + value + ';' }

procedure_call "procedure call"
  = procedure:identifier _ "(" args:argument_list ")"  { return procedure + '(' + args + ');'; }

argument_list
  = first:argument? rest:("," _ argument)* { return [first].concat(nth(rest, 2)); }

argument "argument"
  = expression

if_stmt
  = "if" _ e:expression _ "then" _ stmt1:statement _ "else" _ stmt2:statement { return 'if (' + e + ') ' + stmt1 + ' else ' + stmt2 + ';'; }

expression "expression"
  = or_expr
    
// HERE GOES BOOLEAN OPERATIONS
or_expr 
  = first:and_expr rest:( _ "or" _ and_expr )* { return ([first].concat(nth(rest, 3))).join(' || '); }

and_expr
  = first:base_expr rest:( _ "and" _ base_expr )* { return ([first].concat(nth(rest, 3))).join(' && '); }

base_expr
  = primary / "(" _ expression _ ")" { return text(); }

primary
  = literal / variable 

variable "variable"
  = variable_name:identifier 

identifier "identifier"
   = [A-Za-z][A-Za-z0-9]* { return text(); } 

// LITERALS

literal "literal"
  = string_literal / boolean_literal / integer_literal

string_literal
  = "'" [A-Za-z0-9 ,;:]* "'"  { return text(); }

boolean_literal
  = "true" / "false"

integer_literal
  = [0-9]+

_ "whitespace"
  = [ \t\n\r]* { return '' }