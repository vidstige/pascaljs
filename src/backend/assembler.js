function isBranch(statement) {
  return statement.mnemonic == 'loop';
}
function findPrevious(leaders, node) {
  return Math.min.apply(null, leaders.filter(leader => leader < node));
}
function findNext(leaders, node) {
  const index = leaders.indexOf(node);
  if (index < 0) {
    throw "Could not find node " + node;
  }
  return leaders[index + 1];
}

class ControlFlowGraph {
  constructor(statements) {
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
      if (isBranch(statement)) {
        // link back branch target with previous block
        const previous = findPrevious(leaders, i);
        edges.push({source: previous, target: labels[statement.to]});
        
        leaders.push(labels[statement.to]);  // branch target is a leader
        edges.push({source: i, target: labels[statement.to]});

        leaders.push(i + 1); // instruction after loop is also a leader
        edges.push({source: i, target: i + 1});
      }
    }
    // Add previous => exit if needed
    const previous = findPrevious(leaders, statements.length - 1);
    const exit = statements.length;
    if (!edges.includes({source: previous, target: exit})) {
      edges.push({source: previous, target: exit});
    }
    
    leaders.push(exit);
    leaders.sort(function (a, b) { return a - b; });

    // 3. Compute Immediate Dominator Tree (DomT)
    this.leaders = leaders;
    this.edges = edges;
    this.statements = statements;
  }
  parents(node) {
    return this.edges.filter(edge => edge.source == node).map(edge => edge.target);
  }
  childs(node) {
    return this.edges.filter(edge => edge.target == node).map(edge => edge.source);
  }
  isBackEdge(edge) {
    // TODO: This wont work in all cases
    return edge.target < edge.source;
  }
  reduce(node) {
    // converts assembler to intermediate strucutured flow 
    const parents = this.parents(node);
    const childs = this.childs(node);
    //if (this.isBackEdge({source: node, target: childs[0]})) {
    switch (childs.length) {
      case 0:
        // we're done. Just assert node == exit
        break;
      case 1:
        const next = findNext(this.leaders, node);
        for (var i = node; i < next; i++) {
          console.error(this.statements[i]);
        }
        break;
      case 2:
        // loop or if
        break;
      default:
        throw "Unexpected number of childs " + childs.length;
    }
  } 
}

module.exports = {
  ControlFlowGraph: ControlFlowGraph
};
  
