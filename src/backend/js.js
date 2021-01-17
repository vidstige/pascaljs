// Emits js from pascal ast    
const fs = require('fs');

function initializer_for(type) {
  if (type.kind == 'array') {
    if (type.of.kind == "record") {
      // TODO: Just always use high. Don't compress arrays starting
      // after 0.
      const n = type.range.high;
      return 'Array(' + n + ').fill(' + initializer_for(type.of) + ')';
    }
    return '[]';
  }
  if (type.kind == 'record') {
    var tmp = [];
    for (var i = 0; i < type.members.length; i++) {
      const member = type.members[i];
      const initializer = initializer_for(member.type);
      if (initializer !== null) {
        tmp.push('"' + member.name + '": ' + initializer);
      }
    }
    return '{' + tmp.join(', ') + '}';
  }
  return null;
}

function Emitter(config) {
  var indentation = 0;
  this._emit_raw = function(line) {
    console.log('  '.repeat(indentation) + line);
  };
  this.emit_raw = config.emit_raw || this._emit_raw;  
  const _symbol_map = {};
  const _function_map = {};

  const callables = {};

  const unit_search_paths = config.unit_search_paths || [];
  for (var i = 0; i < unit_search_paths.length; i++) {
    const path = unit_search_paths[i];
    if (!(path in module.paths)) {
      module.paths.push(path);
    }
  }
  
  function symbol(identifier) {
    if (identifier in _symbol_map) {
      return _symbol_map[identifier];
    }
    return identifier;
  }
  function function_symbol(identifier) {
    if (identifier in _function_map) {
      return _function_map[identifier];
    }
    return identifier;
  }

  function format_operator(operator) {
    switch (operator) {
      case 'mod': return '%';
      case 'or': return '||';
      case 'and': return '&&';
    }
    return operator;
  }

  function format_expression(expression) {
    if (expression === null) return 'null';

    if (expression.expression == 'binary') {
      return format_expression(expression.lhs) + ' ' + format_operator(expression.operator) + ' ' + format_expression(expression.rhs);
    }
    if (expression.expression == 'call') {
      return function_symbol(expression.func) + "(" + expression.args.map(format_expression).join(', ') + ")";
    }
    if (expression.expression == 'nested') {
      return "(" + format_expression(expression.nested) + ")";
    }
    if (expression.expression == 'field_access') {
      return format_expression(expression.lvalue) + '.' + format_expression(expression.field);
    }
    if (expression.expression == 'array_access') {
      return format_expression(expression.lvalue) + '[' + format_expression(expression.indexer) + ']';
    }
    return symbol(expression);
  }

  this.emit_statement = function(stmt) {
    switch (stmt.statement) {
      case 'compound':
        this.emit_raw('{'); indentation++;
        this.emit_statements(stmt.statements);
        indentation--;
        this.emit_raw('}');
        break;
      case 'call':
        // Find boxes
        const f = callables[stmt.target];
        const boxes = [];
        const unboxes = [];
        const args = [];
        stmt.arguments.map(function(argument, i) {
          const parameter = f ? f.arguments[i] : null;
          const expression = format_expression(argument);
          if (parameter && parameter.type.kind == 'boxed') {
            boxes.push(parameter.name + ': {value: ' + expression + '}');
            unboxes.push(expression + ' = _boxes.' + parameter.name + '.value;');
            args.push('_boxes.' + parameter.name);
          } else {
            args.push(expression);
          }
        });
        if (boxes.length > 0) {
          this.emit_raw('const _boxes = {' + boxes.join(', ') + '};');
          // replace assignments to variable inside function
          this.emit_raw(function_symbol(stmt.target) + '(' + args.join(', ') + ');');
          for (var i = 0; i < unboxes.length; i++) {
            this.emit_raw(unboxes[i]);
          }
        } else {
          // No boxing needed (no "var" arguments)
          this.emit_raw(function_symbol(stmt.target) + '(' + args.join(', ') + ');');
        }
        break;
      case 'assignment':
        this.emit_raw(format_expression(stmt.to) + " = " + format_expression(stmt.from, _symbol_map) + ";");
        break;
      case 'for':
        var update = stmt.direction == "to" ? (stmt.variable+'++') : (stmt.variable+'--');
        var stop_criterion = stmt.direction == "to" ? (stmt.variable + '<=' + format_expression(stmt.stop)) : (stmt.variable+'>=' + format_expression(stmt.stop));
        this.emit_raw('for (' + stmt.variable + '=' + stmt.start + '; ' + stop_criterion + '; ' + update + ')');
        this.emit_statement(stmt.do);
        break;
      case 'while':
        this.emit_raw('while (' + format_expression(stmt.condition) + ")");
        this.emit_statement(stmt.do);
        break;
      case 'if':
        this.emit_raw('if (' + format_expression(stmt.condition) + ')');
        this.emit_statement(stmt.then);
        this.emit_raw('else');
        this.emit_statement(stmt.else);
        break;
      default:
        throw "Unknown statement: " + stmt.statement;
    }
  }

  this.emit_statements = function(statements) {
    for (var i = 0; i < statements.length; i++)
    {
      this.emit_statement(statements[i]);
    }
  }

  this.argument_list = function(ast_arguments) {
    return ast_arguments.map(function (arg) { return arg.name; }).join(', ');
  }

  this.emit_constants = function(constants) {
    var c = constants;
    if (c) {
      for (var i = 0; i < c.length; i++)
      {
        this.emit_raw('const ' + c[i].name + ' = ' + c[i].value + ';');
      }
    }
  }

  this.emit_variable = function(variable) {
    var initializer = initializer_for(variable.type);
    this.emit_raw("var " + variable.name + " = " + initializer + ";" + " // " + variable.type.name);
  }

  this.emit_variables = function(variables) {
    if (variables) {
      for (var i = 0; i < variables.length; i++)
      {
        this.emit_variable(variables[i])
      }
    }
  }

  this.emit_procedure = function(p) {
    this.emit_raw("function " + p.procedure + "(" + this.argument_list(p.arguments) + ") {");
    indentation++;
    const rm = [];
    for (var i = 0; i < p.arguments.length; i++) {
      const argument = p.arguments[i];
      if (argument.type.kind == 'boxed') {
        _symbol_map[argument.name] = argument.name + '.value';
        rm.push(argument.name);
      }
    }
    this.emit_node(p.block);
    for (var i = 0; i < rm.length; i++) {
      delete _symbol_map[rm[i]];
    }
    indentation--;
    this.emit_raw("}");
  }

  this.emit_function = function(f) {
    this.emit_raw("function " + f.function + "(" + this.argument_list(f.arguments) + ") {");
    indentation++;
    const result_name = '_result';
    this.emit_variable({'name': result_name, 'type': f.return_type});
    _symbol_map[f.function] = result_name;
    this.emit_node(f.block);
    delete _symbol_map[f.function];
    this.emit_raw('return ' + result_name + ";");
    
    indentation--;
    this.emit_raw("}");
  }

  this.emit_procedures = function(procedures) {
    var p = procedures;
    if (p) {
      for (var i = 0; i < p.length; i++)
      {
        this.emit_procedure(p[i]);
      }
    }
  }

  this.emit_uses = function(node) {
    for (var i = 0; i < node.length; i++) {
      const unit_name = node[i];
      const module = require(unit_name);
      this.emit_raw("const " + unit_name + " = require('" + unit_name + "');");
      for (var key in module) {
        if (module.hasOwnProperty(key)) {
          _symbol_map[key] = unit_name + '.' + key;
          _function_map[key] = unit_name + '.' + key;
        }
      }
    }
  }

  this.emit_declarations = function(declarations) {
    for (var i = 0; i < declarations.length; i++) {
      var d = declarations[i];
      if (d.uses) {
        this.emit_uses(d.uses);
      }
      if (d.procedure) {
        callables[d.procedure] = {procedure: d.procedure, arguments: d.arguments};
        this.emit_procedure(d);
      }
      if (d.function) {
        callables[d.function] = {function: d.function, arguments: d.arguments};
        this.emit_function(d);
      }
      if (d.constants) {
        this.emit_constants(d.constants);
      }
      if (d.vars) {
        this.emit_variables(d.vars);
      }
    }
  }

  this.emit_node = function(node) {
    this.emit_declarations(node.declarations);
    this.emit_statements(node.statements);
  }

  this.emit_notice = function() {
    this.emit_raw("// Genrated by pascaljs. https://github.com/vidstige/pascaljs");
  }
  
  this.emit_export = function(interface) {
    // TODO: Export constants and vars
    // TODO: Export types. As `_types` perhaps?
    var tmp = [];
    for (var i = 0; i < interface.length; i++) {
      if (interface[i].name) { // callable
        const name = interface[i].name;
        tmp.push(name + ': ' + name);
      }
    }
    this.emit_raw('module.exports = {' + tmp.join(', ') + "};");
  }

  this.emit_stdlib = function() {
    const stdlib = fs.readFileSync('./src/backend/_system.js');
    this.emit_raw(stdlib);
  }

  this.emit = function(ast) {
    if (ast.program) {
      // emit std unit
      this.emit_notice();
      this.emit_stdlib();
      this.emit_node(ast.program);
    } else if (ast.unit) {
      this.emit_notice();
      this.emit_stdlib();
  
      this.emit_declarations(ast.unit.interface);
      this.emit_declarations(ast.unit.implementation);

      this.emit_export(ast.unit.interface);
    } else {
      throw "Unknown AST: " + ast;
    }
  }
}

module.exports = {
  Emitter: Emitter
};
