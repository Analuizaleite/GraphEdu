interface Edge {
  sourceId: number;
  targetId: number;
  weight: number; // NOVO
}

interface BFSStep {
  type: 'visit' | 'queue';
  nodeId: number;
}

export function generateBFSSteps(
  startNodeId: number, 
  nodesCount: number, 
  edges: Edge[],
  isDirected: boolean // NOVO: Parâmetro para saber se respeita a seta
): BFSStep[] {
  const steps: BFSStep[] = [];
  const visited = new Set<number>();
  const queue: number[] = [];

  // 1. Montar Lista de Adjacência
  const adjacency: Record<number, number[]> = {};
  for (let i = 0; i < nodesCount; i++) adjacency[i] = [];

  edges.forEach(edge => {
    // Sempre adiciona a ida
    if (!adjacency[edge.sourceId]) adjacency[edge.sourceId] = [];
    adjacency[edge.sourceId].push(edge.targetId);

    // Só adiciona a volta se NÃO for direcionado
    if (!isDirected) {
      if (!adjacency[edge.targetId]) adjacency[edge.targetId] = [];
      adjacency[edge.targetId].push(edge.sourceId);
    }
  });

  // 2. BFS (O resto continua igual)
  queue.push(startNodeId);
  visited.add(startNodeId);
  steps.push({ type: 'queue', nodeId: startNodeId });

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    steps.push({ type: 'visit', nodeId: currentId });

    const neighbors = adjacency[currentId] || [];
    neighbors.sort((a, b) => a - b);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
        steps.push({ type: 'queue', nodeId: neighbor });
      }
    }
  }

  return steps;
}