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
      'Word': createBuiltin('word'),
      'Procedure': createBuiltin('procedure')};
  }
  var types = createBuiltins();

  function createAlias(alias, type) {
    type.name = alias;
    types[alias] = type;
  }
  function findType(type_name) {
    if (type_name in types) {
      return types[type_name];
    }
    return {kind: 'forward', name: type_name};
  }
}

start =
  program / unit

program
  = "program" __ name:identifier ";" _ root:block "."  { return {'program': root, 'name': name}; }

unit
  = "unit" __ name:identifier ";" _ "interface" _ the_interface:interface_part _ "implementation" _ the_implementation:implementation_part _ "end" "." { return {'unit': {'interface': the_interface, 'implementation': the_implementation}, 'name': name}; }

uses
  = "uses" _ first:identifier rest:("," _ identifier)* ";" _ { return {'uses': [first].concat(nth(rest, 2))}; }

block
  = d:declarations "begin" _ s:statements _ "end" { return {'declarations': d, 'statements': s}; }

statements
  = all:(statement ";" _)*  { return nth(all, 0); }

declarations 
  = declaration_part*

declaration_part
  = uses / types / constants / vars / procedure_declaration / function_declaration

// UNIT PARTS
interface_part
  = (uses / types / constants / vars / procedure_header / function_header)*

implementation_part
  = declarations

// PROCEDURE DECLARATION
procedure_header
  = "procedure" _ name:identifier "(" args:argument_list_declaration ")" _ ";" _ { return {'name': name, 'args': args}; }

procedure_declaration 
  = head:procedure_header _ block:block ";" _ { return {'procedure': head.name, 'arguments': head.args, 'block': block, 'ret': false}; }

function_header
  = "function" _ name:identifier "(" args:argument_list_declaration ")" _ ":" _ return_type:type ";" _ { return {'name': name, 'args': args, 'return_type': return_type}; }

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
  = constant_name:identifier _ "=" _ value:const_literal _ ";" _ { return {'name':constant_name, 'value': value, 'type': null}; }
  / constant_name:identifier _ ":" _ type:type _ "=" _ value:const_literal _ ";" _ { return {'name':constant_name, 'value': value, 'type': type}; }

// TODO: argument_list should be const
const_literal
  = literal
  / "(" _ values:argument_list _ ")" { return '[' + values + ']'; }

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
  / "record" __ members:argument_list_declaration _ ";"? _ "end" { return {'kind': 'record', 'members': members}; }
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
  = field_access { return text(); }

field_access
  = (array_access "." lvalue) / array_access { return text(); }

array_access
  = (identifier "[" expression "]") / identifier { return text(); }

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
  = func:identifier _ "(" args:argument_list ")"  { return {expression: 'call', func: func, args: args}; }

expression "expression"
  = comparision / or_expr

comparision
  = a:or_expr _ "=" _ b:or_expr { return {expression: 'binary', operator: '==', lhs: a, rhs: b}; }
  / a:or_expr _ "<>" _ b:or_expr { return {expression: 'binary', operator: '!=', lhs: a, rhs: b}; }
  / a:or_expr _ ">=" _ b:or_expr { return {expression: 'binary', operator: '>=', lhs: a, rhs: b}; }
  / a:or_expr _ "<=" _ b:or_expr { return {expression: 'binary', operator: '<=', lhs: a, rhs: b}; }
  / a:or_expr _ ">" _ b:or_expr { return {expression: 'binary', operator: '>', lhs: a, rhs: b}; }
  / a:or_expr _ "<" _ b:or_expr { return {expression: 'binary', operator: '<', lhs: a, rhs: b}; }

or_binary
  = lhs:and_expr _ operator:("or" / "+" / "-") _ rhs:or_expr { return {expression: 'binary', operator: operator, lhs: lhs, rhs: rhs}; }

or_expr
  = or_binary / and_expr

and_binary
  = lhs:base_expr _ operator:("and" / "*" / "/" / "div" / "mod") _ rhs:and_expr { return {expression: 'binary', operator: operator, lhs: lhs, rhs: rhs}; }

and_expr
  = and_binary / base_expr

base_expr
  = primary / nested_expression

nested_expression 
  = "(" _ expression:expression _ ")" { return {expression: 'nested', nested: expression}; }

// TODO: Workaround
field_access2 = field_access { return text(); }

primary
  = function_call / pointer_to / deref / literal / field_access2

// POINTERS GOES HERE
// Pointers are solved by storing the variable name the pointer is pointing to, then js `eval` is used
// to "derefrence" the pointer.
pointer_to
  = "@" v:identifier { return JSON.stringify({'pointer': v}); }

deref
  = ptr:identifier "^" { return "eval(" + ptr + "['pointer']" + ")"; }

identifier "identifier"
   = [A-Za-z][A-Za-z0-9_]* { return text(); } 

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
  = "$" hex:[0-9A-Fa-f]+ { return '0x' + hex.join(''); }
  / [0-9]+ { return text(); }

real_literal
  = [0-9]+ "." [0-9]+ { return text(); }

comment
  = "{" comment_character* "}"

comment_character
  = !("}") .

_ "whitespace"
  = (comment / [ \t\n\r])* { return null; }

__ "whitespace"
  = (comment / [ \t\n\r])+ { return null; }
