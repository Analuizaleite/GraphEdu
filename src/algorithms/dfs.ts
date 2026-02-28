interface Edge {
  sourceId: number;
  targetId: number;
  weight: number;
}

export interface AlgorithmStep {
  type: 'visit' | 'queue';
  nodeId: number;
}

export function generateDFSSteps(
  startNodeId: number, 
  nodesCount: number, 
  edges: Edge[],
  isDirected: boolean // NOVO
): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const visited = new Set<number>();
  const stack: number[] = [];

  const adjacency: Record<number, number[]> = {};
  for (let i = 0; i < nodesCount; i++) adjacency[i] = [];
  
  edges.forEach(edge => {
    if (!adjacency[edge.sourceId]) adjacency[edge.sourceId] = [];
    adjacency[edge.sourceId].push(edge.targetId);

    if (!isDirected) { // Só volta se não for direcionado
        if (!adjacency[edge.targetId]) adjacency[edge.targetId] = [];
        adjacency[edge.targetId].push(edge.sourceId);
    }
  });

  stack.push(startNodeId);
  steps.push({ type: 'queue', nodeId: startNodeId });

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    if (visited.has(currentId)) continue;

    visited.add(currentId);
    steps.push({ type: 'visit', nodeId: currentId });

    const neighbors = adjacency[currentId] || [];
    neighbors.sort((a, b) => b - a); 

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
        steps.push({ type: 'queue', nodeId: neighbor }); 
      }
    }
  }
  return steps;
}