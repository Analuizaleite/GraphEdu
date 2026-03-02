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
 * Verifica o fator de equilíbrio (Simplificado para o jogo)
 * Em um TCC real, isso calcularia a diferença de altura entre subárvores.
 */
export const checkBalanceFactor = (nodes: any[]) => {
  // Lógica para detectar se o grafo precisa de rotação
  // Retorna > 1 para desequilíbrio à esquerda, < -1 para direita
  return nodes.length >= 3 ? 2 : 0;
};