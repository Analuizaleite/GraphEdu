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

/**
 * Executa Rotação Esquerda-Direita (Caso LR - Left-Right)
 * O nó 2 está no lugar do filho esquerdo, e o nó 0 é neto esquerdo.
 * Necessita duas rotações: primeiro esquerda, depois direita.
 */
export const performLRRotation = (nodes: any[]) => {
  // Passo 1: Rotação à esquerda no filho esquerdo (nó 0)
  // Passo 2: Rotação à direita na raiz (novo nó 0)
  return nodes.map(node => {
    if (node.id === 0) return { ...node, x: 300, y: 150 }; // Nova Raiz
    if (node.id === 2) return { ...node, x: 200, y: 300 }; // Filho Esquerdo
    if (node.id === 1) return { ...node, x: 400, y: 300 }; // Filho Direito
    return node;
  });
};

/**
 * Executa Rotação Direita-Esquerda (Caso RL - Right-Left)
 * O nó 0 está no lugar do filho direito, e o nó 2 é neto direito.
 * Necessita duas rotações: primeiro direita, depois esquerda.
 */
export const performRLRotation = (nodes: any[]) => {
  // Passo 1: Rotação à direita no filho direito (nó 2)
  // Passo 2: Rotação à esquerda na raiz (novo nó 2)
  return nodes.map(node => {
    if (node.id === 2) return { ...node, x: 300, y: 150 }; // Nova Raiz
    if (node.id === 0) return { ...node, x: 200, y: 300 }; // Filho Esquerdo
    if (node.id === 1) return { ...node, x: 400, y: 300 }; // Filho Direito
    return node;
  });
};