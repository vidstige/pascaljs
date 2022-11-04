// https://dl.acm.org/doi/pdf/10.1145/3547621
// https://en.wikipedia.org/wiki/Dominator_(graph_theory)

function isBranch(statement) {
  const branchMnemonics = ['loop', 'je', 'jne'];
  return branchMnemonics.includes(statement.mnemonic);
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
        leaders.push(i + 1); // instruction after branch is also a leader
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
        edges.push({source: source, target: i + 1});
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
  console.error(parentOf)
  return treeFromParents(parentOf, cfg.start, rpo);
}

function isBack(edge, rpo) {
  
}

function doTree(node, cfg, rpo) {
  // 2. Emit childs
  const inEdges = cfg.inEdges(node.value);
  const outEdges = cfg.outEdges(node.value);

  // Detect loop
  if (inEdges == 1 && isBack(edge, rpo)) {
    // emit do-while loop and insert doTree(node) inside

  }
  
  // Detect if
  /*if (cfgChilds.length == 2) {
    return {
      statement: 'if',
      condition: null, // todo
      then: null,
      else: null,
    }
  }*/

  //childs.sort((a, b) => rpo.indexOf(b) - rpo.indexOf(a));
}

// reduces the assembler statements into ast (containing only structured control flow)
function reduceControlFlow(statements) {
  console.error(statements)
  const cfg = ControlFlowGraph.build(statements);
  const rpo = cfg.postOrder().reverse();
  const domt = buildDominatorTree(cfg, rpo);
  doTree(domt, cfg, rpo);
}

module.exports = {
  reduceControlFlow: reduceControlFlow,
};
  
