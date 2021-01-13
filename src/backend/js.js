// Emits js from pascal ast    

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
  this.emit_raw = config.emit_raw || console.log;
  const _symbol_map = {};

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
      return symbol(expression.func) + "(" + expression.args.map(format_expression).join(', ') + ")";
    }
    if (expression.expression == 'nested') {
      return "(" + format_expression(expression.nested) + ")";
    }
    return expression;
  }

  this.emit_statement = function(stmt) {
    switch (stmt.statement) {
      case 'compound':
        this.emit_raw('{');
        this.emit_statements(stmt.statements);
        this.emit_raw('}');
        break;
      case 'call':
        this.emit_raw(symbol(stmt.target) + '(' + stmt.arguments.map(format_expression).join(', ') + ');');
        break;
      case 'assignment':
        this.emit_raw(stmt.to + " = " + format_expression(stmt.from) + ";");
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
    this.emit_node(p.block);
    this.emit_raw("}");
  }

  this.emit_function = function(f) {
    this.emit_raw("function " + f.function + "(" + this.argument_list(f.arguments) + ") {");

    this.emit_variable({'name': f.function, 'type': f.return_type});
    this.emit_node(f.block);
    this.emit_raw('return ' + f.function + ";");

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
        this.emit_procedure(d);
      }
      if (d.function) {
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

  this.emit = function(ast) {
    if (ast.program) {
      // emit std unit
      this.emit_notice();
      this.emit_raw("function WriteLn() { var args = Array.prototype.slice.call(arguments); console.log(args.join('')); }")

      this.emit_node(ast.program);
    } else if (ast.unit) {
      this.emit_notice();
      this.emit_raw("function WriteLn() { var args = Array.prototype.slice.call(arguments); console.log(args.join('')); }")
  
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
