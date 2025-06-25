/**
 * Graph-based Maze Solver - JavaScript Implementation
 * Converted from Python backend to run entirely in the browser
 */

export class MazeSolver {
  constructor(grid) {
    this.grid = grid;
    this.rows = grid.length;
    this.cols = grid.length > 0 ? grid[0].length : 0;
    this.directions = [
      [0, 1],   // right
      [1, 0],   // down
      [0, -1],  // left
      [-1, 0]   // up
    ];
  }

  /**
   * Check if a cell is valid and walkable
   */
  isValid(row, col) {
    return (
      row >= 0 && 
      row < this.rows && 
      col >= 0 && 
      col < this.cols && 
      this.grid[row][col] === 1
    );
  }

  /**
   * Get all valid neighboring cells
   */
  getNeighbors(row, col) {
    const neighbors = [];
    for (const [dr, dc] of this.directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (this.isValid(newRow, newCol)) {
        neighbors.push([newRow, newCol]);
      }
    }
    return neighbors;
  }

  /**
   * Breadth-First Search - guaranteed shortest path
   */
  bfs(start, end) {
    const queue = [[start, [start]]];
    const visited = new Set([`${start[0]}-${start[1]}`]);
    let nodesExplored = 0;
    const explorationOrder = [start];

    while (queue.length > 0) {
      const [[row, col], path] = queue.shift();
      nodesExplored++;

      if (row === end[0] && col === end[1]) {
        return {
          path,
          nodesExplored,
          explorationOrder
        };
      }

      for (const neighbor of this.getNeighbors(row, col)) {
        const neighborKey = `${neighbor[0]}-${neighbor[1]}`;
        if (!visited.has(neighborKey)) {
          visited.add(neighborKey);
          explorationOrder.push(neighbor);
          queue.push([neighbor, [...path, neighbor]]);
        }
      }
    }

    return {
      path: [],
      nodesExplored,
      explorationOrder
    };
  }

  /**
   * Depth-First Search - finds a path but not necessarily shortest
   */
  dfs(start, end) {
    const explorationOrder = [];
    let nodesExplored = 0;

    const dfsRecursive = (current, target, visited, path) => {
      nodesExplored++;
      explorationOrder.push(current);

      if (current[0] === target[0] && current[1] === target[1]) {
        return true;
      }

      for (const neighbor of this.getNeighbors(current[0], current[1])) {
        const neighborKey = `${neighbor[0]}-${neighbor[1]}`;
        if (!visited.has(neighborKey)) {
          visited.add(neighborKey);
          path.push(neighbor);
          if (dfsRecursive(neighbor, target, visited, path)) {
            return true;
          }
          path.pop();
        }
      }

      return false;
    };

    const visited = new Set([`${start[0]}-${start[1]}`]);
    const path = [start];

    if (dfsRecursive(start, end, visited, path)) {
      return {
        path,
        nodesExplored,
        explorationOrder
      };
    }

    return {
      path: [],
      nodesExplored,
      explorationOrder
    };
  }

  /**
   * Dijkstra's algorithm - shortest path with weights (all edges weight 1)
   */
  dijkstra(start, end) {
    // Min heap implementation using array
    const heap = [[0, start, [start]]]; // [distance, position, path]
    const distances = new Map();
    distances.set(`${start[0]}-${start[1]}`, 0);
    let nodesExplored = 0;
    const explorationOrder = [];

    const heapPush = (item) => {
      heap.push(item);
      heap.sort((a, b) => a[0] - b[0]);
    };

    const heapPop = () => {
      return heap.shift();
    };

    while (heap.length > 0) {
      const [currentDist, currentPos, path] = heapPop();
      nodesExplored++;
      explorationOrder.push(currentPos);

      if (currentPos[0] === end[0] && currentPos[1] === end[1]) {
        return {
          path,
          nodesExplored,
          explorationOrder
        };
      }

      const currentKey = `${currentPos[0]}-${currentPos[1]}`;
      if (currentDist > (distances.get(currentKey) || Infinity)) {
        continue;
      }

      for (const neighbor of this.getNeighbors(currentPos[0], currentPos[1])) {
        const distance = currentDist + 1;
        const neighborKey = `${neighbor[0]}-${neighbor[1]}`;

        if (distance < (distances.get(neighborKey) || Infinity)) {
          distances.set(neighborKey, distance);
          heapPush([distance, neighbor, [...path, neighbor]]);
        }
      }
    }

    return {
      path: [],
      nodesExplored,
      explorationOrder
    };
  }

  /**
   * A* algorithm - heuristic-based shortest path
   */
  astar(start, end) {
    // Manhattan distance heuristic
    const heuristic = (pos) => {
      return Math.abs(pos[0] - end[0]) + Math.abs(pos[1] - end[1]);
    };

    const heap = [[heuristic(start), 0, start, [start]]]; // [f_score, g_score, position, path]
    const gScores = new Map();
    gScores.set(`${start[0]}-${start[1]}`, 0);
    let nodesExplored = 0;
    const explorationOrder = [];

    const heapPush = (item) => {
      heap.push(item);
      heap.sort((a, b) => a[0] - b[0]);
    };

    const heapPop = () => {
      return heap.shift();
    };

    while (heap.length > 0) {
      const [fScore, gScore, currentPos, path] = heapPop();
      nodesExplored++;
      explorationOrder.push(currentPos);

      if (currentPos[0] === end[0] && currentPos[1] === end[1]) {
        return {
          path,
          nodesExplored,
          explorationOrder
        };
      }

      const currentKey = `${currentPos[0]}-${currentPos[1]}`;
      if (gScore > (gScores.get(currentKey) || Infinity)) {
        continue;
      }

      for (const neighbor of this.getNeighbors(currentPos[0], currentPos[1])) {
        const tentativeG = gScore + 1;
        const neighborKey = `${neighbor[0]}-${neighbor[1]}`;

        if (tentativeG < (gScores.get(neighborKey) || Infinity)) {
          gScores.set(neighborKey, tentativeG);
          const fScore = tentativeG + heuristic(neighbor);
          heapPush([fScore, tentativeG, neighbor, [...path, neighbor]]);
        }
      }
    }

    return {
      path: [],
      nodesExplored,
      explorationOrder
    };
  }

  /**
   * Solve maze using specified algorithm
   */
  solve(start, end, algorithm = 'bfs') {
    const startTime = performance.now();
    let result;

    switch (algorithm.toLowerCase()) {
      case 'bfs':
        result = this.bfs(start, end);
        break;
      case 'dfs':
        result = this.dfs(start, end);
        break;
      case 'dijkstra':
        result = this.dijkstra(start, end);
        break;
      case 'astar':
        result = this.astar(start, end);
        break;
      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    const executionTime = performance.now() - startTime;

    return {
      path: result.path,
      algorithm_used: algorithm,
      path_length: result.path.length,
      nodes_explored: result.nodesExplored,
      execution_time_ms: Math.round(executionTime * 100) / 100,
      path_found: result.path.length > 0,
      exploration_order: result.explorationOrder
    };
  }
}

/**
 * Validate maze input
 */
export const validateMazeInput = (grid, start, end) => {
  if (!grid || !grid.length || !grid[0] || !grid[0].length) {
    throw new Error("Invalid maze grid");
  }

  const rows = grid.length;
  const cols = grid[0].length;

  if (start[0] < 0 || start[0] >= rows || start[1] < 0 || start[1] >= cols) {
    throw new Error("Invalid start position");
  }

  if (end[0] < 0 || end[0] >= rows || end[1] < 0 || end[1] >= cols) {
    throw new Error("Invalid end position");
  }

  if (grid[start[0]][start[1]] !== 1) {
    throw new Error("Start position is not walkable");
  }

  if (grid[end[0]][end[1]] !== 1) {
    throw new Error("End position is not walkable");
  }

  return true;
};