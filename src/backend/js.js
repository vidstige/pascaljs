// Emits js from pascal ast    
import { readFileSync, copyFileSync } from 'fs';
import { reduceControlFlow } from './assembler.js';

function stack_push(stack, top) {
  stack.push(top || {});
}
function stack_pop(stack) {
  return stack.splice(-1, 1); // pop last element
}
function stack_insert(stack, key, value) {
  const scope = stack[stack.length - 1];
  scope[key] = value;
}
function find(stack, key, missing) {
  for (var i = stack.length - 1; i >= 0; i--) {
    const scope = stack[i];
    if (key in scope) {
      return scope[key];
    }
  }
  return missing;
}

function format_operator(operator) {
  switch (operator) {
    case 'mod': return '%';
    case 'or': return '||';
    case 'and': return '&&';
    case 'not': return '!';
  }
  //throw "Unknown operator: " + operator;
  return operator;
}

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
    for (var member of type.members) {
      const initializer = initializer_for(member.type);
      if (initializer !== null) {
        tmp.push('"' + member.name + '": ' + initializer);
      }
    }
    return '{' + tmp.join(', ') + '}';
  }
  return null;
}

function isRange(o) {
  return o.low !== undefined && o.high !== undefined;
}

export class Emitter {
  constructor(config) {
    this.emit_raw = config.emit_raw || this._emit_raw;
    this.indentation = 0;
    this._symbol_map = [{}];
    this._function_map = [{}];
    this.callables = {};  // TODO: Why is there both a _function_map and callables?
    this.variables = [{}]; // List of objects - pushed and popped as needed

    const unit_search_paths = config.unit_search_paths || [];
    for (var i = 0; i < unit_search_paths.length; i++) {
      const path = unit_search_paths[i];
      if (!(path in module.paths)) {
        module.paths.push(path);
      }
    }
  }
  _emit_assignment(stmt) {
    this.emit_raw(this.format_expression(stmt.to) + " = " + this.format_expression(stmt.from) + ";");
  }

  emit_statement = function (stmt) {
    switch (stmt.statement) {
      case 'block':
        this.emit_raw('{'); this.indentation++;
        this.emit_statements(stmt.statements);
        this.indentation--; this.emit_raw('}');
        break;
      case 'call':
        // Find boxes
        const f = this.callables[stmt.target];
        const boxes = [];
        const unboxes = [];
        const args = [];
        stmt.arguments.map((argument, i) => {
          const parameter = f ? f.arguments[i] : null;
          const expression = this.format_expression(argument);
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
          this.emit_raw(this.function_symbol(stmt.target) + '(' + args.join(', ') + ');');
          for (var i = 0; i < unboxes.length; i++) {
            this.emit_raw(unboxes[i]);
          }
        } else {
          // No boxing needed (no "var" arguments)
          this.emit_raw(this.function_symbol(stmt.target) + '(' + args.join(', ') + ');');
        }
        break;
      case 'assignment':
        this._emit_assignment(stmt);
        break;
      case 'assignment_with':
        // TODO: if op is + and format_expression(stmt.from) is 1. Use ++. Same with -
        this.emit_raw(this.format_expression(stmt.to) + " " + stmt.operator + "= " + this.format_expression(stmt.from) + ";");
        break;
      case 'for':
        var update = stmt.direction == "to" ? (stmt.variable + '++') : (stmt.variable + '--');
        var stop_criterion = stmt.direction == "to" ? (stmt.variable + '<=' + this.format_expression(stmt.stop)) : (stmt.variable + '>=' + this.format_expression(stmt.stop));
        this.emit_raw('for (' + stmt.variable + '=' + this.format_expression(stmt.start) + '; ' + stop_criterion + '; ' + update + ')');
        this.emit_statement(stmt.do);
        break;
      case 'while':
        this.emit_raw('while (' + this.format_expression(stmt.condition) + ")");
        this.emit_statement(stmt.do);
        break;
      case 'repeat':
        this.emit_raw('do {'); this.indentation++;
        this.emit_statements(stmt.statements);
        this.indentation--;
        this.emit_raw('} while (!(' + this.format_expression(stmt.condition) + "));");
        break;
      case 'if':
        this.emit_raw('if (' + this.format_expression(stmt.condition) + ')');
        this.emit_statement(stmt.then);
        if (stmt.else) {
          this.emit_raw('else');
          this.emit_statement(stmt.else);
        }
        break;
      case 'case':
        if (stmt.cases.some(c => isRange(c.match))) {
          function formatMatch(match, variable) {
            if (isRange(match)) {
              return match.low + " <= " + variable + " && " + variable + "<= " + match.high;
            }
            return variable + " == " + match;
          }
          // At last one case has a range. Just use if-statements
          for (var i = 0; i < stmt.cases.length; i++) {
            this.emit_raw((i == 0 ? '' : 'else ') + 'if (' + formatMatch(stmt.cases[i].match, stmt.variable) + ') {'); this.indentation++;
            this.emit_statement(stmt.cases[i].then);
            this.indentation--; this.emit_raw('}');
          }
          if (stmt.otherwise) {
            this.emit_raw('else {'); this.indentation++;
            this.emit_statements(stmt.otherwise);
            this.indentation--; this.emit_raw('}');
          }
        } else {
          this.emit_raw('switch (' + stmt.variable + ') {'); this.indentation++;
          for (var i = 0; i < stmt.cases.length; i++) {
            this.emit_raw('case ' + stmt.cases[i].match + ":");
            this.emit_statement(stmt.cases[i].then);
            this.emit_raw('break;');
          }
          if (stmt.otherwise) {
            this.emit_raw('deafult:');
            this.emit_statements(stmt.otherwise);
          }
          this.indentation--; this.emit_raw('}');
        }
        break;
      case 'with':
        const type = this.findVariable(stmt.lvalue);
        if (type.kind != 'record') {
          throw "Expected record";
        }
        stack_push(this._symbol_map);
        for (var member of type.members) {
          stack_insert(this._symbol_map, member.name, stmt.lvalue + '.' + member.name);
        }
        this.emit_statement(stmt.do);
        stack_pop(this._symbol_map);
        break;
      case 'assembly_block':
        const ast = reduceControlFlow(stmt.statements);
        this.emit_statement(ast);
        break;
      default:
        throw "Unknown statement: " + stmt.statement;
    }
  }

  emit_statements(statements) {
    for (var statement of statements) {
      this.emit_statement(statement);
    }
  }
  argument_list(ast_arguments) {
    return ast_arguments.map(function (arg) { return arg.name; }).join(', ');
  }
  emit_constants(constants) {
    for (var constant of constants) {
      this.emit_raw('const ' + constant.name + ' = ' + constant.value + ';');
    }
  }
  emit_variable(variable) {
    var initializer = initializer_for(variable.type);
    // add to variable scope
    stack_insert(this.variables, variable.name, variable.type);
    this.emit_raw("var " + variable.name + " = " + initializer + ";");
  }
  emit_variables(variables) {
    if (variables) {
      for (var variable of variables) {
        this.emit_variable(variable);
      }
    }
  }
  async emit_procedure(p) {
    this.emit_raw("function " + p.procedure + "(" + this.argument_list(p.arguments) + ") {");
    this.indentation++;
    stack_push(this._symbol_map);
    for (var argument of p.arguments) {
      if (argument.type.kind == 'boxed') {
        stack_insert(this._symbol_map, argument.name, argument.name + '.value');
      }
    }
    await this.emit_construct(p.construct);
    stack_pop(this._symbol_map);
    this.indentation--; this.emit_raw("}");

    stack_insert(this._function_map, p.procedure, p.procedure);
  }
  async emit_function(f) {
    this.emit_raw("function " + f.function + "(" + this.argument_list(f.arguments) + ") {");
    this.indentation++;
    if (f.construct.block.statement == 'assembly_block') {
      await this.emit_construct(f.construct);
      this.emit_raw('return _system.__registers.ax;');
    } else {
      stack_push(this._symbol_map);
      const result_name = '_result';
      stack_insert(this._symbol_map, f.function, result_name);
      this.emit_variable({ 'name': result_name, 'type': f.return_type });
      await this.emit_construct(f.construct);
      stack_pop(this._symbol_map);
      this.emit_raw('return ' + result_name + ";");
    }

    this.indentation--; this.emit_raw("}");

    stack_insert(this._function_map, f.function, f.function);
  }
  async emit_uses(unit_names) {
    for (var unit_name of unit_names) {
      const module = await import('../../build/' + unit_name + ".js");
      for (var key in module) {
        stack_insert(this._function_map, key, unit_name + '.' + key);
        stack_insert(this._symbol_map, key, unit_name + '.' + key);
      }
      this.emit_raw("import * as " + unit_name + " from '" + ('./' + unit_name + ".js") + "';");
    }
  }
  async emit_declarations(declarations) {
    for (var d of declarations) {
      await this.emit_uses(d.uses || []);
      if (d.procedure) {
        this.callables[d.procedure] = { procedure: d.procedure, arguments: d.arguments };
        await this.emit_procedure(d);
      }
      if (d.function) {
        this.callables[d.function] = { function: d.function, arguments: d.arguments };
        await this.emit_function(d);
      }
      this.emit_constants(d.constants || []);
      this.emit_variables(d.vars);
    }
  }
  async emit_construct(construct) {
    stack_push(this.variables);
    await this.emit_declarations(construct.declarations);
    this.emit_statement(construct.block);
    stack_pop(this.variables);
  }
  emit_notice() {
    this.emit_raw("// Generated by pascaljs. https://github.com/vidstige/pascaljs");
  }
  emit_export(interface_part) {
    // TODO: Export constants and vars
    // TODO: Export types. As `_types` perhaps?
    this.emit_raw('export {' + interface_part.filter(i => i.name).map(i => i.name).join(', ') + '};');
  };
  use_stdlib(declarations) {
    declarations.unshift({uses: ['_system']});
    copyFileSync('./src/backend/_system.js', 'build/_system.js');
  }
  async emit(ast) {
    if (ast.program) {
      // emit std unit
      this.emit_notice();
      if (ast.program.declarations === undefined) ast.program.declarations = [];
      this.use_stdlib(ast.program.declarations);
      await this.emit_construct(ast.program);
    } else if (ast.unit) {
      this.emit_notice();
      this.use_stdlib(ast.unit.interface);

      await this.emit_declarations(ast.unit.interface);
      await this.emit_declarations(ast.unit.implementation);

      this.emit_export(ast.unit.interface);
    } else {
      throw "Unknown AST: " + ast;
    }
  }
  _emit_raw(line) {
    console.log('  '.repeat(this.indentation) + line);
  }
  symbol(identifier) {
    return find(this._symbol_map, identifier, identifier);
  }
  findVariable(name) {
    const type = find(this.variables, name);
    if (!type) {
      throw "Unknown variable " + name;
    }
    return type;
  }
  function_symbol(identifier) {
    const f = find(this._function_map, identifier);
    if (f === undefined) {
      return identifier;
    }
    return f;
  }
  format_expression(expression) {
    if (expression === null)
      return 'null';

    if (expression.expression == 'binary') {
      return this.format_expression(expression.lhs) + ' ' + format_operator(expression.operator) + ' ' + this.format_expression(expression.rhs);
    }
    if (expression.expression == 'unary') {
      return format_operator(expression.operator) + expression.operand;
    }
    if (expression.expression == 'call') {
      return this.function_symbol(expression.func) + "(" + expression.args.map(arg => this.format_expression(arg)).join(', ') + ")";
    }
    if (expression.expression == 'nested') {
      return "(" + this.format_expression(expression.nested) + ")";
    }
    if (expression.expression == 'field_access') {
      return this.format_expression(expression.lvalue) + '.' + this.format_expression(expression.field); // TODO: This shouldn't be an expression?
    }
    if (expression.expression == 'array_access') {
      return this.format_expression(expression.lvalue) + '[' + this.format_expression(expression.indexer) + ']';
    }
    // handle function calls without parenthesis
    const f = find(this._function_map, expression, null);
    if (f !== null) {
      return f + "()";
    }
    return this.symbol(expression);
  }

}
