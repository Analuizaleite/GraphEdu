// src/algorithms/balancing.ts

/**
 * Retorna o novo conjunto de arestas para um grafo de 3 nós após o equilíbrio.
 * No modelo AVL, a raiz conecta-se aos dois filhos.
 */
export const getBalancedEdges = (rootId: number, leftChildId: number, rightChildId: number) => {
  return [
    {
      sourceId: rootId,
      targetId: leftChildId,
      weight: 1
    },
    {
      sourceId: rootId,
      targetId: rightChildId,
      weight: 1
    }
  ];
};

/**
 * Detecta qual caso de rotação AVL é necessário com base nas arestas.
 * Retorna: 'LL' | 'RR' | 'LR' | 'RL' | null
 * 
 * Casos:
 * - LL: Nó 2 -> Nó 1 -> Nó 0 (linha à esquerda) - Rotação Direita
 * - RR: Nó 0 -> Nó 1 -> Nó 2 (linha à direita) - Rotação Esquerda
 * - LR: Nó 2 -> Nó 0 -> Nó 1 (V invertida à esquerda) - Rotação Esquerda-Direita
 * - RL: Nó 0 -> Nó 2 -> Nó 1 (V invertida à direita) - Rotação Direita-Esquerda
 */
export const detectAVLCase = (_nodes: any[], edges: any[]): 'LL' | 'RR' | 'LR' | 'RL' | null => {
  // Simplificação para 3 nós (id 0, 1, 2)
  // Verifica se existe uma linha reta de conexões
  const hasEdge = (s: number, t: number) => edges.some(e => e.sourceId === s && e.targetId === t);

  if (hasEdge(2, 1) && hasEdge(1, 0)) return 'LL'; // Necessita Rotação Direita
  if (hasEdge(0, 1) && hasEdge(1, 2)) return 'RR'; // Necessita Rotação Esquerda
  if (hasEdge(2, 0) && hasEdge(0, 1)) return 'RL'; // Direita-Esquerda
  if (hasEdge(0, 2) && hasEdge(2, 1)) return 'LR'; // Esquerda-Direita

  return null;
};