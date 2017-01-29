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
  function buildList(first, rest, n, joiner, join_translation) {
    var results = first ? [first] : [];
    for (var i = 0; i < rest.length; i++) {
      if (joiner) {
        var j = rest[i][joiner];
        if (j in join_translation) {
          results.push(join_translation[j]);
        } else {
          results.push(j);
        }
      }
      results.push(rest[i][n]);
    }
    return results.join(' ');
  }
  function flatten(arrays) {
    return Array.prototype.concat.apply([], arrays);
  }
  function createBuiltins() {
    function createBuiltin(name) {
        return {'kind': 'builtin', 'name': name}
    }
    return {
      'String': createBuiltin('string'), 
      'Boolean': createBuiltin('boolean'),
      'Real': createBuiltin('real'),
      'Integer': createBuiltin('integer'),
      'Byte': createBuiltin('byte'),
      'Word': createBuiltin('word')};
  }
  var types = createBuiltins();

  function createAlias(alias, type) {
    types[alias] = type;
  }
  function findType(type_name) {
    if (type_name in types) {
      return types[type_name];
    }
    error('Unknown type "' + type_name + '"');
  }
}

start =
  program / unit

program
  = "program" _ name:identifier ";" _ root:block "."  { return {'program': root, 'name': name}; }

unit
  = "unit" _ name:identifier ";" _ "interface" _ the_interface:interface_part _ "implementation" _ the_implementation:implementation_part _ "end" "." { return {'unit': {'interface': the_interface, 'implementation': the_implementation}, 'name': name}; }

block
  = d:declarations "begin" _ s:statements _ "end" { return {'declarations': d, 'statements': s}; }

statements
  = all:(statement ";" _)*  { return nth(all, 0); }

declarations 
  = declaration_part*

declaration_part
  = types / constants / vars / procedure_declaration / function_declaration

// UNIT PARTS
interface_part
//  = types:types? constants:constants? procs:(procedure_header / function_header)* { return {'types': types, 'constants': constants, 'procedures': procs}; }
  = (types / constants / vars / procedure_header / function_header)*

implementation_part
  = declarations

// PROCEDURE DECLARATION
procedure_header
  = "procedure" _ name:identifier "(" args:argument_list_declaration ")" _ ";" { return {'name': name, 'args': args}; }

procedure_declaration 
  = head:procedure_header _ block:block ";" _ { return {'procedure': head.name, 'arguments': head.args, 'block': block, 'ret': false}; }

function_header
  = "function" _ name:identifier "(" args:argument_list_declaration ")" _ ":" _ return_type:type ";" { return {'name': name, 'args': args, 'return_type': return_type}; }

function_declaration 
  = head:function_header _ block:block ";" _ { return {'function': head.name, 'arguments': head.args, 'block': block, 'return_type': head.return_type}; }

argument_list_declaration
  = first:argument_declaration? rest:(";" _ argument_declaration)* { return flatten((first ? [first] : []).concat(nth(rest, 2))); }

argument_declaration
  = first:identifier rest:("," _ identifier)* ":" _ t:type { return [{'name': first, 'type': t}].concat(rest.map(function (r) { return {'name': r[2], 'type': t}; })); }

// types
types
  = "type" _ types:type_declaration+ { return {'types': types}; }

type_declaration
  = alias:identifier _ "=" _ the_type:type _ ";" _ { createAlias(alias, the_type); return {'alias': alias, 'type': the_type}; } 


// CONSTANTS
constants
  = "const" _ constants:constant+ { return {'constants': constants}; }

// TODO: Use constexpr instead of literal
constant
  = constant_name:identifier _ "=" _ value:literal _ ";" _ { return {'name':constant_name, 'value': value}; }


// VARIABLE DECLARATION
vars
  = "var" _ vars:var+ { return {'vars': vars}; } 
  
// TODO: Reuse argument_declaration
var
  = variable_name:identifier ":" _ type:type ";" _ { return {'name': variable_name, 'type': type}; }

// TODO: Allow const ints for bounds
// TODO: Return proper ast for array types.
type "type"
  = "array" _ "[" low:integer_literal _ ".." _ high:integer_literal _ "]" _ "of" _ of:type { return {'kind': 'array', 'range': {'low': low, 'high': high}, 'of': of}; }
  / "record" _ members:argument_list_declaration _ "end" { return {'kind': 'record', 'members': members}; }
  / "^" to:type { return {'kind': 'pointer', 'to': to}}
  / type_name:identifier { return findType(type_name); }

// STATEMENTS
statement
  = compound / procedure_call / assignment / if_stmt / for / while

compound
  = "begin" _ stmts:statements _ "end" { return {'statement': 'compound', 'statements': stmts}; }

assignment
  = lvalue:lvalue _ ":=" _ value:expression { return {'statement': 'assignment', 'to': lvalue, 'from': value}; }

lvalue
  = variable:identifier _ "[" _ indexer:expression _ "]" { return {'variable': variable, 'indexer': indexer}; }
  / variable:identifier "." member:identifier { return {'variable': variable, 'member': member}; }
  / variable:identifier { return {'variable': variable}; }

procedure_call
  = procedure:identifier _ "(" args:argument_list ")"  { return {'statement': 'call', 'target': procedure, 'arguments': args}; }

argument_list
  = first:argument? rest:("," _ argument)* { return [first].concat(nth(rest, 2)); }

argument
  = expression

if_stmt
  = "if" _ e:expression _ "then" _ stmt1:statement _ "else" _ stmt2:statement { return {'statement': 'if', 'condition': e, 'then': stmt1, 'else': stmt2}; }

for
  = "for" _ variable:identifier _ ":=" _ start:expression _ direction:("to" / "downto") _ stop:expression _ "do" _ stmt:statement { return {'statement': 'for', 'variable': variable, 'start': start, 'stop': stop, 'direction': direction, 'do': stmt }; }

while
  = "while" _ condition:expression _ "do" _ stmt:statement { return {'statement': 'while', 'condition': condition, 'do': stmt }; }

// HERE GOES EXPRESSIONS
function_call "function call"
  = func:identifier _ "(" args:argument_list ")"  { return func + '(' + args + ')'; }

expression "expression"
  = comparision / or_expr

comparision
  = a:or_expr _ "=" _ b:or_expr { return [a, '==', b].join(''); }
  / a:or_expr _ "<>" _ b:or_expr { return [a, '!=', b].join(''); }
  / a:or_expr _ ">=" _ b:or_expr { return [a, '>=', b].join(''); }
  / a:or_expr _ "<=" _ b:or_expr { return [a, '<=', b].join(''); }
  / a:or_expr _ ">" _ b:or_expr { return [a, '>', b].join(''); }
  / a:or_expr _ "<" _ b:or_expr { return [a, '<', b].join(''); }

or_expr 
  = first:and_expr rest:( _ ("or" / "+" / "-") _ and_expr )* { return buildList(first, rest, 3,  1, {'or': '||'}); }

and_expr
  = first:base_expr rest:( _ ("and" / "*" / "/" / "div" / "mod") _ base_expr )* { return buildList(first, rest, 3,  1, {'and': '&&', 'div': '/', 'mod': '%'}); }

base_expr
  = primary / "(" _ expression _ ")" { return text(); }

primary
  = function_call / pointer_to / deref / array_access / record_access / literal / variable

// POINTERS GOES HERE
// Pointers are solved by storing the variable name the pointer is pointing to, then js `eval` is used
// to "derefrence" the pointer.
pointer_to
  = "@" v:identifier { return JSON.stringify({'pointer': v}); }

deref
  = ptr:identifier "^" { return "eval(" + ptr + "['pointer']" + ")"; }

array_access
  = variable _ "[" _ expression _ "]" { return text(); }

record_access
  = variable "." identifier { return text(); }

variable "variable"
  = variable_name:identifier 

identifier "identifier"
   = [A-Za-z][A-Za-z0-9]* { return text(); } 

// LITERALS

literal "literal"
  = string_literal / boolean_literal / real_literal / integer_literal

string_literal
  = "'" string_character* "'"  { return text(); }

string_character
  = !("'") .

boolean_literal
  = "true" / "false"

integer_literal
  = [0-9]+ { return text(); }

real_literal
  = [0-9]+ "." [0-9]+ { return text; }

comment
  = "{" comment_character* "}"

comment_character
  = !("}") .

_ "whitespace"
  = (comment / [ \t\n\r])* { return null; }
