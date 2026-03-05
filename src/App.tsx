import React, { useState, useEffect, useRef } from 'react';
import { Circle, Play, Trash2, MousePointer2, MoveUpRight, RotateCcw, ArrowRightLeft, ArrowRight, Eraser, Gamepad2, Wrench } from 'lucide-react';
import { generateBFSSteps } from './algorithms/bfs';
import { generateDFSSteps } from './algorithms/dfs';
import { performRightRotation, performLeftRotation, performLRRotation, performRLRotation } from './algorithms/avl';
import { getBalancedEdges, detectAVLCase } from './algorithms/balancing';

interface Node { id: number; x: number; y: number; }
interface Edge { sourceId: number; targetId: number; weight: number; }

// --- BANCO DE FASES (LEVELS) ---
const LEVELS = [
  {
    level: 1,
    title: "Iniciação ao BFS (Largura)",
    description: "O BFS visita os vizinhos por camadas (os mais próximos primeiro). Comece pelo nó 0 e clique na ordem exata!",
    algo: 'BFS',
    expectedVisits: [0, 1, 2, 3], 
    nodes: [
      { id: 0, x: 250, y: 150 },
      { id: 1, x: 150, y: 300 },
      { id: 2, x: 350, y: 300 },
      { id: 3, x: 250, y: 450 }
    ],
    edges: [
      { sourceId: 0, targetId: 1, weight: 1 },
      { sourceId: 0, targetId: 2, weight: 1 },
      { sourceId: 1, targetId: 3, weight: 1 }
    ]
  },
  {
    level: 2,
    title: "Mergulho Profundo (DFS)",
    description: "O DFS vai o mais fundo possível em um caminho antes de voltar (backtracking). Mergulhe pelo nó 0 priorizando os menores números!",
    algo: 'DFS',
    expectedVisits: [0, 1, 2, 3, 4, 5], 
    nodes: [
      { id: 0, x: 250, y: 100 },
      { id: 1, x: 150, y: 200 },
      { id: 2, x: 150, y: 300 },
      { id: 3, x: 150, y: 400 },
      { id: 4, x: 350, y: 200 },
      { id: 5, x: 350, y: 300 }
    ],
    edges: [
      { sourceId: 0, targetId: 1, weight: 1 },
      { sourceId: 1, targetId: 2, weight: 1 },
      { sourceId: 2, targetId: 3, weight: 1 },
      { sourceId: 0, targetId: 4, weight: 1 },
      { sourceId: 4, targetId: 5, weight: 1 }
    ]
  },
  {
    level: 3,
    title: "Equilíbrio de Fluxo (Rotações)",
    description: "Este grafo está desequilibrado à esquerda. Execute uma Rotação Simples à Direita para equilibrar a rede!",
    algo: 'AVL',
    expectedVisits: [2, 1, 0],
    nodes: [
      { id: 2, x: 350, y: 150 },
      { id: 1, x: 250, y: 250 },
      { id: 0, x: 150, y: 350 }
    ],
    edges: [
      { sourceId: 2, targetId: 1, weight: 1 },
      { sourceId: 1, targetId: 0, weight: 1 }
    ]
  }
];

function App() {
  // === ESTADO DA SPLASH SCREEN ===
  const [showSplash, setShowSplash] = useState(true);

  const [appMode, setAppMode] = useState<'sandbox' | 'game'>('sandbox');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isDirected, setIsDirected] = useState(false);
  const [activeTool, setActiveTool] = useState<'cursor' | 'add-node' | 'add-edge' | 'delete' | 'select-rotation'>('add-node');
  const [connectionSourceId, setConnectionSourceId] = useState<number | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);

  // --- ESTADOS DO JOGO ---
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [playerPath, setPlayerPath] = useState<number[]>([]);

  // --- ESTADOS DE ANIMAÇÃO ---
  const [selectedAlgo, setSelectedAlgo] = useState<'BFS' | 'DFS'>('BFS');
  const [startNodeId, setStartNodeId] = useState<string>('');
  // Estado para permitir escolher o ID do nó manualmente
  const [customNodeId, setCustomNodeId] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [visitedNodes, setVisitedNodes] = useState<Set<number>>(new Set());
  const [queueNodes, setQueueNodes] = useState<Set<number>>(new Set());
  
  // --- ESTADO DE ANIMAÇÃO DE ROTAÇÃO AVL ---
  const [isRotating, setIsRotating] = useState(false);
  const rotationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // --- ESTADO DE SELEÇÃO DE NÓS PARA ROTAÇÃO ---
  const [selectedNodesForRotation, setSelectedNodesForRotation] = useState<number[]>([]);
  
  // --- ESTADO DE ERRO PARA ROTAÇÃO INCORRETA ---
  const [errorNodesForRotation, setErrorNodesForRotation] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // === TIMER DA SPLASH SCREEN ===
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Carrega a fase sempre que mudar de nível ou modo
  useEffect(() => {
    if (appMode === 'game') {
      const levelData = LEVELS[currentLevelIndex];
      setNodes(levelData.nodes);
      setEdges(levelData.edges);
      setIsDirected(false);
      resetGame();
    }
  }, [appMode, currentLevelIndex]);


useEffect(() => {
  // Limpa timeout ao desmontar
  return () => {
    if (rotationTimeoutRef.current) {
      clearTimeout(rotationTimeoutRef.current);
    }
  };
}, []);



  const resetGame = () => {
    setLives(3);
    setGameStatus('playing');
    setPlayerPath([]);
    setVisitedNodes(new Set());
    setQueueNodes(new Set());
  };

  const nextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
    } else {
      setCurrentLevelIndex(0);
    }
  };

  const handleGameNodeClick = (nodeId: number) => {
    if (gameStatus !== 'playing' || LEVELS[currentLevelIndex].algo === 'AVL') return;
    if (playerPath.includes(nodeId)) return;
    const currentLevel = LEVELS[currentLevelIndex];
    const nextExpectedIndex = playerPath.length;
    
    if (nodeId === currentLevel.expectedVisits[nextExpectedIndex]) {
      const newPath = [...playerPath, nodeId];
      setPlayerPath(newPath);
      setVisitedNodes(prev => new Set(prev).add(nodeId));
      if (newPath.length === currentLevel.expectedVisits.length) setGameStatus('won');
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) setGameStatus('lost');
    }
  };

  const handleRotationChallenge = (direction: 'left' | 'right') => {
    if (currentLevelIndex !== 2 || gameStatus !== 'playing') return;

    const isCorrect = direction === 'right';

    if (isCorrect) {
      const balancedNodes = performRightRotation(nodes);
      const balancedEdges = getBalancedEdges(1, 0, 2);

      setNodes(balancedNodes);
      setEdges(balancedEdges);
      setGameStatus('won');
      setVisitedNodes(new Set([0, 1, 2]));
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setGameStatus('lost');
      }
    }
  };

  // --- LÓGICA DE ROTAÇÃO MANUAL (SANDBOX) ---
  
  // Função para validar se a rotação selecionada está correta
  const validateRotationSelection = (selectedIds: number[], rotationType: 'LL' | 'RR' | 'LR' | 'RL'): { isValid: boolean; message: string } => {
    if (selectedIds.length !== 3) {
      return { isValid: false, message: 'Selecione exatamente 3 nós.' };
    }

    // Sort the node IDs to find the middle value
    const sortedIds = [...selectedIds].sort((a, b) => a - b);
    const smallest = sortedIds[0];
    const middle = sortedIds[1];
    const largest = sortedIds[2];

    // For each rotation type, validate that the new parent will be the middle value
    // and smaller values go to left, larger to right
    switch (rotationType) {
      case 'LL':
        // LL rotation: the leftmost node (smallest) should become left child,
        // the middle should become parent, the largest should become right child
        // After right rotation, the root (originally middle in the chain) becomes the parent
        // We need to check that the current structure is a left-leaning chain
        // and the user wants to rotate to put middle as root
        return { 
          isValid: true, 
          message: '' 
        };
      case 'RR':
        // RR rotation: similar to LL but for right-leaning
        return { 
          isValid: true, 
          message: '' 
        };
      case 'LR':
        // LR rotation: left-right rotation, middle becomes root
        return { 
          isValid: true, 
          message: '' 
        };
      case 'RL':
        // RL rotation: right-left rotation, middle becomes root
        return { 
          isValid: true, 
          message: '' 
        };
      default:
        return { isValid: false, message: 'Tipo de rotação inválido.' };
    }
  };

  // Função para validar se a rotação está correta
  // Allows selection of 3 nodes: either parent with 2 children OR parent-child-grandchild chain
  const validateRotationCorrectness = (
    selectedIds: number[], 
    currentEdges: Edge[],
    rotationType: 'LL' | 'RR' | 'LR' | 'RL'
  ): { isValid: boolean; errorIds: number[]; message: string } => {
    if (selectedIds.length !== 3) {
      return { isValid: false, errorIds: selectedIds, message: 'Selecione exatamente 3 nós.' };
    }

    const hasEdge = (s: number, t: number) => currentEdges.some(e => e.sourceId === s && e.targetId === t);

    // Try two types of structures:
    // 1. Parent with 2 children (direct children)
    // 2. Parent -> child -> grandchild chain
    
    // === Check for parent with 2 children ===
    const findParentWithTwoChildren = () => {
      for (const parent of selectedIds) {
        const children = currentEdges
          .filter(e => e.sourceId === parent && selectedIds.includes(e.targetId))
          .map(e => e.targetId);
        
        if (children.length === 2) {
          const [child1, child2] = children;
          return { parent, child1, child2 };
        }
      }
      return null;
    };

    // === Check for chain: parent -> child -> grandchild ===
    const findChain = () => {
      // Try each node as potential root
      for (const root of selectedIds) {
        const childrenOfRoot = currentEdges
          .filter(e => e.sourceId === root && selectedIds.includes(e.targetId))
          .map(e => e.targetId);
        
        for (const child of childrenOfRoot) {
          const grandchildren = currentEdges
            .filter(e => e.sourceId === child && selectedIds.includes(e.targetId))
            .map(e => e.targetId);
          
          if (grandchildren.length > 0) {
            for (const grandchild of grandchildren) {
              return { root, child, grandchild };
            }
          }
        }
      }
      return null;
    };

    // Try to find parent with 2 children first
    const twoChildren = findParentWithTwoChildren();
    const chain = findChain();

    if (!twoChildren && !chain) {
      return { 
        isValid: false, 
        errorIds: selectedIds, 
        message: 'Selecione: (1) um nó pai com 2 filhos, ou (2) uma cadeia: avô -> pai -> filho.' 
      };
    }

    // Determine the case based on which structure we found
    let root: number, child: number, grandchild: number;
    let currentCase: 'LL' | 'RR' | 'LR' | 'RL' | null = null;

    if (twoChildren) {
      // Parent with 2 children case
      root = twoChildren.parent;
      const { child1, child2 } = twoChildren;
      
      // Determine which is left and which is right based on values
      const smaller = child1 < child2 ? child1 : child2;
      const larger = child1 < child2 ? child2 : child1;
      
      if (smaller < root && larger < root) {
        // Both children are to the left - LL case
        currentCase = 'LL';
        child = smaller;
        grandchild = larger;
      } else if (smaller > root && larger > root) {
        // Both children are to the right - RR case
        currentCase = 'RR';
        child = larger;
        grandchild = smaller;
      } else if (smaller < root && larger > root) {
        // Left-right case - LR
        currentCase = 'LR';
        child = smaller;
        grandchild = larger;
      } else if (smaller > root && larger < root) {
        // Right-left case - RL
        currentCase = 'RL';
        child = larger;
        grandchild = smaller;
      }
    } else if (chain) {
      // Chain case
      root = chain.root;
      child = chain.child;
      grandchild = chain.grandchild;
      
      if (child < root) {
        if (grandchild < child) {
          currentCase = 'LL';
        } else if (grandchild > child) {
          currentCase = 'LR';
        }
      } else if (child > root) {
        if (grandchild > child) {
          currentCase = 'RR';
        } else if (grandchild < child) {
          currentCase = 'RL';
        }
      }
    }

    if (currentCase === null) {
      return { 
        isValid: false, 
        errorIds: selectedIds, 
        message: 'Não foi possível detectar o caso AVL.' 
      };
    }

    // Check if the user selected the correct rotation type
    if (rotationType !== currentCase) {
      const rotationNames: Record<string, string> = {
        'LL': 'Rotação Simples à Direita (LL)',
        'RR': 'Rotação Simples à Esquerda (RR)',
        'LR': 'Rotação Dupla Esquerda-Direita (LR)',
        'RL': 'Rotação Dupla Direita-Esquerda (RL)'
      };
      return { 
        isValid: false, 
        errorIds: selectedIds, 
        message: `Rotação incorreta! Este caso requer: ${rotationNames[currentCase]}` 
      };
    }

    return { isValid: true, errorIds: [], message: '' };
  };

  const handleManualRotation = (rotationType: 'LL' | 'RR' | 'LR' | 'RL') => {
    if (selectedNodesForRotation.length !== 3) {
      alert("Selecione exatamente 3 nós para aplicar a rotação.");
      return;
    }

    // Validate the rotation selection
    const validation = validateRotationCorrectness(selectedNodesForRotation, edges, rotationType);
    
    if (!validation.isValid) {
      // Show error - paint nodes red
      setErrorNodesForRotation(validation.errorIds);
      setErrorMessage(validation.message);
      
      // Clear selection but keep error state for visual feedback
      setSelectedNodesForRotation([]);
      return;
    }

    // If validation passes, clear any previous error state
    setErrorNodesForRotation([]);
    setErrorMessage('');

    const [rootId, leftId, rightId] = selectedNodesForRotation;
    const selectedNodes = nodes.filter(n => selectedNodesForRotation.includes(n.id));
    
    // Calculate center position for the balanced structure
    const centerX = selectedNodes.reduce((sum, n) => sum + n.x, 0) / 3;
    const centerY = selectedNodes.reduce((sum, n) => sum + n.y, 0) / 3;

    // Determine the new parent for each rotation type
    let newParentId: number;
    let oldParentId: number;
    
    switch (rotationType) {
      case 'LL':
      case 'RR':
        newParentId = rootId;
        oldParentId = rootId;
        break;
      case 'LR':
        newParentId = leftId;
        oldParentId = rootId;
        break;
      case 'RL':
        newParentId = rightId;
        oldParentId = rootId;
        break;
      default:
        return;
    }

    // Collect external edges and redirect them to the new parent
    const redirectedEdges: Edge[] = [];
    edges.forEach(edge => {
      // Skip edges between selected nodes (they'll be recreated)
      if (selectedNodesForRotation.includes(edge.sourceId) && selectedNodesForRotation.includes(edge.targetId)) {
        return;
      }
      
      // If old parent is involved, redirect to new parent
      if (edge.sourceId === oldParentId) {
        redirectedEdges.push({ ...edge, sourceId: newParentId });
      } else if (edge.targetId === oldParentId) {
        redirectedEdges.push({ ...edge, targetId: newParentId });
      }
    });

    // Keep edges that don't involve the selected nodes at all
    const externalEdges = edges.filter(e => 
      !selectedNodesForRotation.includes(e.sourceId) && 
      !selectedNodesForRotation.includes(e.targetId)
    );

    let newNodes: Node[];
    let newEdges: Edge[];

    switch (rotationType) {
      case 'LL':
        // root becomes the new root, left stays, right becomes child
        newNodes = nodes.map(node => {
          if (node.id === rootId) return { ...node, x: centerX, y: centerY - 80 };
          if (node.id === leftId) return { ...node, x: centerX - 80, y: centerY + 40 };
          if (node.id === rightId) return { ...node, x: centerX + 80, y: centerY + 40 };
          return node;
        });
        // Combine external edges + redirected edges + new balanced edges
        newEdges = [
          ...externalEdges,
          ...redirectedEdges,
          { sourceId: rootId, targetId: leftId, weight: 1 },
          { sourceId: rootId, targetId: rightId, weight: 1 }
        ];
        break;
      case 'RR':
        newNodes = nodes.map(node => {
          if (node.id === rootId) return { ...node, x: centerX, y: centerY - 80 };
          if (node.id === leftId) return { ...node, x: centerX - 80, y: centerY + 40 };
          if (node.id === rightId) return { ...node, x: centerX + 80, y: centerY + 40 };
          return node;
        });
        newEdges = [
          ...externalEdges,
          ...redirectedEdges,
          { sourceId: rootId, targetId: leftId, weight: 1 },
          { sourceId: rootId, targetId: rightId, weight: 1 }
        ];
        break;
      case 'LR':
        // For LR: left node becomes root, root becomes right child
        newNodes = nodes.map(node => {
          if (node.id === leftId) return { ...node, x: centerX, y: centerY - 80 };
          if (node.id === rootId) return { ...node, x: centerX + 80, y: centerY + 40 };
          if (node.id === rightId) return { ...node, x: centerX - 80, y: centerY + 40 };
          return node;
        });
        newEdges = [
          ...externalEdges,
          ...redirectedEdges,
          { sourceId: leftId, targetId: rightId, weight: 1 },
          { sourceId: leftId, targetId: rootId, weight: 1 }
        ];
        break;
      case 'RL':
        // For RL: right node becomes root, root becomes left child
        newNodes = nodes.map(node => {
          if (node.id === rightId) return { ...node, x: centerX, y: centerY - 80 };
          if (node.id === rootId) return { ...node, x: centerX - 80, y: centerY + 40 };
          if (node.id === leftId) return { ...node, x: centerX + 80, y: centerY + 40 };
          return node;
        });
        newEdges = [
          ...externalEdges,
          ...redirectedEdges,
          { sourceId: rightId, targetId: leftId, weight: 1 },
          { sourceId: rightId, targetId: rootId, weight: 1 }
        ];
        break;
      default:
        return;
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodesForRotation([]);
    // Clear error state after successful rotation
    setErrorNodesForRotation([]);
    setErrorMessage('');
  };

  // --- LÓGICA DO MODO SANDBOX RESTAURADA ---
  const renderAdjacencyList = () => {
    return nodes.map(node => {
      const neighbors = edges.filter(e => e.sourceId === node.id).map(e => `${e.targetId}(w:${e.weight})`);
      if (!isDirected) {
        const reverseNeighbors = edges.filter(e => e.targetId === node.id).map(e => `${e.sourceId}(w:${e.weight})`);
        neighbors.push(...reverseNeighbors);
      }
      return <div key={node.id} className="text-xs font-mono text-slate-300 border-b border-ponto-muted/30 py-1"><span className="font-bold text-ponto-accent">{node.id}</span>: [{neighbors.join(', ')}]</div>;
    });
  };

  const runAlgorithmSandbox = () => {
    const startId = parseInt(startNodeId);
    if (isNaN(startId) || !nodes.find(n => n.id === startId)) { alert("Nó inválido. Adicione o ID de início."); return; }
    
    let steps = selectedAlgo === 'BFS' ? generateBFSSteps(startId, nodes.length, edges, isDirected) : generateDFSSteps(startId, nodes.length, edges, isDirected);
    
    setIsAnimating(true); setVisitedNodes(new Set()); setQueueNodes(new Set());
    
    let currentStep = 0;
    const intervalId = setInterval(() => {
      if (currentStep >= steps.length) { clearInterval(intervalId); setIsAnimating(false); return; }
      const step = steps[currentStep];
      if (step.type === 'queue') setQueueNodes(prev => new Set(prev).add(step.nodeId));
      else if (step.type === 'visit') {
        setQueueNodes(prev => { const n = new Set(prev); n.delete(step.nodeId); return n; });
        setVisitedNodes(prev => new Set(prev).add(step.nodeId));
      }
      currentStep++;
    }, 700);
  };

  const deleteNode = (id: number) => { setNodes(nodes.filter(n => n.id !== id)); setEdges(edges.filter(e => e.sourceId !== id && e.targetId !== id)); };
  const deleteEdge = (index: number) => setEdges(edges.filter((_, i) => i !== index));
  
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: number) => { if (appMode === 'game') return; if (activeTool === 'cursor') { e.stopPropagation(); setDraggingNodeId(nodeId); } };
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => { if (appMode === 'game') return; if (draggingNodeId !== null && activeTool === 'cursor') { const rect = e.currentTarget.getBoundingClientRect(); setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: e.clientX - rect.left, y: e.clientY - rect.top } : n)); } };
  const handleMouseUp = () => { if (draggingNodeId !== null) setDraggingNodeId(null); };

  // Função chamada ao clicar no canvas (área de desenho)
  // Permite criar nós em posições específicas
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (appMode === 'game') return; // Não permite criar nós no modo jogo
    if (activeTool === 'add-node') {
      const rect = e.currentTarget.getBoundingClientRect();
      
      // Determina o ID do nó: usa ID personalizado se fornecido, caso contrário gera automaticamente
      let newId: number;
      const customId = customNodeId.trim();
      
      if (customId !== '') {
        // Se o usuário forneceu um ID customizado
        const parsedId = parseInt(customId);
        if (isNaN(parsedId)) {
          alert('ID inválido. Use um número inteiro.');
          return;
        }
        if (nodes.some(n => n.id === parsedId)) {
          alert('Este ID já existe. Escolha outro.');
          return;
        }
        newId = parsedId;
      } else {
        // Gera automaticamente o menor ID disponível
        const usedIds = new Set(nodes.map(n => n.id));
        newId = 0;
        while (usedIds.has(newId)) {
          newId++;
        }
      }
      
      // Cria o novo nó na posição clicada
      setNodes([...nodes, { id: newId, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    }
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: number) => {
    e.stopPropagation();
    if (appMode === 'game') { handleGameNodeClick(nodeId); return; }
    if (activeTool === 'delete') { deleteNode(nodeId); return; }
    
    // Handle node selection for rotation
    if (activeTool === 'select-rotation') {
      // Clear error when user starts selecting new nodes
      if (errorNodesForRotation.length > 0) {
        setErrorNodesForRotation([]);
        setErrorMessage('');
      }
      
      if (selectedNodesForRotation.includes(nodeId)) {
        // Deselect node
        setSelectedNodesForRotation(selectedNodesForRotation.filter(id => id !== nodeId));
      } else if (selectedNodesForRotation.length < 3) {
        // Select node (max 3)
        setSelectedNodesForRotation([...selectedNodesForRotation, nodeId]);
      }
      return;
    }
    
    if (activeTool === 'add-edge') {
      if (connectionSourceId === null) setConnectionSourceId(nodeId);
      else {
        if (connectionSourceId !== nodeId) {
          const exists = edges.some(edge => (edge.sourceId === connectionSourceId && edge.targetId === nodeId) || (!isDirected && edge.sourceId === nodeId && edge.targetId === connectionSourceId));
          if (!exists) {
             const w = parseInt(prompt("Peso da aresta:", "1") || "1") || 1;
             setEdges([...edges, { sourceId: connectionSourceId, targetId: nodeId, weight: w }]);
          }
        }
        setConnectionSourceId(null);
      }
    }
  };

  const clearAll = () => { setNodes([]); setEdges([]); setVisitedNodes(new Set()); setQueueNodes(new Set()); setIsAnimating(false); setSelectedNodesForRotation([]); setErrorNodesForRotation([]); setErrorMessage(''); };
  const getNode = (id: number) => nodes.find(n => n.id === id);

  const renderSidebarContent = () => {
    const currentLevel = LEVELS[currentLevelIndex];
    if (appMode === 'game') {
      return (
        <div className="space-y-6">
          {/* SELETOR DE FASES - Adaptado para o Tema Escuro */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-ponto-accent uppercase tracking-widest">Escolher Nível</h3>
            <div className="flex gap-2">
              {LEVELS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentLevelIndex(idx)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all border-2 ${
                    currentLevelIndex === idx
                    ? 'bg-ponto-accent text-ponto-darker border-ponto-accent shadow-md scale-110'
                    : 'bg-ponto-darker text-slate-400 border-ponto-muted hover:border-ponto-accent hover:text-ponto-accent'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-ponto-darker text-white rounded-xl p-5 shadow-lg border-2 border-ponto-muted relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-ponto-muted text-ponto-accent text-xs font-bold px-3 py-1 rounded-bl-lg">
              {currentLevel.algo}
            </div>
            <h2 className="text-lg font-bold mb-2 mt-2 text-ponto-accent">🎯 {currentLevel.title}</h2>
            <p className="text-sm text-slate-300 mb-4">{currentLevel.description}</p>

            <div className="bg-ponto-dark rounded p-3 mb-4 flex justify-between items-center">
              <span className="font-semibold text-slate-400 text-sm">Vidas:</span>
              <span className="text-xl tracking-widest">
                {Array.from({length: 3}).map((_, i) => i < lives ? '❤️' : '🖤').join('')}
              </span>
            </div>

            {currentLevel.algo === 'AVL' && gameStatus === 'playing' && (
              <div className="space-y-3 mt-4">
                <p className="text-xs font-bold text-ponto-accent uppercase text-center">Qual rotação resolve este caso?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleRotationChallenge('left')}
                    className="flex flex-col items-center gap-2 bg-ponto-dark hover:bg-ponto-muted text-white p-3 rounded-lg border-b-4 border-slate-900 transition-all active:border-b-0 active:translate-y-1"
                  >
                    <RotateCcw size={20} className="scale-x-[-1]" />
                    <span className="text-[10px] font-bold">ESQUERDA (RR)</span>
                  </button>
                  <button
                    onClick={() => handleRotationChallenge('right')}
                    className="flex flex-col items-center gap-2 bg-ponto-dark hover:bg-ponto-muted text-white p-3 rounded-lg border-b-4 border-slate-900 transition-all active:border-b-0 active:translate-y-1"
                  >
                    <RotateCcw size={20} />
                    <span className="text-[10px] font-bold">DIREITA (LL)</span>
                  </button>
                </div>
              </div>
            )}

            {gameStatus === 'won' && <div className="bg-ponto-accent text-ponto-darker font-bold p-3 rounded text-center animate-bounce mb-3 mt-3">🏆 Concluído!</div>}
            {gameStatus === 'lost' && <div className="bg-red-500 text-white font-bold p-3 rounded text-center mb-3 mt-3">💀 Tente Novamente!</div>}

            {gameStatus !== 'playing' && (
               <button onClick={gameStatus === 'won' ? nextLevel : resetGame} className="w-full bg-slate-200 text-ponto-darker font-bold py-2 rounded shadow-sm hover:bg-white transition-colors">
                 {gameStatus === 'won' ? 'Próxima Fase' : '🔄 Recomeçar'}
               </button>
            )}
          </div>
          
          {currentLevel.algo !== 'AVL' && (
            <div className="border-t border-ponto-muted/30 pt-4">
              <h3 className="text-sm font-bold text-ponto-accent uppercase tracking-wider mb-2">Progresso do Algoritmo</h3>
              <div className="flex gap-2 flex-wrap">
                {playerPath.map((id, index) => (
                  <div key={index} className="w-8 h-8 rounded-full bg-ponto-accent/20 border-2 border-ponto-accent flex items-center justify-center font-bold text-ponto-accent shadow-sm">{id}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
          {/* Seção para configurar o ID do nó antes de criá-lo */}
          <div>
            <h2 className="text-sm font-bold text-ponto-accent uppercase tracking-wider mb-4">Criar Nó</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                 <input 
                   type="text" 
                   placeholder="ID do nó (deixe vazio para auto)" 
                   value={customNodeId} 
                   onChange={(e) => setCustomNodeId(e.target.value)} 
                   className="w-full rounded-md border border-ponto-muted bg-ponto-darker text-white px-3 py-2 text-sm focus:border-ponto-accent focus:outline-none placeholder-slate-500"
                 />
              </div>
              {customNodeId !== '' && (
                <p className="text-xs text-slate-400">
                  O próximo nó terá ID = {customNodeId}
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-ponto-accent uppercase tracking-wider mb-4">Executar (Sandbox)</h2>
            <div className="space-y-3">
              <select value={selectedAlgo} onChange={(e) => setSelectedAlgo(e.target.value as any)} className="w-full rounded-md border border-ponto-muted bg-ponto-darker text-white px-3 py-2 text-sm focus:border-ponto-accent focus:outline-none">
                <option value="BFS">Breadth-First Search (BFS)</option>
                <option value="DFS">Depth-First Search (DFS)</option>
              </select>
              <div className="flex gap-2">
                 <input type="text" placeholder="Início (ID)" value={startNodeId} onChange={(e) => setStartNodeId(e.target.value)} className="w-full rounded-md border border-ponto-muted bg-ponto-darker text-white px-3 py-2 text-sm focus:border-ponto-accent focus:outline-none placeholder-slate-500"/>
              </div>
              <button onClick={runAlgorithmSandbox} disabled={isAnimating} className={`flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all shadow-md ${isAnimating ? 'bg-ponto-muted cursor-not-allowed text-slate-300' : 'bg-ponto-accent text-ponto-darker hover:brightness-110'}`}>
                {isAnimating ? <RotateCcw size={18} className="animate-spin"/> : <Play size={18} />}
                {isAnimating ? 'Rodando...' : `Animar ${selectedAlgo}`}
              </button>
            </div>
          </div>

          {/* SEÇÃO DE ROTAÇÕES AVL - BOTÕES MANUAIS */}
          <div className="border-t border-ponto-muted/30 pt-4">
            <h2 className="text-sm font-bold text-ponto-accent uppercase tracking-wider mb-4">Rotações AVL</h2>
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                {selectedNodesForRotation.length === 0 
                  ? "Selecione a ferramenta de rotação (ícone de seta) e clique em 3 nós no grafo" 
                  : selectedNodesForRotation.length < 3 
                    ? `Nós selecionados: ${selectedNodesForRotation.length}/3`
                    : "3 nós selecionados! Escolha a rotação:"}
              </p>
              
              {/* Error message display */}
              {errorMessage && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 text-xs p-3 rounded-lg mb-3 animate-pulse">
                  <span className="font-bold">❌ Erro:</span> {errorMessage}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleManualRotation('LL')}
                  disabled={selectedNodesForRotation.length !== 3}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-b-4 transition-all active:border-b-0 active:translate-y-1 ${
                    selectedNodesForRotation.length !== 3 
                      ? 'bg-ponto-muted/30 border-slate-900 text-slate-500 cursor-not-allowed' 
                      : 'bg-ponto-dark hover:bg-ponto-muted border-slate-900 text-white'
                  }`}
                >
                  <RotateCcw size={20} />
                  <span className="text-[10px] font-bold">LL (Dir.)</span>
                </button>
                <button
                  onClick={() => handleManualRotation('RR')}
                  disabled={selectedNodesForRotation.length !== 3}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-b-4 transition-all active:border-b-0 active:translate-y-1 ${
                    selectedNodesForRotation.length !== 3 
                      ? 'bg-ponto-muted/30 border-slate-900 text-slate-500 cursor-not-allowed' 
                      : 'bg-ponto-dark hover:bg-ponto-muted border-slate-900 text-white'
                  }`}
                >
                  <RotateCcw size={20} className="scale-x-[-1]" />
                  <span className="text-[10px] font-bold">RR (Esq.)</span>
                </button>
                <button
                  onClick={() => handleManualRotation('LR')}
                  disabled={selectedNodesForRotation.length !== 3}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-b-4 transition-all active:border-b-0 active:translate-y-1 ${
                    selectedNodesForRotation.length !== 3 
                      ? 'bg-ponto-muted/30 border-slate-900 text-slate-500 cursor-not-allowed' 
                      : 'bg-ponto-dark hover:bg-ponto-muted border-slate-900 text-white'
                  }`}
                >
                  <RotateCcw size={20} />
                  <span className="text-[10px] font-bold">LR (Esq.-Dir.)</span>
                </button>
                <button
                  onClick={() => handleManualRotation('RL')}
                  disabled={selectedNodesForRotation.length !== 3}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-b-4 transition-all active:border-b-0 active:translate-y-1 ${
                    selectedNodesForRotation.length !== 3 
                      ? 'bg-ponto-muted/30 border-slate-900 text-slate-500 cursor-not-allowed' 
                      : 'bg-ponto-dark hover:bg-ponto-muted border-slate-900 text-white'
                  }`}
                >
                  <RotateCcw size={20} className="scale-x-[-1]" />
                  <span className="text-[10px] font-bold">RL (Dir.-Esq.)</span>
                </button>
              </div>
              {selectedNodesForRotation.length > 0 && (
                <button 
                  onClick={() => {
                    setSelectedNodesForRotation([]);
                    setErrorNodesForRotation([]);
                    setErrorMessage('');
                  }}
                  className="w-full text-xs text-slate-400 hover:text-white py-1"
                >
                  Limpar seleção ({selectedNodesForRotation.join(', ')})
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-ponto-muted/30 pt-4">
             <h2 className="text-sm font-bold text-ponto-accent uppercase tracking-wider mb-2">Lista de Adjacência</h2>
             <div className="bg-ponto-darker rounded-lg border border-ponto-muted p-3 h-48 overflow-y-auto font-mono text-xs shadow-inner">
               {nodes.length === 0 ? <span className="text-slate-500 italic">Grafo vazio</span> : renderAdjacencyList()}
             </div>
          </div>
      </div>
    );
  };

  // === TELA DE CARREGAMENTO (SPLASH SCREEN) ===
  if (showSplash) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-ponto-darker">
        <img src="src\assets\logo_transparente.png" alt="Ponto a Ponto Logo" className="w-64 md:w-80 animate-pulse mb-8" />
        <div className="flex gap-3">
          <div className="w-3 h-3 bg-ponto-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-ponto-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-ponto-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-ponto-accent mt-4 font-mono text-sm tracking-widest uppercase">Carregando Visualizador...</p>
      </div>
    );
  }

  // === APLICAÇÃO PRINCIPAL ===
  return (
    <div className="flex h-screen flex-col bg-[#f8fafc] text-slate-900 font-sans">
      <header className="flex items-center justify-between border-b border-ponto-muted bg-ponto-darker px-6 py-3 shadow-md z-10">
        <div className="flex items-center gap-6">
          <img src="src\assets\logo_transparente.png" alt="Ponto a Ponto" className="h-16" />
          <div className="flex bg-ponto-dark p-1 rounded-lg border border-ponto-muted">
            <button onClick={() => { setAppMode('sandbox'); clearAll(); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${appMode === 'sandbox' ? 'bg-ponto-accent text-ponto-darker shadow-sm' : 'text-slate-300 hover:text-ponto-accent'}`}><Wrench size={16} /> Construir (Livre)</button>
            <button onClick={() => { setAppMode('game'); setCurrentLevelIndex(0); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${appMode === 'game' ? 'bg-ponto-accent text-ponto-darker shadow-sm' : 'text-slate-300 hover:text-ponto-accent'}`}><Gamepad2 size={16} /> Modo Desafio</button>
          </div>
          
          {appMode === 'sandbox' && (
            <>
              <div className="w-px h-6 bg-ponto-muted mx-2"></div>
              <div className="flex items-center gap-1 rounded-lg bg-ponto-dark p-1 border border-ponto-muted">
                <button onClick={() => setActiveTool('cursor')} className={`p-1.5 rounded transition-colors ${activeTool === 'cursor' ? 'bg-ponto-accent text-ponto-darker' : 'text-slate-300 hover:bg-ponto-muted/50'}`}><MousePointer2 size={18} /></button>
                <button onClick={() => setActiveTool('add-node')} className={`p-1.5 rounded transition-colors ${activeTool === 'add-node' ? 'bg-ponto-accent text-ponto-darker' : 'text-slate-300 hover:bg-ponto-muted/50'}`}><Circle size={18} /></button>
                <button onClick={() => setActiveTool('add-edge')} className={`p-1.5 rounded transition-colors ${activeTool === 'add-edge' ? 'bg-ponto-accent text-ponto-darker' : 'text-slate-300 hover:bg-ponto-muted/50'}`}><MoveUpRight size={18} /></button>
                <button onClick={() => setActiveTool('delete')} className={`p-1.5 rounded transition-colors ${activeTool === 'delete' ? 'bg-red-500 text-white' : 'text-slate-300 hover:bg-red-500/20 hover:text-red-400'}`}><Eraser size={18} /></button>
                <button onClick={() => setActiveTool('select-rotation')} className={`p-1.5 rounded transition-colors ${activeTool === 'select-rotation' ? 'bg-ponto-accent text-ponto-darker' : 'text-slate-300 hover:bg-ponto-muted/50'}`} title="Selecionar nós para rotação"><RotateCcw size={18} /></button>
              </div>
              <button onClick={() => { setEdges([]); setIsDirected(!isDirected); }} className="flex items-center gap-2 rounded-full border border-ponto-muted px-3 py-1 text-xs font-semibold uppercase text-slate-300 hover:bg-ponto-dark">
                {isDirected ? <ArrowRight size={14} className="text-ponto-accent"/> : <ArrowRightLeft size={14} className="text-slate-400"/>}
                {isDirected ? 'Direcionado' : 'Não Direcionado'}
              </button>
              <button onClick={clearAll} className="flex items-center gap-2 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded text-sm font-medium transition-colors ml-auto"><Trash2 size={16} /> Limpar Tudo</button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 bg-slate-50 relative">
          <svg className={`w-full h-full ${appMode === 'game' ? 'cursor-default' : activeTool === 'add-node' ? 'cursor-crosshair' : activeTool === 'delete' ? 'cursor-not-allowed' : activeTool === 'select-rotation' ? 'pointer' : 'cursor-default'}`} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={handleCanvasClick}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#2c6455" /></marker>
            </defs>
            {edges.map((edge, i) => {
              const s = getNode(edge.sourceId); const t = getNode(edge.targetId);
              if (!s || !t) return null;
              const midX = (s.x + t.x) / 2; const midY = (s.y + t.y) / 2;
              return (
                <g key={i} onClick={(e) => { e.stopPropagation(); if (appMode === 'sandbox' && activeTool === 'delete') deleteEdge(i); }} className={`group ${appMode === 'sandbox' && activeTool === 'delete' ? 'cursor-pointer' : ''}`}>
                  <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="transparent" strokeWidth="15" />
                  <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#2c6455" strokeWidth="3" markerEnd={isDirected ? "url(#arrowhead)" : undefined} className={`transition-colors opacity-60 ${appMode === 'sandbox' && activeTool === 'delete' ? 'group-hover:stroke-red-500 opacity-100' : ''}`} />
                  {appMode === 'sandbox' && <rect x={midX - 10} y={midY - 10} width="20" height="20" rx="4" fill="#05272d" className="stroke-[#3aebb9] stroke-1" />}
                  {appMode === 'sandbox' && <text x={midX} y={midY} dy=".3em" textAnchor="middle" className="text-[10px] font-bold fill-[#3aebb9] select-none pointer-events-none">{edge.weight}</text>}
                </g>
              );
            })}
            {nodes.map((node) => {
                let fillColor = "fill-ponto-darker"; 
                let strokeColor = "stroke-ponto-accent";
                let textColor = "fill-ponto-accent";

                if (visitedNodes.has(node.id)) { 
                  fillColor = "fill-ponto-accent"; 
                  strokeColor = "stroke-ponto-muted"; 
                  textColor = "fill-ponto-darker";
                }
                else if (queueNodes.has(node.id)) { 
                  fillColor = "fill-yellow-400"; 
                  strokeColor = "stroke-yellow-600";
                  textColor = "fill-slate-900";
                }
                
                // Highlight selected nodes for rotation
                const isSelectedForRotation = activeTool === 'select-rotation' && selectedNodesForRotation.includes(node.id);
                const isErrorNode = errorNodesForRotation.includes(node.id);
                
                if (isErrorNode) {
                  fillColor = "fill-red-600";
                  strokeColor = "stroke-red-300";
                  textColor = "fill-white";
                } else if (isSelectedForRotation) {
                  fillColor = "fill-purple-500";
                  strokeColor = "stroke-purple-300";
                  textColor = "fill-white";
                }

                return (
                  <g 
                    key={node.id} 
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)} 
                    onClick={(e) => handleNodeClick(e, node.id)} 
                    className={`transition-all duration-500 ease-out group cursor-pointer hover:scale-105 ${isRotating ? 'node-rotating' : ''}`}
                  >
                    <circle cx={node.x} cy={node.y} r={22} className={`stroke-[3px] transition-colors duration-300 ${fillColor} ${strokeColor} shadow-md ${connectionSourceId === node.id ? 'stroke-white stroke-[4px]' : ''} ${isSelectedForRotation ? 'animate-pulse' : ''}`} />
                    <text x={node.x} y={node.y} dy=".3em" textAnchor="middle" className={`font-bold text-sm pointer-events-none select-none ${textColor}`}>{node.id}</text>
                  </g>
                );
            })}
          </svg>
        </main>
        
        <aside className="w-80 bg-ponto-dark border-l border-ponto-muted/50 p-6 shadow-xl z-10 flex flex-col gap-6 overflow-y-auto">
          {renderSidebarContent()}
        </aside>
      </div>
    </div>
  );
}

export default App;