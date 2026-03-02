import React, { useState, useEffect } from 'react';
import { Circle, Play, Trash2, MousePointer2, MoveUpRight, RotateCcw, ArrowRightLeft, ArrowRight, Eraser, Gamepad2, Wrench } from 'lucide-react';
import { generateBFSSteps } from './algorithms/bfs';
import { generateDFSSteps } from './algorithms/dfs';
import { performRightRotation } from './algorithms/avl';
import { getBalancedEdges } from './algorithms/balancing';

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
  const [appMode, setAppMode] = useState<'sandbox' | 'game'>('sandbox');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isDirected, setIsDirected] = useState(false);
  const [activeTool, setActiveTool] = useState<'cursor' | 'add-node' | 'add-edge' | 'delete'>('add-node');
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [visitedNodes, setVisitedNodes] = useState<Set<number>>(new Set());
  const [queueNodes, setQueueNodes] = useState<Set<number>>(new Set());

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
      alert("🎉 TCC Finalizado com sucesso!");
      setCurrentLevelIndex(0);
    }
  };

  const handleRotateRight = () => {
    if (currentLevelIndex === 2 && gameStatus === 'playing') {
      const balancedNodes = performRightRotation(nodes);
      const balancedEdges = getBalancedEdges(1, 0, 2);
      setNodes(balancedNodes);
      setEdges(balancedEdges);
      setGameStatus('won');
      setVisitedNodes(new Set([0, 1, 2]));
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

  // Na Fase 3, o grafo está "caído" para a esquerda (2 -> 1 -> 0)
  // O acerto técnico é a Rotação à DIREITA (Right Rotation / LL Case)
  const isCorrect = direction === 'right';

  if (isCorrect) {
    const balancedNodes = performRightRotation(nodes);
    const balancedEdges = getBalancedEdges(1, 0, 2);

    setNodes(balancedNodes);
    setEdges(balancedEdges);
    setGameStatus('won');
    setVisitedNodes(new Set([0, 1, 2]));
  } else {
    // Se errar a direção da rotação, perde vida
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      setGameStatus('lost');
    }
  }
};

  const clearAll = () => { setNodes([]); setEdges([]); setVisitedNodes(new Set()); setQueueNodes(new Set()); setIsAnimating(false); };
  const getNode = (id: number) => nodes.find(n => n.id === id);

  const renderSidebarContent = () => {
    const currentLevel = LEVELS[currentLevelIndex];
    if (appMode === 'game') {
      return (
        <div className="space-y-6">
          {/* SELETOR DE FASES (NOVO) */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Escolher Nível</h3>
            <div className="flex gap-2">
              {LEVELS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentLevelIndex(idx)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all border-2 ${
                    currentLevelIndex === idx
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md scale-110'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-purple-300 hover:text-purple-500'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 text-white rounded-xl p-5 shadow-lg border-2 border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-purple-600 text-xs font-bold px-3 py-1 rounded-bl-lg">
              {currentLevel.algo}
            </div>
            <h2 className="text-lg font-bold mb-2 mt-2">🎯 {currentLevel.title}</h2>
            <p className="text-sm text-slate-300 mb-4">{currentLevel.description}</p>

            <div className="bg-slate-900 rounded p-3 mb-4 flex justify-between items-center">
              <span className="font-semibold text-slate-400 text-sm">Vidas:</span>
              <span className="text-xl tracking-widest">
                {Array.from({length: 3}).map((_, i) => i < lives ? '❤️' : '🖤').join('')}
              </span>
            </div>

            {/* Dentro do renderSidebarContent, na condição do modo game */}
            {currentLevel.algo === 'AVL' && gameStatus === 'playing' && (
              <div className="space-y-3 mt-4">
                <p className="text-xs font-bold text-blue-400 uppercase text-center">Qual rotação resolve este caso?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleRotationChallenge('left')}
                    className="flex flex-col items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg border-b-4 border-slate-900 transition-all active:border-b-0 active:translate-y-1"
                  >
                    <RotateCcw size={20} className="scale-x-[-1]" />
                    <span className="text-[10px] font-bold">ESQUERDA (RR)</span>
                  </button>

                  <button
                    onClick={() => handleRotationChallenge('right')}
                    className="flex flex-col items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg border-b-4 border-slate-900 transition-all active:border-b-0 active:translate-y-1"
                  >
                    <RotateCcw size={20} />
                    <span className="text-[10px] font-bold">DIREITA (LL)</span>
                  </button>
                </div>
              </div>
            )}

            {gameStatus === 'won' && <div className="bg-green-500 text-white font-bold p-3 rounded text-center animate-bounce mb-3">🏆 Concluído!</div>}
            {gameStatus === 'lost' && <div className="bg-red-500 text-white font-bold p-3 rounded text-center mb-3">💀 Tente Novamente!</div>}

            {gameStatus !== 'playing' && (
               <button onClick={gameStatus === 'won' ? nextLevel : resetGame} className="w-full bg-white text-slate-900 font-bold py-2 rounded shadow-sm hover:bg-slate-100 transition-colors">
                 {gameStatus === 'won' ? 'Próxima Fase' : '🔄 Recomeçar'}
               </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Modo Sandbox</h2>
        <button onClick={clearAll} className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-200 py-2 rounded hover:bg-red-50 transition-colors">
          <Trash2 size={16} /> Limpar Tudo
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm z-10">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">GraphEdu</h1>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button onClick={() => setAppMode('sandbox')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${appMode === 'sandbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><Wrench size={16} /> Sandbox</button>
            <button onClick={() => setAppMode('game')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${appMode === 'game' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500'}`}><Gamepad2 size={16} /> Desafios</button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 bg-white relative">
          <svg className="w-full h-full" onClick={(e) => { if (appMode !== 'game' && activeTool === 'add-node') { /* lógica sandbox */ } }}>
            {edges.map((edge, i) => {
              const s = getNode(edge.sourceId); const t = getNode(edge.targetId);
              if (!s || !t) return null;
              return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#cbd5e1" strokeWidth="3" className="transition-all duration-500" />;
            })}
            {nodes.map((node) => (
              <g key={node.id} onClick={(e) => { e.stopPropagation(); if (appMode === 'game') handleGameNodeClick(node.id); }} className="cursor-pointer">
                <circle cx={node.x} cy={node.y} r={22} className={`stroke-[3px] transition-all duration-500 ${visitedNodes.has(node.id) ? 'fill-green-500 stroke-green-600' : 'fill-white stroke-blue-500'}`} />
                <text x={node.x} y={node.y} dy=".3em" textAnchor="middle" className={`font-bold text-sm transition-all duration-500 ${visitedNodes.has(node.id) ? 'fill-white' : 'fill-slate-700'}`}>{node.id}</text>
              </g>
            ))}
          </svg>
        </main>
        <aside className="w-80 bg-white border-l p-6 shadow-xl overflow-y-auto">
          {renderSidebarContent()}
        </aside>
      </div>
    </div>
  );
}

export default App;