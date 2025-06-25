/**
 * Maze Generation Utilities
 * Create various types of mazes for testing algorithms
 */

/**
 * Generate a sample maze for testing
 */
export const generateSampleMaze = () => {
  const sampleMaze = [
    [1, 1, 1, 0, 1, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1],
    [0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1]
  ];

  return {
    grid: sampleMaze,
    start: [0, 0],
    end: [6, 7],
    description: "Sample 7x8 maze with path from top-left to bottom-right"
  };
};

/**
 * Create an empty maze (all paths)
 */
export const createEmptyMaze = (rows = 10, cols = 10) => {
  const maze = Array(rows).fill().map(() => Array(cols).fill(1));
  return {
    grid: maze,
    start: [0, 0],
    end: [rows - 1, cols - 1],
    description: `Empty ${rows}x${cols} maze`
  };
};

/**
 * Create a maze with random walls
 */
export const createMazeWithWalls = (rows = 15, cols = 15, wallDensity = 0.2) => {
  const maze = Array(rows).fill().map(() => Array(cols).fill(1));
  
  // Add random walls (avoid start and end positions)
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (Math.random() < wallDensity && 
          !(i === 0 && j === 0) && 
          !(i === rows - 1 && j === cols - 1)) {
        maze[i][j] = 0;
      }
    }
  }
  
  return {
    grid: maze,
    start: [0, 0],
    end: [rows - 1, cols - 1],
    description: `Challenge ${rows}x${cols} maze with ${Math.round(wallDensity * 100)}% walls`
  };
};

/**
 * Create a maze pattern (spiral)
 */
export const createSpiralMaze = (size = 15) => {
  const maze = Array(size).fill().map(() => Array(size).fill(0));
  
  // Create spiral pattern
  let top = 0, bottom = size - 1, left = 0, right = size - 1;
  
  while (top <= bottom && left <= right) {
    // Fill top row
    for (let i = left; i <= right; i++) {
      maze[top][i] = 1;
    }
    top++;
    
    // Fill right column
    for (let i = top; i <= bottom; i++) {
      maze[i][right] = 1;
    }
    right--;
    
    // Fill bottom row
    if (top <= bottom) {
      for (let i = right; i >= left; i--) {
        maze[bottom][i] = 1;
      }
      bottom--;
    }
    
    // Fill left column
    if (left <= right) {
      for (let i = bottom; i >= top; i--) {
        maze[i][left] = 1;
      }
      left++;
    }
  }
  
  return {
    grid: maze,
    start: [0, 0],
    end: [size - 1, size - 1],
    description: `Spiral ${size}x${size} maze`
  };
};

/**
 * Available maze types
 */
export const mazeTypes = {
  empty: createEmptyMaze,
  challenge: createMazeWithWalls,
  spiral: createSpiralMaze,
  sample: generateSampleMaze
};

/**
 * Get algorithm information
 */
export const getAlgorithms = () => {
  return {
    algorithms: [
      {
        name: "bfs",
        display_name: "Breadth-First Search",
        description: "Guarantees shortest path, explores level by level",
        time_complexity: "O(V + E)",
        optimal: true
      },
      {
        name: "dfs",
        display_name: "Depth-First Search", 
        description: "Explores as far as possible before backtracking",
        time_complexity: "O(V + E)",
        optimal: false
      },
      {
        name: "dijkstra",
        display_name: "Dijkstra's Algorithm",
        description: "Shortest path with weighted edges (all weights = 1 here)",
        time_complexity: "O(V log V + E)",
        optimal: true
      },
      {
        name: "astar",
        display_name: "A* Search",
        description: "Heuristic-based shortest path using Manhattan distance",
        time_complexity: "O(V log V)",
        optimal: true
      }
    ]
  };
};