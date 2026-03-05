// src/algorithms/dijkstra.ts

export interface DijkstraStep {
  type: 'visit' | 'queue' | 'path' | 'done';
  nodeId?: number;
  currentDistances: number[];
  previous: (number | null)[];
}

/**
 * Generates steps for Dijkstra's algorithm
 * @param startId - Starting node ID
 * @param numNodes - Total number of nodes
 * @param edges - Array of edges with weights
 * @returns Array of steps for visualization
 */
export const generateDijkstraSteps = (
  startId: number,
  numNodes: number,
  edges: { sourceId: number; targetId: number; weight: number }[]
): DijkstraStep[] => {
  const steps: DijkstraStep[] = [];
  
  // Initialize distances (infinity except start)
  const distances: number[] = Array(numNodes).fill(Infinity);
  const previous: (number | null)[] = Array(numNodes).fill(null);
  const visited: Set<number> = new Set();
  const queue: number[] = [];
  
  // Set start node distance
  distances[startId] = 0;
  queue.push(startId);
  
  // Initial state
  steps.push({
    type: 'queue',
    nodeId: startId,
    currentDistances: [...distances],
    previous: [...previous]
  });
  
  // Build adjacency list
  const adjacencyList: Map<number, { neighbor: number; weight: number }[]> = new Map();
  for (let i = 0; i < numNodes; i++) {
    adjacencyList.set(i, []);
  }
  for (const edge of edges) {
    adjacencyList.get(edge.sourceId)?.push({ neighbor: edge.targetId, weight: edge.weight });
    // For undirected graphs, add reverse edge too
    adjacencyList.get(edge.targetId)?.push({ neighbor: edge.sourceId, weight: edge.weight });
  }
  
  while (queue.length > 0) {
    // Find node with minimum distance in queue
    queue.sort((a, b) => distances[a] - distances[b]);
    const current = queue.shift()!;
    
    if (visited.has(current)) continue;
    visited.add(current);
    
    // Visit current node
    steps.push({
      type: 'visit',
      nodeId: current,
      currentDistances: [...distances],
      previous: [...previous]
    });
    
    // Get neighbors
    const neighbors = adjacencyList.get(current) || [];
    for (const { neighbor, weight } of neighbors) {
      if (visited.has(neighbor)) continue;
      
      const newDistance = distances[current] + weight;
      if (newDistance < distances[neighbor]) {
        distances[neighbor] = newDistance;
        previous[neighbor] = current;
        
        // Add to queue if not already there
        if (!queue.includes(neighbor)) {
          queue.push(neighbor);
        }
        
        // Queue update
        steps.push({
          type: 'queue',
          nodeId: neighbor,
          currentDistances: [...distances],
          previous: [...previous]
        });
      }
    }
  }
  
  // Done
  steps.push({
    type: 'done',
    currentDistances: [...distances],
    previous: [...previous]
  });
  
  return steps;
};

/**
 * Get the shortest path from start to target
 * @param startId - Starting node ID
 * @param targetId - Target node ID
 * @param previous - Previous array from Dijkstra
 * @returns Array of node IDs forming the path
 */
export const getShortestPath = (
  startId: number,
  targetId: number,
  previous: (number | null)[]
): number[] => {
  const path: number[] = [];
  let current: number | null = targetId;
  
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }
  
  // Check if path is valid
  if (path[0] !== startId) {
    return []; // No path found
  }
  
  return path;
};
