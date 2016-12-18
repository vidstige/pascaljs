// Emits js from pascal ast    

function emit_raw(js) {
  console.log(js);
}

function emit(ast) {
  var node = ast;
  // emit std unit
  emit_raw('// Genrated by pascaljs');
  emit_raw("function WriteLn() { var args = Array.prototype.slice.call(arguments); console.log(args.join('')); }");

  var v = node.declarations.variables;
  if (v) {
    for (var i = 0; i < v.length; i++)
    {
      emit_raw("var " + v[i] + ";");
    }
  }
  var p = node.declarations.procedures;
  if (p) {
    for (var i = 0; i < p.length; i++)
    {
      var flat_args = [];
      for (var j = 0; j < p[i].arguments.length; j++) {
        flat_args = flat_args.concat(p[i].arguments[j]);
      }

      emit_raw("function " + p[i].name + "(" + flat_args.join(',') + ") {");
      if (p[i].ret) {
        emit_raw('var ' + p[i].name + ";");
        emit(p[i].block);
        emit_raw('return ' + p[i].name + ";");
      } else {
        emit(p[i].block);
      }
      emit_raw("}");
    }
  }

  emit_raw('{');
  for (var i = 0; i < node.statements.length; i++)
  {
    emit_raw(node.statements[i]);
  }
  emit_raw('}');
}

module.exports = {
  emit:       emit
};
