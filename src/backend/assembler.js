// https://dl.acm.org/doi/pdf/10.1145/3547621
// https://en.wikipedia.org/wiki/Dominator_(graph_theory)

// returns a set containing the elements that are in all sets
function intersection(sets) {
  var everything = new Set();
  for (var set of sets) {
    for (var element of set) {
      everything.add(element);
    }
  }

  var rm = [];
  for (var element of everything) {
    for (var set of sets) {
      if (!set.has(element)) {
        rm.push(element);
        break;
      }
    }
  }
  for (var element in rm) {
    everything.remove(element);
  }
  return everything;
}

function isBranch(statement) {
  return statement.mnemonic == 'loop';
}

function findPrevious(leaders, node) {
  return Math.min.apply(null, leaders.filter(leader => leader < node));
}

function get_parents(node, edges) {
  return edges.filter(edge => edge.target == node).map(edge => edge.source);
}

function find_dominators(nodes, edges) {
  const start = 0
  var dom = {};
  for (var node of nodes) {
    if (node == start) {
      // dominator of the start node is the start itself
      dom[node] = new Set([node]);
    } else {
      // for all other nodes, set all nodes as the dominators
      dom[node] = new Set(nodes);
    }
  }

  // iteratively eliminate nodes that are not dominators
  var changed = true;
  while (changed) { // changes in any Dom(n)
    changed = false;
    for (var node of nodes) {
      if (node == start) continue; // skip start node
      // samuel: what's predecesors? Must be parents in the cfg, right?
      var domp = [];
      for (var parent of get_parents(node, edges)) {
        domp.push(dom[parent]);
      }
      var newValue = intersection(domp);
      newValue.add(node);
      changed |= newValue == dom[node];
      dom[node] = newValue;
      //Dom(n) = {n} union with intersection over Dom(p) for all p in pred(n)
    }
  }
  return dom;
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
    const dominators = find_dominators(leaders, edges);
    console.error(dominators);

    this.leaders = leaders;
    this.edges = edges;
    this.statements = statements;
  }
  reduce() {
    // converts assembler to intermediate strucutured flow 
  } 
}

module.exports = {
  ControlFlowGraph: ControlFlowGraph
};
  
