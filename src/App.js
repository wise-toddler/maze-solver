import React, { useState, useEffect } from "react";
import "./App.css";
import { MazeSolver, validateMazeInput } from "./utils/mazeSolver";
import { generateSampleMaze, createEmptyMaze, createMazeWithWalls, getAlgorithms } from "./utils/mazeGenerator";
import { saveMazeResult } from "./utils/storage";

// Cell component for maze grid
const Cell = ({ value, isStart, isEnd, isPath, isExplored, isCurrentExploring, onClick, cursor }) => {
  let className = "cell ";
  
  if (value === 0) className += "wall";
  else if (isStart) className += "start";
  else if (isEnd) className += "end";
  else if (isPath) className += "path";
  else if (isCurrentExploring) className += "current-exploring";
  else if (isExplored) className += "explored";
  else className += "empty";
  
  return (
    <div 
      className={className}
      onClick={onClick}
      title={isStart ? "Start" : isEnd ? "End" : isPath ? "Path" : ""}
      style={{
        cursor: cursor || 'default'
      }}
    />
  );
};

// Main App Component
function App() {
  const [maze, setMaze] = useState([]);
  const [start, setStart] = useState([0, 0]);
  const [end, setEnd] = useState([0, 0]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("bfs");
  const [algorithms, setAlgorithms] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState("toggle"); // toggle, wall, path, start, end
  const [animate, setAnimate] = useState(true); // Animation toggle
  const [animationState, setAnimationState] = useState({
    isAnimating: false,
    exploredCells: new Set(),
    currentExploringCell: null,
    animationStep: 0,
    totalSteps: 0
  });

  // Initialize with sample maze
  useEffect(() => {
    loadAlgorithms();
    // Load a default small maze to start with
    createEmptyMazeHandler(10, 10);
  }, []);

  const loadSampleMaze = () => {
    try {
      const { grid, start: sampleStart, end: sampleEnd } = generateSampleMaze();
      setMaze(grid);
      setStart(sampleStart);
      setEnd(sampleEnd);
      setResult(null);
    } catch (error) {
      console.error("Error loading sample maze:", error);
    }
  };

  const loadAlgorithms = () => {
    try {
      const { algorithms } = getAlgorithms();
      setAlgorithms(algorithms);
    } catch (error) {
      console.error("Error loading algorithms:", error);
    }
  };

  const solveMaze = () => {
    if (!maze.length) return;
    
    setLoading(true);
    setResult(null);
    setAnimationState({
      isAnimating: false,
      exploredCells: new Set(),
      currentExploringCell: null,
      animationStep: 0,
      totalSteps: 0
    });
    
    try {
      // Validate input
      validateMazeInput(maze, start, end);
      
      // Create solver and solve maze
      const solver = new MazeSolver(maze);
      const solveResult = solver.solve(start, end, selectedAlgorithm);
      
      // Save result to history
      saveMazeResult(
        {
          grid: maze,
          start: start,
          end: end,
          algorithm: selectedAlgorithm
        },
        solveResult
      );
      
      if (animate && solveResult.exploration_order.length > 0) {
        // Start animation
        animateExploration(solveResult);
      } else {
        // Show result immediately
        setResult(solveResult);
      }
    } catch (error) {
      console.error("Error solving maze:", error);
      alert("Error solving maze: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const animateExploration = (solveResult) => {
    const exploration = solveResult.exploration_order;
    console.log("Starting animation with exploration length:", exploration.length);
    
    if (exploration.length === 0) {
      setResult(solveResult);
      return;
    }
    
    setAnimationState(prev => ({ 
      ...prev, 
      isAnimating: true,
      totalSteps: exploration.length,
      animationStep: 1, // Start showing step 1
      exploredCells: new Set(),
      currentExploringCell: null
    }));
    
    let currentIndex = 0;
    
    // Adaptive animation speed based on maze size and exploration length
    const mazeSize = maze.length * (maze[0]?.length || 1);
    const baseSpeed = mazeSize > 400 ? 30 : mazeSize > 225 ? 50 : 100;
    const animationSpeed = Math.max(baseSpeed, Math.min(300, 3000 / exploration.length));
    
    const processNextStep = () => {
      if (currentIndex >= exploration.length) {
        // Animation complete
        setTimeout(() => {
          setAnimationState(prev => ({
            ...prev,
            isAnimating: false,
            currentExploringCell: null
          }));
          setResult(solveResult);
        }, 500);
        return;
      }
      
      const [row, col] = exploration[currentIndex];
      const stepNumber = currentIndex + 1;
      console.log(`Processing index: ${currentIndex}, showing step: ${stepNumber} of ${exploration.length}`);
      
      setAnimationState(prev => ({
        ...prev,
        exploredCells: new Set([...prev.exploredCells, `${row}-${col}`]),
        currentExploringCell: `${row}-${col}`,
        animationStep: stepNumber
      }));
      
      currentIndex++;
      
      // Schedule next step only if there are more steps
      if (currentIndex < exploration.length) {
        setTimeout(processNextStep, animationSpeed);
      } else {
        // This was the last step, finish animation
        setTimeout(() => {
          setAnimationState(prev => ({
            ...prev,
            isAnimating: false,
            currentExploringCell: null
          }));
          setResult(solveResult);
        }, 500);
      }
    };
    
    // Start the animation
    processNextStep();
  };

  const handleCellClick = (row, col) => {
    if (!animationState.isAnimating) {
      const newMaze = [...maze];
      
      if (editMode === "toggle") {
        // Smart toggle: flip between wall and path
        // Don't toggle start/end positions - keep them as paths
        if ((row === start[0] && col === start[1]) || (row === end[0] && col === end[1])) {
          return; // Don't toggle start/end positions
        }
        newMaze[row][col] = newMaze[row][col] === 0 ? 1 : 0;
      } else if (editMode === "wall") {
        newMaze[row][col] = 0;
      } else if (editMode === "path") {
        newMaze[row][col] = 1;
      } else if (editMode === "start") {
        setStart([row, col]);
        newMaze[row][col] = 1; // Ensure start is walkable
      } else if (editMode === "end") {
        setEnd([row, col]);
        newMaze[row][col] = 1; // Ensure end is walkable
      }
      
      setMaze(newMaze);
      setResult(null); // Clear previous result
      
      // Clear animation state when editing
      setAnimationState({
        isAnimating: false,
        exploredCells: new Set(),
        currentExploringCell: null,
        animationStep: 0,
        totalSteps: 0
      });
    }
  };

  const createEmptyMazeHandler = (rows = 10, cols = 10) => {
    const { grid, start: newStart, end: newEnd } = createEmptyMaze(rows, cols);
    setMaze(grid);
    setStart(newStart);
    setEnd(newEnd);
    setResult(null);
    setAnimationState({
      isAnimating: false,
      exploredCells: new Set(),
      currentExploringCell: null,
      animationStep: 0,
      totalSteps: 0
    });
  };

  const createMazeWithWallsHandler = (rows, cols) => {
    const { grid, start: newStart, end: newEnd } = createMazeWithWalls(rows, cols);
    setMaze(grid);
    setStart(newStart);
    setEnd(newEnd);
    setResult(null);
    setAnimationState({
      isAnimating: false,
      exploredCells: new Set(),
      currentExploringCell: null,
      animationStep: 0,
      totalSteps: 0
    });
  };

  const isPathCell = (row, col) => {
    return result?.path?.some(([r, c]) => r === row && c === col) || false;
  };

  const isExploredCell = (row, col) => {
    if (animationState.isAnimating) {
      return animationState.exploredCells.has(`${row}-${col}`);
    }
    return false;
  };

  const isCurrentExploringCell = (row, col) => {
    return animationState.currentExploringCell === `${row}-${col}`;
  };

  const getCursor = () => {
    if (animationState.isAnimating) return 'default';
    switch (editMode) {
      case "toggle": return 'pointer';
      case "wall": return 'crosshair';
      case "path": return 'cell';
      case "start": return 'move';
      case "end": return 'move';
      default: return 'pointer';
    }
  };

  const isStartCell = (row, col) => row === start[0] && col === start[1];
  const isEndCell = (row, col) => row === end[0] && col === end[1];

  return (
    <div className="app">
      <div className="header">
        <h1>Maze Solver</h1>
        <p>Visualize pathfinding algorithms: BFS, DFS, Dijkstra & A*</p>
      </div>

      <div className="controls">
        <div className="controls-header">
          <div className="controls-title">Maze Configuration</div>
        </div>
        
        <div className="controls-grid">
          <div className="control-group">
            <label>Edit Tool</label>
            <select value={editMode} onChange={(e) => setEditMode(e.target.value)} disabled={animationState.isAnimating}>
              <option value="toggle">Smart Toggle</option>
              <option value="wall">Place Wall</option>
              <option value="path">Place Path</option>
              <option value="start">Move Start</option>
              <option value="end">Move End</option>
            </select>
          </div>

          <div className="control-group">
            <label>Algorithm</label>
            <select value={selectedAlgorithm} onChange={(e) => setSelectedAlgorithm(e.target.value)} disabled={animationState.isAnimating}>
              {algorithms.map(alg => (
                <option key={alg.name} value={alg.name}>
                  {alg.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <div className="checkbox-container">
              <input
                type="checkbox"
                checked={animate}
                onChange={(e) => setAnimate(e.target.checked)}
                id="animate-checkbox"
              />
              <label htmlFor="animate-checkbox" className="checkbox-label">
                Animate Exploration
              </label>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            onClick={solveMaze} 
            disabled={loading || animationState.isAnimating} 
            className="solve-btn"
          >
            {loading ? "Solving..." : animationState.isAnimating ? "Animating..." : "Solve Maze"}
          </button>
        </div>

        <div className="maze-size-controls">
          <label>Create New Maze</label>
          <div className="size-buttons">
            <button onClick={() => createEmptyMazeHandler(10, 10)} className="size-btn" disabled={animationState.isAnimating}>
              Empty 10×10
            </button>
            <button onClick={() => createEmptyMazeHandler(15, 15)} className="size-btn" disabled={animationState.isAnimating}>
              Empty 15×15
            </button>
            <button onClick={() => createEmptyMazeHandler(20, 20)} className="size-btn" disabled={animationState.isAnimating}>
              Empty 20×20
            </button>
            <button onClick={() => createEmptyMazeHandler(25, 25)} className="size-btn" disabled={animationState.isAnimating}>
              Empty 25×25
            </button>
          </div>
          <div className="size-buttons">
            <button onClick={() => createMazeWithWallsHandler(15, 15)} className="challenge-btn" disabled={animationState.isAnimating}>
              Challenge 15×15
            </button>
            <button onClick={() => createMazeWithWallsHandler(20, 20)} className="challenge-btn" disabled={animationState.isAnimating}>
              Challenge 20×20
            </button>
            <button onClick={() => createMazeWithWallsHandler(25, 25)} className="challenge-btn" disabled={animationState.isAnimating}>
              Challenge 25×25
            </button>
            <button onClick={() => createMazeWithWallsHandler(30, 30)} className="challenge-btn" disabled={animationState.isAnimating}>
              Challenge 30×30
            </button>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="maze-container">
          <h3>Maze Grid</h3>
          <div 
            className="maze-grid" 
            style={{
              gridTemplateColumns: `repeat(${maze[0]?.length || 0}, 1fr)`,
              '--maze-cols': maze[0]?.length || 10,
              '--maze-rows': maze.length || 10,
              '--maze-aspect-ratio': maze[0]?.length && maze.length ? `${maze[0].length} / ${maze.length}` : '1'
            }}
          >
            {maze.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  value={cell}
                  isStart={isStartCell(rowIndex, colIndex)}
                  isEnd={isEndCell(rowIndex, colIndex)}
                  isPath={!animationState.isAnimating && isPathCell(rowIndex, colIndex)}
                  isExplored={isExploredCell(rowIndex, colIndex)}
                  isCurrentExploring={isCurrentExploringCell(rowIndex, colIndex)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  cursor={getCursor()}
                />
              ))
            )}
          </div>
          
          <div className="legend">
            <div className="legend-item">
              <div className="cell start"></div>
              <span>Start</span>
            </div>
            <div className="legend-item">
              <div className="cell end"></div>
              <span>End</span>
            </div>
            <div className="legend-item">
              <div className="cell path"></div>
              <span>Path</span>
            </div>
            <div className="legend-item">
              <div className="cell wall"></div>
              <span>Wall</span>
            </div>
            <div className="legend-item">
              <div className="cell empty"></div>
              <span>Empty</span>
            </div>
          </div>
        </div>

        {animationState.isAnimating && (
          <div className="animation-status">
            <h3>Exploring Maze...</h3>
            <div className="animation-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{
                    width: `${(animationState.animationStep / animationState.totalSteps) * 100}%`
                  }}
                ></div>
              </div>
              <span className="progress-text">
                Step {animationState.animationStep} of {animationState.totalSteps}
              </span>
            </div>
            <p className="algorithm-name">
              {selectedAlgorithm.toUpperCase()} Algorithm
            </p>
          </div>
        )}

        {result && !animationState.isAnimating && (
          <div className="result-panel">
            <h3>Solution Results</h3>
            <div className="result-stats">
              <div className="stat">
                <label>Algorithm</label>
                <span>{result.algorithm_used.toUpperCase()}</span>
              </div>
              <div className="stat">
                <label>Path Found</label>
                <span className={result.path_found ? "success" : "error"}>
                  {result.path_found ? "Yes" : "No"}
                </span>
              </div>
              <div className="stat">
                <label>Path Length</label>
                <span>{result.path_length} steps</span>
              </div>
              <div className="stat">
                <label>Nodes Explored</label>
                <span>{result.nodes_explored}</span>
              </div>
              <div className="stat">
                <label>Execution Time</label>
                <span>{result.execution_time_ms}ms</span>
              </div>
            </div>

            {algorithms.length > 0 && (
              <div className="algorithm-info">
                <h4>Algorithm Details</h4>
                {algorithms.filter(alg => alg.name === result.algorithm_used).map(alg => (
                  <div key={alg.name} className="algorithm-detail">
                    <p>{alg.display_name}</p>
                    <p>{alg.description}</p>
                    <p>Time Complexity: {alg.time_complexity}</p>
                    <p>Optimal: {alg.optimal ? "Yes" : "No"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;