// Emits js from pascal ast    

function Emitter(emit_raw) {
  this.emit_raw = emit_raw || console.log;
  
  this.emit_statement = function(stmt) {
    switch (stmt.statement) {
      case 'compound':
        this.emit_raw('{');
        this.emit_statements(stmt.statements);
        this.emit_raw('}');
        break;
      case 'call':
        this.emit_raw(stmt.target + '(' + stmt.arguments.join(', ') + ');');
        break;
      case 'assignment':
        if (stmt.to.indexer) {
          this.emit_raw(stmt.to.variable + "[" + stmt.to.indexer + "]" + ' = '  + stmt.from + ";");
        } else if (stmt.to.member) {
          this.emit_raw(stmt.to.variable + "." + stmt.to.member + ' = '  + stmt.from + ";");
        } else {
          this.emit_raw(stmt.to.variable + ' = '  + stmt.from + ";");
        }
        break;
      case 'for':
        var update = stmt.direction == "to" ? (stmt.variable+'++') : (stmt.variable+'--');
        var stop_criterion = stmt.direction == "to" ? (stmt.variable + '<=' + stmt.stop ) : (stmt.variable+'>='+stmt.stop);
        this.emit_raw('for (' + stmt.variable + '=' + stmt.start + '; ' + stop_criterion + '; ' + update + ') {');
        this.emit_statement(stmt.do);
        this.emit_raw('}');
        break;
      case 'while':
        this.emit_raw('while (' + stmt.condition + ")");
        this.emit_statement(stmt.do);
        break;
      case 'if':
        this.emit_raw('if (' + stmt.condition + ')');
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

  this.initializer_for = function(type) {
    if (type.kind == 'array') {
      return '[]';
    }
    if (type.kind == 'record') {
      return '{}';
    }
    return 'null';
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

  this.emit_variables = function(variables)
  {
    var v = variables;
    if (v) {
      for (var i = 0; i < v.length; i++)
      {
        var initializer = this.initializer_for(v[i].type);
        this.emit_raw("var " + v[i].name + " = " + initializer + ";" + " // " + v[i].type.name);
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

    this.emit_raw('var ' + f.function + ";" + " // returns " + f.return_type.name);
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

  this.emit_declarations = function(declarations) {
    //emit_raw('// ' + JSON.stringify(node.declarations));
    for (var i = 0; i < declarations.length; i++) {
      var d = declarations[i];
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

  this.emit = function(ast) {
    if (ast.program) {
      // emit std unit
      this.emit_notice();
      this.emit_raw("function WriteLn() { var args = Array.prototype.slice.call(arguments); console.log(args.join('')); }")

      this.emit_node(ast.program);
    } else if (ast.unit) {
      this.emit_notice();
      
      this.emit_declarations(ast.unit.interface);
      this.emit_declarations(ast.unit.implementation);

      // TODO: Export interface functions, constants, and vars
      // TODO: ...and double check functions are also in implementation

    } else {
      throw "Unknown AST: " + ast;
    }
  }
}

module.exports = {
  Emitter: Emitter
};
