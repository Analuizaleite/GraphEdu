// src/algorithms/avl.ts

/**
 * Executa a Rotação à Direita (Caso LL - Left-Left)
 * Transforma uma linha descendente à esquerda em um triângulo equilibrado.
 */
export const performRightRotation = (nodes: any[]) => {
  return nodes.map(node => {
    // Nó 1: Torna-se a nova raiz (topo do triângulo)
    if (node.id === 1) {
      return { ...node, x: 300, y: 150 };
    }
    // Nó 0: Mantém-se à esquerda, mas ajusta a altura para o novo nível
    if (node.id === 0) {
      return { ...node, x: 200, y: 300 };
    }
    // Nó 2: Desce para a direita, tornando-se filho da nova raiz (1)
    if (node.id === 2) {
      return { ...node, x: 400, y: 300 };
    }
    return node;
  });
};

/**
 * Executa a Rotação à Esquerda (Caso RR - Right-Right)
 * Útil para futuras fases onde o desequilíbrio seja para o lado oposto.
 */
export const performLeftRotation = (nodes: any[]) => {
  return nodes.map(node => {
    if (node.id === 1) return { ...node, x: 300, y: 150 }; // Nova Raiz
    if (node.id === 0) return { ...node, x: 200, y: 300 }; // Filho Esquerdo
    if (node.id === 2) return { ...node, x: 400, y: 300 }; // Filho Direito
    return node;
  });
};