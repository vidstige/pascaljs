// https://dl.acm.org/doi/pdf/10.1145/3547621
// https://en.wikipedia.org/wiki/Dominator_(graph_theory)

function isBranch(statement) {
  const branchMnemonics = ['loop', 'je', 'jne'];
  return branchMnemonics.includes(statement.mnemonic);
}

function branchCondition(statement) {
  switch (statement.mnemonic) {
    case 'jne':
    case 'jnz':
      return '_system.__registers.flags';
    case 'loop':
      return '--_system.__registers.cx == 0'; // inverted because emitted as repeat-until
    default:
      throw "Unknown branch mnemonic " + statement.mnemonic;
  }
}

function findNode(leaders, index) {
  return Math.max.apply(null, leaders.filter(leader => leader <= index));
}

class ControlFlowGraph {
  constructor(nodes, edges, start) {
    this.start = start || 0;
    this.nodes = nodes;
    this.edges = edges;
  }
  static build(statements) {
    // 1. Create label lookup
    var labels = {};
    for (var i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.label) {
        labels[statement.label] = i;
      }
    }
    
    // 2. Find all leaders
    var leaders = [0]; // first instruction is always leader
    for (var i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (isBranch(statement)) {
        leaders.push(labels[statement.to]);  // branch target is a leader
        if (i + 1 < statements.length) {
          leaders.push(i + 1); // instruction after branch is also a leader (unless last)
        }
      }
    }
    leaders.sort(function (a, b) { return a - b; });
  
    // 3. construct graph (cfg)
    var edges = [];
    for (var i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (isBranch(statement)) {
        const source = findNode(leaders, i);
        const target = labels[statement.to];
        edges.push({source: source, target: target});
        if (i + 1 < statements.length) {
          edges.push({source: source, target: i + 1});
        }
        // re-connect branch target with previous instruction (unless start)
        if (target > 0) {
          edges.push({source: findNode(leaders, target - 1), target: target});
        }
      }
    }
    return new ControlFlowGraph(leaders, edges);
  }
  _postOrder(node, visited) {
    var tmp = [];
    visited.add(node);
    for (var child of this.childs(node)) {
      if (visited.has(child)) continue;
      tmp.push(...this._postOrder(child, visited));
    }
    tmp.push(node);
    return tmp;
  }
  postOrder() {
    // returns the nodes in post-order (dfs)
    return this._postOrder(this.start, new Set());
  }
  outEdges(node) {
    return this.edges.filter(edge => edge.source == node);
  }
  childs(node) {
    return this.outEdges(node).map(edge => edge.target);
  }
  inEdges(node) {
    return this.edges.filter(edge => edge.target == node);
  }
  parents(node) {
    return this.inEdges(node).map(edge => edge.source);
  }

  remove(node) {
    return new ControlFlowGraph(
      this.nodes.filter(n => n != node),
      this.edges.filter(edge => edge.target != node),
      this.start,
    );
  }
}

function reachable(cfg) {
  var visited = new Set();
  if (!cfg.nodes.includes(cfg.start)) {
    return visited;
  }
  var queue = [cfg.start];
  while (queue.length > 0) {
    const node = queue.shift();
    visited.add(node);
    for (var child of cfg.childs(node)) {
      if (!visited.has(child)) {
        queue.push(child);
      }
    }
  }
  return visited;
}

function unreachable(cfg) {
  var tmp = new Set(cfg.nodes);
  for (var node of reachable(cfg)) {
    tmp.delete(node)
  }
  return tmp;
}

class Node {
  constructor(value, childs) {
    this.value = value;
    this.childs = childs;
  }
}

function treeFromParents(parentsOf, node) {
  const childs = [];
  for (var key in parentsOf) {
    if (parentsOf[parseInt(key)] == node) {
      childs.push(treeFromParents(parentsOf, parseInt(key)));
    }
  }
  return new Node(node, childs);
}

function buildDominatorTree(cfg, rpo) {
  // simple but slow algorithm O(m^2)
  const parentOf = {}; // key = node, value = parent
  for (var i = 0; i < rpo.length; i++) {
    const node = rpo[i];
    for (var unreachableNode of unreachable(cfg.remove(node))) {
      parentOf[unreachableNode] = node;
    }
  }
  return treeFromParents(parentOf, cfg.start, rpo);
}

function isForward(edge, rpo) {
  return rpo.indexOf(edge.source) < rpo.indexOf(edge.target);
}

function isBack(edge, rpo) {
  return !isForward(edge, rpo);
}

function translateAssemblerStatement(statement) {
  switch (statement.mnemonic.toLowerCase()) {
    case 'mov':
      return {statement: 'assignment', to: statement.target, from: statement.source};
    case 'inc':
      return {statement: 'assignment_with', to: statement.target, operator: '+', from: 1};
    case 'dec':
      return {statement: 'assignment_with', to: statement.target, operator: '-', from: 1};
    case 'add':
      return {statement: 'assignment_with', to: statement.target, operator: '+', from: statement.operand};  
    case 'sub':
      return {statement: 'assignment_with', to: statement.target, operator: '-', from: statement.operand};
    case 'xor':
      return {statement: 'assignment_with', to: statement.target, operator: '^', from: statement.operand};
    case 'shr':
      return {statement: 'assignment_with', to: statement.target, operator: '>>', from: statement.operand};
    case 'cmp':
      return {
        statement: 'assignment',
        to: '_system.__registers.flags',
        from: {expression: 'binary', lhs: statement.b, operator: '-', rhs: statement.a},
      };
    case 'mul':
      return {statement: 'assignment_with', to: statement.target, operator: '*', from: statement.source};
    case 'int':
      // TODO: this is just a no operaton (nop)
      return {statement: 'block', statements: []};
    default:
      throw "Unknown mnemonic: " + statement.mnemonic;
  }
}

// converts basic block to intermediate ast
function translateBlock(assembly_statements) {
  return assembly_statements.map(translateAssemblerStatement);
}

function isMerge(node, cfg) {
  return cfg.inEdges(node.value).length > 1;
}

// inverts an intermeidate ast expression
function invert(expression) {
  return {expression: 'unary', operator: '!', operand: expression};
}

function getBlockEnd(start, cfg, statements) {
  const index = cfg.nodes.indexOf(start);
  return index == cfg.nodes.length - 1 ? statements.length : cfg.nodes[index + 1]
}

function appendChild(a, b) {
  // appends b onto a
  if (b.statement == 'block') {
    for (var statement of b.statements) {
      a.push(statement);
    }
  } else {
    a.push(b);
  }
}

// converts dominator tree node into intermediate ast node
function doTree(statements, node, cfg, rpo) {
  const inEdges = cfg.inEdges(node.value);
  const outEdges = cfg.outEdges(node.value);

  // 1. translate this node
  // get start and end-instruction
  const start = node.value;
  const end = getBlockEnd(start, cfg, statements);

  // translate the assembler listing of this node into intermediate ast
  const iast = {
    statement: 'block',
    statements: translateBlock(statements.slice(start, isBranch(statements[end - 1]) ? end - 1 : end)),
  };

  const handled = new Set(); // keep track of childs handled

  // if this node has two forward out-edges, it's an if-statement
  if (outEdges.length == 2 && outEdges.every(edge => isForward(edge, rpo))) {
    // find the out-edges in childs (the if-true part always comes first, because of how the
    // cfg is constructed)
    const then = node.childs.find(child => child.value == outEdges[0].target);
    const els3 = node.childs.find(child => child.value == outEdges[1].target);

    const conditional = {
      statement: 'if',
      condition: branchCondition(statements[end - 1]),
      then: doTree(statements, then, cfg, rpo),
      else: doTree(statements, els3, cfg, rpo),
    };

    iast.statements.push(conditional);

    if (isMerge(then, cfg)) {
      // the then-part cannot be empty - invert condition and swap then with else
      appendChild(iast.statements, conditional.then);  // put the then-part after the if
      conditional.condition = invert(conditional.condition);  // invert condition
      conditional.then = conditional.else;  // swap the then and else parts
      conditional.else = null;
    }
    if (isMerge(els3, cfg)) {
      appendChild(iast.statements, conditional.else);
      conditional.else = null;
    }

    // wrap then and else parts in blocks

    // don't concat these childs
    handled.add(then);
    handled.add(els3);
  }

  // 2. translate all childs and append them
  // sort childs by rpo number
  node.childs.sort((a, b) => rpo.indexOf(b) - rpo.indexOf(a));
  for (var child of node.childs) {
    if (handled.has(child)) continue;  // skip childs included if (if any)
    const child_ast = doTree(statements, child, cfg, rpo);
    appendChild(iast.statements, child_ast);
  }

  // if this node has one incoming back-edge, it's a loop header
  const backEdges = inEdges.filter(edge => isBack(edge, rpo));
  if (backEdges.length > 0) {
    const sourceEnd = getBlockEnd(backEdges[0].source, cfg, statements);
    // wrap ast in do-while loop
    return {
      statement: 'repeat',
      condition: branchCondition(statements[sourceEnd - 1]),
      statements: iast.statements,
    }
  }

  return iast;
}

// reduces the assembler statements into ast (containing only structured control flow)
export function reduceControlFlow(statements) {
  const cfg = ControlFlowGraph.build(statements);
  const rpo = cfg.postOrder().reverse();
  const domt = buildDominatorTree(cfg, rpo);
  return doTree(statements, domt, cfg, rpo);
}
