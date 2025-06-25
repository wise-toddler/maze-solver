/**
 * Local Storage Utilities
 * Manage maze solving history in browser localStorage
 */

const STORAGE_KEY = 'mazeHistory';
const MAX_HISTORY_ITEMS = 100; // Limit history to prevent storage bloat

/**
 * Generate a simple UUID for history entries
 */
const generateId = () => {
  return 'maze_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Get maze history from localStorage
 */
export const getMazeHistory = (limit = 10) => {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error('Error reading maze history:', error);
    return [];
  }
};

/**
 * Save maze result to history
 */
export const saveMazeResult = (mazeInput, result) => {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    const historyEntry = {
      id: generateId(),
      maze_input: mazeInput,
      result: result,
      timestamp: new Date().toISOString()
    };
    
    // Add to beginning of array
    history.unshift(historyEntry);
    
    // Limit history size
    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return historyEntry;
  } catch (error) {
    console.error('Error saving maze result:', error);
    return null;
  }
};

/**
 * Clear all maze history
 */
export const clearMazeHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing maze history:', error);
    return false;
  }
};

/**
 * Get storage usage statistics
 */
export const getStorageStats = () => {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const storageSize = new Blob([localStorage.getItem(STORAGE_KEY) || '']).size;
    
    return {
      totalEntries: history.length,
      storageSize: storageSize,
      storageSizeFormatted: formatBytes(storageSize)
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalEntries: 0,
      storageSize: 0,
      storageSizeFormatted: '0 B'
    };
  }
};

/**
 * Format bytes to human readable format
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Export history as JSON file
 */
export const exportHistory = () => {
  try {
    const history = getMazeHistory(MAX_HISTORY_ITEMS);
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maze-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exporting history:', error);
    return false;
  }
};

/**
 * Import history from JSON file
 */
export const importHistory = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const importedHistory = JSON.parse(e.target.result);
        
        if (!Array.isArray(importedHistory)) {
          throw new Error('Invalid history format');
        }
        
        // Validate history entries
        const validHistory = importedHistory.filter(entry => 
          entry.id && entry.maze_input && entry.result && entry.timestamp
        );
        
        if (validHistory.length === 0) {
          throw new Error('No valid history entries found');
        }
        
        // Merge with existing history
        const existingHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const mergedHistory = [...validHistory, ...existingHistory];
        
        // Remove duplicates based on ID
        const uniqueHistory = mergedHistory.filter((entry, index, self) =>
          index === self.findIndex(e => e.id === entry.id)
        );
        
        // Limit total entries
        const finalHistory = uniqueHistory.slice(0, MAX_HISTORY_ITEMS);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalHistory));
        
        resolve({
          imported: validHistory.length,
          total: finalHistory.length
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};