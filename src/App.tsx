import React, { useState, useEffect } from 'react';
import { Circle, Play, Trash2, MousePointer2, MoveUpRight, RotateCcw, ArrowRightLeft, ArrowRight, Eraser, Gamepad2, Wrench } from 'lucide-react';
import { generateBFSSteps } from './algorithms/bfs';
import { generateDFSSteps } from './algorithms/dfs';

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

  // --- ESTADOS DE ANIMAÇÃO E EXECUÇÃO ---
  const [selectedAlgo, setSelectedAlgo] = useState<'BFS' | 'DFS'>('BFS');
  const [startNodeId, setStartNodeId] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [visitedNodes, setVisitedNodes] = useState<Set<number>>(new Set());
  const [queueNodes, setQueueNodes] = useState<Set<number>>(new Set());

  // Carrega a fase sempre que mudar de nível no modo jogo
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
      alert("🎉 Parabéns! Você zerou todas as fases disponíveis!");
      setCurrentLevelIndex(0); 
    }
  };

  const handleGameNodeClick = (nodeId: number) => {
    if (gameStatus !== 'playing') return;
    if (playerPath.includes(nodeId)) return; 

    const currentLevel = LEVELS[currentLevelIndex];
    const nextExpectedIndex = playerPath.length;
    const expectedNodeId = currentLevel.expectedVisits[nextExpectedIndex];

    if (nodeId === expectedNodeId) {
      const newPath = [...playerPath, nodeId];
      setPlayerPath(newPath);
      setVisitedNodes(prev => new Set(prev).add(nodeId));

      if (newPath.length === currentLevel.expectedVisits.length) {
        setGameStatus('won');
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setGameStatus('lost');
      }
    }
  };

  // --- LÓGICA DO MODO SANDBOX RESTAURADA ---
  const renderAdjacencyList = () => {
    return nodes.map(node => {
      const neighbors = edges.filter(e => e.sourceId === node.id).map(e => `${e.targetId}(w:${e.weight})`);
      if (!isDirected) {
        const reverseNeighbors = edges.filter(e => e.targetId === node.id).map(e => `${e.sourceId}(w:${e.weight})`);
        neighbors.push(...reverseNeighbors);
      }
      return <div key={node.id} className="text-xs font-mono text-slate-600 border-b border-slate-100 py-1"><span className="font-bold text-blue-600">{node.id}</span>: [{neighbors.join(', ')}]</div>;
    });
  };

  const runAlgorithmSandbox = () => {
    const startId = parseInt(startNodeId);
    if (isNaN(startId) || !nodes.find(n => n.id === startId)) { alert("Nó inválido. Adicione o ID de início corretamente."); return; }
    
    let steps = selectedAlgo === 'BFS' ? generateBFSSteps(startId, nodes.length, edges, isDirected) : generateDFSSteps(startId, nodes.length, edges, isDirected);
    
    setIsAnimating(true); 
    setVisitedNodes(new Set()); 
    setQueueNodes(new Set());
    
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

  const deleteNode = (id: number) => {
    setNodes(nodes.filter(n => n.id !== id));
    setEdges(edges.filter(e => e.sourceId !== id && e.targetId !== id));
  };
  const deleteEdge = (index: number) => setEdges(edges.filter((_, i) => i !== index));
  
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: number) => {
    if (appMode === 'game') return; 
    if (activeTool === 'cursor') { e.stopPropagation(); setDraggingNodeId(nodeId); } 
  };
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (appMode === 'game') return;
    if (draggingNodeId !== null && activeTool === 'cursor') {
      const rect = e.currentTarget.getBoundingClientRect();
      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: e.clientX - rect.left, y: e.clientY - rect.top } : n));
    }
  };
  const handleMouseUp = () => { if (draggingNodeId !== null) setDraggingNodeId(null); };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (appMode === 'game') return;
    if (activeTool === 'add-node') {
      const rect = e.currentTarget.getBoundingClientRect();
      const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0;
      setNodes([...nodes, { id: newId, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    }
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: number) => {
    e.stopPropagation();
    if (appMode === 'game') {
      handleGameNodeClick(nodeId);
      return;
    }
    if (activeTool === 'delete') { deleteNode(nodeId); return; }
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

  const clearAll = () => { setNodes([]); setEdges([]); setVisitedNodes(new Set()); setQueueNodes(new Set()); setIsAnimating(false); };
  const getNode = (id: number) => nodes.find(n => n.id === id);

  // --- RENDER DA BARRA LATERAL (DINÂMICO) ---
  const renderSidebarContent = () => {
    if (appMode === 'game') {
      const currentLevel = LEVELS[currentLevelIndex];
      return (
        <div className="space-y-6">
          <div className="bg-slate-800 text-white rounded-xl p-5 shadow-lg border-2 border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-purple-600 text-xs font-bold px-3 py-1 rounded-bl-lg">
              Fase {currentLevel.level} de {LEVELS.length}
            </div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-2 mt-2">🎯 {currentLevel.title}</h2>
            <p className="text-sm text-slate-300 mb-4">{currentLevel.description}</p>
            
            <div className="bg-slate-900 rounded p-3 mb-4 flex justify-between items-center">
              <span className="font-semibold text-slate-400 text-sm">Vidas:</span>
              <span className="text-xl tracking-widest">
                {Array.from({length: 3}).map((_, i) => i < lives ? '❤️' : '🖤').join('')}
              </span>
            </div>

            {gameStatus === 'won' && <div className="bg-green-500 text-white font-bold p-3 rounded text-center animate-bounce mb-3">🏆 Nível Concluído!</div>}
            {gameStatus === 'lost' && <div className="bg-red-500 text-white font-bold p-3 rounded text-center mb-3">💀 Game Over! A ordem estava errada.</div>}

            {gameStatus === 'won' ? (
               <button onClick={nextLevel} className="w-full bg-yellow-400 text-slate-900 font-bold py-2 rounded hover:bg-yellow-500 transition-colors mt-2 flex justify-center items-center gap-2">Próxima Fase <ArrowRight size={18} /></button>
            ) : (gameStatus === 'lost') ? (
              <button onClick={resetGame} className="w-full bg-white text-slate-900 font-bold py-2 rounded hover:bg-slate-200 transition-colors mt-2">🔄 Tentar Novamente</button>
            ) : null}
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Progresso do Algoritmo</h3>
            <div className="flex gap-2 flex-wrap">
              {playerPath.map((id, index) => (
                <div key={index} className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center font-bold text-green-700 shadow-sm">{id}</div>
              ))}
              {playerPath.length < currentLevel.expectedVisits.length && gameStatus === 'playing' && (
                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 animate-pulse">?</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Retorna o painel original do Sandbox!
    return (
      <div className="space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Executar (Sandbox)</h2>
            <div className="space-y-3">
              <select value={selectedAlgo} onChange={(e) => setSelectedAlgo(e.target.value as any)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="BFS">Breadth-First Search (BFS)</option>
                <option value="DFS">Depth-First Search (DFS)</option>
              </select>
              <div className="flex gap-2">
                 <input type="text" placeholder="Início (ID)" value={startNodeId} onChange={(e) => setStartNodeId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"/>
              </div>
              
              {/* BOTÃO CORRIGIDO E ATRIBUÍDO AO runAlgorithmSandbox */}
              <button onClick={runAlgorithmSandbox} disabled={isAnimating} className={`flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold text-white transition-all shadow-md ${isAnimating ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-200'}`}>
                {isAnimating ? <RotateCcw size={18} className="animate-spin"/> : <Play size={18} />}
                {isAnimating ? 'Rodando...' : `Animar ${selectedAlgo}`}
              </button>
            </div>
          </div>

          {/* LISTA DE ADJACÊNCIA RESTAURADA */}
          <div className="border-t pt-4">
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Lista de Adjacência</h2>
             <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 h-48 overflow-y-auto font-mono text-xs shadow-inner">
               {nodes.length === 0 ? <span className="text-slate-400 italic">Grafo vazio</span> : renderAdjacencyList()}
             </div>
          </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 font-sans">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm z-10">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight mr-4">GraphEdu</h1>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {/* BOTÕES DE MODO ATUALIZADOS PARA LIMPAR TELA DE FORMA SEGURA */}
            <button onClick={() => { setAppMode('sandbox'); clearAll(); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${appMode === 'sandbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><Wrench size={16} /> Construir (Livre)</button>
            <button onClick={() => { setAppMode('game'); setCurrentLevelIndex(0); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${appMode === 'game' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-purple-600'}`}><Gamepad2 size={16} /> Modo Desafio</button>
          </div>
          {appMode === 'sandbox' && (
            <>
              <div className="w-px h-6 bg-slate-300 mx-2"></div>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200">
                <button onClick={() => setActiveTool('cursor')} className={`p-1.5 rounded transition-colors ${activeTool === 'cursor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}><MousePointer2 size={18} /></button>
                <button onClick={() => setActiveTool('add-node')} className={`p-1.5 rounded transition-colors ${activeTool === 'add-node' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}><Circle size={18} /></button>
                <button onClick={() => setActiveTool('add-edge')} className={`p-1.5 rounded transition-colors ${activeTool === 'add-edge' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}><MoveUpRight size={18} /></button>
                <button onClick={() => setActiveTool('delete')} className={`p-1.5 rounded transition-colors ${activeTool === 'delete' ? 'bg-red-100 text-red-600 shadow-sm' : 'text-slate-600 hover:bg-red-50 hover:text-red-600'}`}><Eraser size={18} /></button>
              </div>
              <button onClick={() => { setEdges([]); setIsDirected(!isDirected); }} className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase text-slate-600 hover:bg-slate-50">
                {isDirected ? <ArrowRight size={14} className="text-purple-600"/> : <ArrowRightLeft size={14} className="text-blue-600"/>}
                {isDirected ? 'Direcionado' : 'Não Direcionado'}
              </button>
              <button onClick={clearAll} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium transition-colors ml-auto"><Trash2 size={16} /> Limpar Tudo</button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 bg-slate-50 relative">
          <svg className={`w-full h-full ${appMode === 'game' ? 'cursor-default' : activeTool === 'add-node' ? 'cursor-crosshair' : activeTool === 'delete' ? 'cursor-not-allowed' : 'cursor-default'}`} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={handleCanvasClick}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" /></marker>
            </defs>
            {edges.map((edge, i) => {
              const s = getNode(edge.sourceId); const t = getNode(edge.targetId);
              if (!s || !t) return null;
              const midX = (s.x + t.x) / 2; const midY = (s.y + t.y) / 2;
              return (
                <g key={i} onClick={(e) => { e.stopPropagation(); if (appMode === 'sandbox' && activeTool === 'delete') deleteEdge(i); }} className={`group ${appMode === 'sandbox' && activeTool === 'delete' ? 'cursor-pointer' : ''}`}>
                  <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="transparent" strokeWidth="15" />
                  <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#cbd5e1" strokeWidth="3" markerEnd={isDirected ? "url(#arrowhead)" : undefined} className={`transition-colors ${appMode === 'sandbox' && activeTool === 'delete' ? 'group-hover:stroke-red-500' : ''}`} />
                  {appMode === 'sandbox' && <rect x={midX - 10} y={midY - 10} width="20" height="20" rx="4" fill="white" className="stroke-slate-200 stroke-1" />}
                  {appMode === 'sandbox' && <text x={midX} y={midY} dy=".3em" textAnchor="middle" className="text-[10px] font-bold fill-slate-600 select-none pointer-events-none">{edge.weight}</text>}
                </g>
              );
            })}
            {nodes.map((node) => {
                let fillColor = "fill-white"; let strokeColor = "stroke-blue-500";
                if (visitedNodes.has(node.id)) { fillColor = "fill-green-500"; strokeColor = "stroke-green-600"; }
                else if (queueNodes.has(node.id)) { fillColor = "fill-yellow-300"; strokeColor = "stroke-yellow-500"; }
                return (
                  <g key={node.id} onMouseDown={(e) => handleNodeMouseDown(e, node.id)} onClick={(e) => handleNodeClick(e, node.id)} className="transition-all duration-200 ease-out group cursor-pointer hover:scale-105">
                    <circle cx={node.x} cy={node.y} r={22} className={`stroke-[3px] transition-colors duration-300 ${fillColor} ${strokeColor} shadow-md`} />
                    <text x={node.x} y={node.y} dy=".3em" textAnchor="middle" className={`font-bold text-sm pointer-events-none select-none ${visitedNodes.has(node.id) ? 'fill-white' : 'fill-slate-700'}`}>{node.id}</text>
                  </g>
                );
            })}
          </svg>
        </main>
        
        <aside className="w-80 bg-white border-l border-slate-200 p-6 shadow-xl z-10 flex flex-col gap-6 overflow-y-auto">
          {renderSidebarContent()}
        </aside>
      </div>
    </div>
  );
}

export default App;