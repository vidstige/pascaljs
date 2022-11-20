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
  function flatten(arrays) {
    return Array.prototype.concat.apply([], arrays);
  }
  function createBuiltins() {
    function createBuiltin(name) {
        return {kind: 'builtin', name: name}
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
  // Creates a boxed type of an inner type, if enabled is truthy
  function maybeBox(enable, type) {
    if (enable) {
      return {kind: 'boxed', inner: type};
    }
    return type;
  }
}

start =
  program / unit

program
  = "program" __ name:identifier ";" _ root:construct "."  { return {program: root, name: name}; }

unit
  = "unit" __ name:identifier ";" _ "interface" _ the_interface:interface_part _ "implementation" _ the_implementation:implementation_part _ block:(block / "end") "." _ { return {'unit': {'interface': the_interface, 'implementation': the_implementation}, 'name': name, block: block}; }

uses
  = "uses" _ first:identifier rest:("," _ identifier)* ";" _ { return {uses: [first].concat(nth(rest, 2))}; }

construct
  = d:declarations block:block { return {declarations: d, block: block}; }

statements
  = all:(statement ";" _)*  { return nth(all, 0); }

declarations 
  = declaration_part*

declaration_part
  = uses / types / constants / vars / procedure_declaration / function_declaration

// ASSEMBLER
assembly_block
  = "asm" _ as:assembly_statements _ "end" { return {statement: 'assembly_block', statements: as}; }

assembly_construct
  = d:declarations block:assembly_block { return {declarations: d, block: block}; }

// TODO: the '__registers' symbol should not be in the ast
assembly_register
  = ("ax" / "bx" / "cx" / "dx" / "ds" / "es" / "di" / "si") { return '_system.__registers.' + text(); }

assembly_memory
  = segment:assembly_register ":" "[" assembly_register (operand:("+" / "-") offset:integer_literal)? "]"

assembly_lvalue = assembly_memory / assembly_register / identifier

assembly_expression = assembly_lvalue / assembly_register / integer_literal

newline = '\n' / '\r' '\n'?

assembly_statements = all:(labeled_assembly_statement ";"? _ )*  { return nth(all, 0); }

assembly_label = "@" label:identifier { return label; }

labeled_assembly_statement
  = label:(assembly_label ":" _)? statement:assembly_statement {
    if (label) statement.label = label[0];
    return statement;
  }

assembly_statement
  = "mov" _ target:assembly_lvalue _ "," _ source:assembly_expression { return {mnemonic: 'mov', source: source, target: target}; }
  / "dec" _ target:assembly_lvalue { return {mnemonic: 'dec', target: target}; }
  / "inc" _ target:assembly_lvalue { return {mnemonic: 'inc', target: target}; }
  / "sub" _ target:assembly_lvalue _ "," _ operand:assembly_expression { return {mnemonic: 'sub', target: target, operand: operand}; }
  / "add" _ target:assembly_lvalue _ "," _ operand:assembly_expression { return {mnemonic: 'add', target: target, operand: operand}; }
  / "xor" _ target:assembly_lvalue _ "," _ operand:assembly_expression { return {mnemonic: 'xor', target: target, operand: operand}; }
  / "shr" _ target:assembly_lvalue _ "," _ operand:assembly_expression { return {mnemonic: 'shr', target: target, operand: operand}; }
  / "cmp" _ a:assembly_lvalue _ "," _ b:assembly_expression { return {mnemonic: 'cmp', a: a, b: b}; }
  / "mul" _ operand:assembly_expression { return {mnemonic: 'mul', source: operand, target: 'ax'}; }
  / "push" _ operand:assembly_expression 
  / "pop" _ operand:assembly_expression 
  / "les" _ target:assembly_lvalue _ "," _ source:assembly_expression { return {mnemonic: 'les', target: target, source: source}; }
  / "jne" _ label:assembly_label { return {mnemonic: 'jne', to: label}; }
  / "jnz" _ label:assembly_label { return {mnemonic: 'jnz', to: label}; }
  / "loop" _ label:assembly_label { return {mnemonic: 'loop', to: label}; }
  / "int" _ operand:integer_literal { return {mnemonic: 'int', operand: operand}; }

// direct hex-encoded assembly instructions
inline_assembly = "inline" _ "(" first:integer_literal _ ("/" _ integer_literal)* _ ")" { return {'statement': 'assembly_raw'}; }

// UNIT PARTS
interface_part
  = (uses / types / constants / vars / procedure_header / function_header)*

implementation_part
  = declarations

// PROCEDURE DECLARATION
procedure_header
  = "procedure" _ name:identifier "(" args:argument_list_declaration ")" _ ";" _ { return {name: name, args: args}; }
  / "procedure" _ name:identifier _ ";" _ { return {name: name, args: []}; }

procedure_declaration 
  = head:procedure_header _ construct:construct ";" _ { return {procedure: head.name, arguments: head.args, construct: construct}; }
  / head:procedure_header _ "assembler" _ ";" _ construct:assembly_construct ";" _ { return {procedure: head.name, arguments: head.args, construct: construct}; }

function_header
  = "function" _ name:identifier "(" args:argument_list_declaration ")" _ ":" _ return_type:type ";" _ { return {name: name, args: args, return_type: return_type}; }
  / "function" _ name:identifier _ ":" _ return_type:type _ ";" _ { return {name: name, args: [], return_type: return_type}; }

function_declaration 
  = head:function_header _ construct:construct ";" _ { return {function: head.name, arguments: head.args, construct: construct, return_type: head.return_type}; }
  / head:function_header _ "assembler" _ ";" _ construct:assembly_construct ";" _ { return {function: head.name, arguments: head.args, construct: construct}; }

argument_list_declaration
  = first:argument_declaration? rest:(";" _ argument_declaration)* { return flatten((first ? [first] : []).concat(nth(rest, 2))); }

argument_declaration
  = var_modifier:"var"? _ first:identifier rest:("," _ identifier)* _ ":" _ t:type { return [{name: first, type: maybeBox(var_modifier, t)}].concat(rest.map(function (r) { return {name: r[2], type: maybeBox(var_modifier, t)}; })); }

// types
types
  = "type" _ types:type_declaration+ { return {types: types}; }

type_declaration
  = alias:identifier _ "=" _ the_type:type _ ";" _ { createAlias(alias, the_type); return {alias: alias, type: the_type}; } 


// CONSTANTS
constants
  = "const" _ constants:constant+ { return {constants: constants}; }

// TODO: Use constexpr instead of literal
constant
  = constant_name:identifier _ "=" _ value:const_literal _ ";" _ { return {name: constant_name, value: value, type: null}; }
  / constant_name:identifier _ ":" _ type:type _ "=" _ value:const_literal _ ";" _ { return {name: constant_name, value: value, type: type}; }

// TODO: argument_list should be const
const_literal
  = literal
  / "(" _ values:argument_list _ ")" { return '[' + values + ']'; }
  / "(" _ first:field_literal rest:(";" _ field_literal)* ")" { 
      const fields = [first].concat(nth(rest, 2));
      var result = [];
      for (var i = 0; i < fields.length; i++) {
        const field = fields[i];
        result.push(field.name + ": " + field.value);
      }
      return "{" + result.join(', ') + "}";
    }

field_literal
  = field:identifier _ ":" _ value:literal { return {name: field, value: value}; }

// VARIABLE DECLARATION
vars
  = "var" _ vars:var_declaration+ { return {vars: flatten(vars)}; } 

var_declaration
  = first:identifier rest:("," _ identifier)* ":" _ t:type _ ";" _ { return [{name: first, type: t}].concat(rest.map(function (r) { return {name: r[2], type: t}; })); }


// TODO: Allow const ints for bounds
// TODO: Return proper ast for array types.
type "type"
  = "array" _ "[" low:expression _ ".." _ high:expression _ "]" _ "of" _ type:type { return {kind: 'array', range: {low: low, high: high}, of: type}; }
  / "record" __ members:argument_list_declaration _ ";"? _ "end" { return {kind: 'record', members: members}; }
  / "^" to:type { return {kind: 'pointer', to: to}}
  / type_name:identifier { return findType(type_name); }

// STATEMENTS
statement
  = block / assembly_block / inline_assembly / assignment / if_else / if / case / for / while / repeat / with / procedure_call

block
  = "begin" _ stmts:statements _ "end" { return {statement: 'block', statements: stmts}; }

assignment
  = lvalue:lvalue _ ":=" _ value:expression { return {statement: 'assignment', to: lvalue, from: value}; }

lvalue
  = field_access / array_accesses

field_access
  = lvalue:array_accesses "." field:lvalue { return {expression: 'field_access', lvalue: lvalue, field: field}; }

array_accesses
  = array_access / identifier

array_access
  = lvalue:identifier "[" indexer:expression "]" { return {expression: 'array_access', lvalue: lvalue, indexer: indexer}; }

procedure_call
  = procedure:identifier _ "(" args:argument_list ")"  { return {statement: 'call', target: procedure, arguments: args}; }
  / procedure:identifier { return {statement: 'call', target: procedure, arguments: []}; }

argument_list
  = first:argument? rest:("," _ argument)* { return [first].concat(nth(rest, 2)); }

argument
  = expression

if_else
  = "if" _ e:expression _ "then" _ stmt1:statement _ "else" _ stmt2:statement { return {statement: 'if', condition: e, then: stmt1, else: stmt2}; }

if
  = "if" _ e:expression _ "then" _ stmt:statement { return {statement: 'if', condition: e, then: stmt, else: null}; }

range = 
  low:literal _ ".." _ high:literal { return { low: low, high: high}; }

case_match
  = match:(range / literal) _ ":" _ then:statement _ ";" _ { return {match: match, then: then}; }

case
  = "case" __ variable:identifier __ "of" _ cases:(case_match*) _ otherwise:( "else" _ statements)? "end" { return {statement: 'case', variable: variable, cases: cases}; }

for
  = "for" _ variable:identifier _ ":=" _ start:expression _ direction:("to" / "downto") _ stop:expression _ "do" _ stmt:statement { return {statement: 'for', variable: variable, start: start, stop: stop, direction: direction, do: stmt }; }

while
  = "while" _ condition:expression _ "do" _ stmt:statement { return {statement: 'while', condition: condition, do: stmt }; }

repeat
  = "repeat" _ stmts:statements _ "until" _ condition:expression { return {statement: 'repeat', condition: condition, statements: stmts}; }

with = "with" __ lvalue:lvalue __ "do" __ stmt:statement { return {statement: 'with', lvalue: lvalue, do: stmt}; }

// HERE GOES EXPRESSIONS
function_call "function call"
  = func:identifier _ "(" _ args:argument_list ")"  { return {expression: 'call', func: func, args: args}; }

expression "expression"
  = comparision / or_expr

unary_operator = "not" / "-"

unary
  = operator:unary_operator _ expression:expression { return {expression: 'unary', operator: operator, operand: expression}; }

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
  = unary / primary / nested_expression

nested_expression 
  = "(" _ expression:expression _ ")" { return {expression: 'nested', nested: expression}; }

primary
  = function_call / pointer_to / deref / literal / lvalue

// POINTERS GOES HERE
// Pointers are solved by storing the variable name the pointer is pointing to, then js `eval` is used
// to "derefrence" the pointer.
pointer_to
  = "@" v:identifier { return JSON.stringify({pointer: v}); }

deref
  = ptr:identifier "^" { return "eval(" + ptr + "['pointer']" + ")"; }

keyword
  = "begin" / "end"

identifier "identifier"
   = !keyword [A-Za-z][A-Za-z0-9_]* { return text(); } 

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
