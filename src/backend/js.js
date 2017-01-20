// Emits js from pascal ast    

function emit_raw(js) {
  console.log(js);
}

function emit_statement(stmt) {
  switch (stmt.statement) {
    case 'compound':
      emit_raw('{');
      emit_statements(stmt.statements);
      emit_raw('}');
      break;
    case 'call':
      emit_raw(stmt.target + '(' + stmt.arguments.join(', ') + ');');
      break;
    case 'assignment':
      if (stmt.to.indexer) {
        emit_raw(stmt.to.variable + "[" + stmt.to.indexer + "]" + ' = '  + stmt.from + ";");
      } else if (stmt.to.member) {
        emit_raw(stmt.to.variable + "." + stmt.to.member + ' = '  + stmt.from + ";");
      } else {
        emit_raw(stmt.to.variable + ' = '  + stmt.from + ";");
      }
      break;
    case 'for':
      var update = stmt.direction == "to" ? (stmt.variable+'++') : (stmt.variable+'--');
      var stop_criterion = stmt.direction == "to" ? (stmt.variable + '<=' + stmt.stop ) : (stmt.variable+'>='+stmt.stop);
      emit_raw('for (' + stmt.variable + '=' + stmt.start + '; ' + stop_criterion + '; ' + update + ') {');
      emit_statement(stmt.do);
      emit_raw('}');
      break;
    case 'while':
      emit_raw('while (' + stmt.condition + ")");
      emit_statement(stmt.do);
      break;
    case 'if':
      emit_raw('if (' + stmt.condition + ')');
      emit_statement(stmt.then);
      emit_raw('else');
      emit_statement(stmt.else);
      break;
    default:
      throw "Unknown statement: " + stmt.statement;
  }
}

function emit_statements(statements) {
  for (var i = 0; i < statements.length; i++)
  {
    emit_statement(statements[i]);
  }
}

function argument_list(ast_arguments) {
  return ast_arguments.map(function (arg) { return arg.name; }).join(', ');
}

function initializer_for(type) {
  if (type.kind == 'array') {
    return '[]';
  }
  if (type.kind == 'record') {
    return '{}';
  }
  return 'null';
}

function emit_constants(constants) {
  var c = constants;
  if (c) {
    for (var i = 0; i < c.length; i++)
    {
      emit_raw('const ' + c[i].name + ' = ' + c[i].value + ';');
    }
  }
}

function emit_variables(variables)
{
  var v = variables;
  if (v) {
    for (var i = 0; i < v.length; i++)
    {
      var initializer = initializer_for(v[i].type);
      emit_raw("var " + v[i].name + " = " + initializer + ";" + " // " + v[i].type.name);
    }
  }
}

function emit_procedures(procedures) {
  var p = procedures;
  if (p) {
    for (var i = 0; i < p.length; i++)
    {
      emit_raw("function " + p[i].name + "(" + argument_list(p[i].arguments) + ") {");
      if (p[i].return_type) {
        emit_raw('var ' + p[i].name + ";" + " // returns " + p[i].return_type.name);
        emit_node(p[i].block);
        emit_raw('return ' + p[i].name + ";");
      } else {
        emit_node(p[i].block);
      }
      emit_raw("}");
    }
  }
}

function emit_node(node) {
  emit_constants(node.declarations.constants);
  emit_variables(node.declarations.variables);
  emit_procedures(node.declarations.procedures);

  emit_statements(node.statements);
}

function emit_notice() {
  emit_raw("// Genrated by pascaljs. https://github.com/vidstige/pascaljs");
}

function emit(ast) {
  if (ast.program) {
    // emit std unit
    emit_notice();
    emit_raw("function WriteLn() { var args = Array.prototype.slice.call(arguments); console.log(args.join('')); }")

    emit_node(ast.program);
  } else if (ast.unit) {
    emit_notice();
    
    emit_constants(ast.unit.interface.constants);
    emit_variables(ast.unit.interface.variables);
    //emit_procedures(ast.unit.interface.procedures);
      
    emit_constants(ast.unit.implementation.constants);
    emit_variables(ast.unit.implementation.variables);
    emit_procedures(ast.unit.implementation.procedures);


  } else {
    throw "Unknown AST: " + ast;
  }
}

module.exports = {
  emit:       emit
};
