// https://dl.acm.org/doi/pdf/10.1145/3547621
// https://en.wikipedia.org/wiki/Dominator_(graph_theory)

function isBranch(statement) {
  const branchMnemonics = ['loop', 'je', 'jne'];
  return branchMnemonics.includes(statement.mnemonic);
}

function findNode(leaders, index) {
  return Math.min.apply(null, leaders.filter(leader => leader < index));
}

class ControlFlowGraph {
  constructor(nodes, edges) {
    this.start = 0;
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
    
    // 2. Find all leaders and construct graph
    var edges = [];
    var leaders = [0]; // first instruction is always leader
    for (var i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const node = findNode(leaders, i);
      if (isBranch(statement)) {
        leaders.push(labels[statement.to]);  // branch target is a leader
        edges.push({source: node, target: labels[statement.to]});

        leaders.push(i + 1); // instruction after branch is also a leader
        edges.push({source: node, target: i + 1});
      }
    }
    const exit = statements.length;
    // Add previous => exit if needed
    /*const previous = findPrevious(leaders, statements.length - 1);
    if (!edges.includes({source: previous, target: exit})) {
      edges.push({source: previous, target: exit});
    }*/
    
    //leaders.push(exit);
    leaders.sort(function (a, b) { return a - b; });

    return new ControlFlowGraph(leaders, edges);
  }
  postOrder() {
    // returns the nodes in post-order (dfs)
    var order = [];
    var queue = [this.start];
    while (queue.length > 0) {
      const node = queue.shift();
      // visit all childs
      for (var child of this.childs(node)) {
        if (!order.includes(child)) {
          order.push(child);
        }
        queue.push(child);
      }
      // visit myself
      if (!order.includes(node)) {
        order.push(node);
      }
    }
    if (order.length != this.nodes.length) throw "Post order";
    return order;
  }
  childs(node) {
    return this.edges.filter(edge => edge.source == node).map(edge => edge.target);
  }
  remove(node) {
    return new ControlFlowGraph(
      this.nodes.filter(n => n != node),
      this.edges.filter(edge => edge.target != node),
    );
  }
}

function reachable(cfg) {
  const visited = new Set();
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
  for (var node in reachable(cfg)) {
    tmp.remove(node)
  }
  return tmp;
}

function buildDominatorTree(cfg) {
  const tree = {}; // key = node, value = parent
  for (var node of cfg.postOrder().reverse()) {
    for (var unreachableNode of unreachable(cfg.remove(node))) {
      console.error(unreachableNode, ' is unreachable after removing', node);
      
    }
    //tree[node] = ;
    
  }
  console.error(tree)
  return tree;
}

module.exports = {
  ControlFlowGraph: ControlFlowGraph,
  buildDominatorTree: buildDominatorTree,
};
  
