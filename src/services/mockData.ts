
export interface CodeExample {
  language: string;
  code: string;
  explanation: string;
  level: number;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  timeEstimate: string;
  codeLines: string;
}

export const codingLevels: Level[] = [
  {
    id: 'level-1',
    name: 'Level 1 - Initial Design & Basic Functions',
    description: 'Implement basic file operations with simple functionality.',
    difficulty: 'beginner',
    timeEstimate: '10-15 minutes',
    codeLines: '15-20 lines'
  },
  {
    id: 'level-2',
    name: 'Level 2 - Data Structures & Data Processing',
    description: 'Implement data processing functions with more complex operations.',
    difficulty: 'intermediate',
    timeEstimate: '20-30 minutes',
    codeLines: '40-45 lines'
  },
  {
    id: 'level-3',
    name: 'Level 3 - Refactoring & Encapsulation',
    description: 'Extend existing code with new features while maintaining backward compatibility.',
    difficulty: 'advanced',
    timeEstimate: '30-60 minutes',
    codeLines: '90-130 lines'
  },
  {
    id: 'level-4',
    name: 'Level 4 - Extending Design & Functionality',
    description: 'Finalize the project with advanced functionality and robust error handling.',
    difficulty: 'expert',
    timeEstimate: '60+ minutes',
    codeLines: '110-160 lines'
  }
];

export const codeExamples: Record<string, CodeExample> = {
  'level-1-js': {
    language: 'javascript',
    code: `/**
 * Upload a file to the remote storage server
 * @param {string} fileName - Name of the file to upload
 * @param {number} fileSize - Size of the file in bytes
 * @returns {boolean} - True if upload was successful
 * @throws {Error} - If a file with the same name already exists
 */
function FILE_UPLOAD(fileName, fileSize) {
  // Check if file already exists
  if (fileExists(fileName)) {
    throw new Error(\`File \${fileName} already exists\`);
  }
  
  // In a real implementation, this would make an API call
  console.log(\`Uploading file: \${fileName}, size: \${fileSize} bytes\`);
  
  // Store file metadata in our file system
  fileSystem[fileName] = {
    name: fileName,
    size: fileSize,
    uploaded: new Date()
  };
  
  return true;
}

/**
 * Gets information about a file from the storage server
 * @param {string} fileName - Name of the file to retrieve
 * @returns {number|null} - Size of the file, or null if it doesn't exist
 */
function FILE_GET(fileName) {
  // Check if file exists in our system
  if (!fileExists(fileName)) {
    return null;
  }
  
  // Return the file size
  return fileSystem[fileName].size;
}

/**
 * Helper function to check if a file exists
 * @param {string} fileName - Name of the file to check
 * @returns {boolean} - True if the file exists
 */
function fileExists(fileName) {
  return fileName in fileSystem;
}

// Initialize our file system
const fileSystem = {};`,
    explanation: 'This example shows the basic Level 1 implementation of FILE_UPLOAD and FILE_GET functions. It includes proper error handling and documentation.',
    level: 1
  },
  'level-2-js': {
    language: 'javascript',
    code: `/**
 * Searches for files that start with the given prefix
 * @param {string} prefix - The prefix to search for
 * @returns {Array} - Array of files sorted by size in descending order
 */
function FILE_SEARCH(prefix) {
  // Filter files that start with the prefix
  const matchingFiles = Object.entries(fileSystem)
    .filter(([fileName, _]) => fileName.startsWith(prefix))
    .map(([fileName, fileData]) => ({
      name: fileName,
      size: fileData.size
    }));
  
  // Sort by size in descending order, then by name for ties
  return matchingFiles.sort((a, b) => {
    if (b.size !== a.size) {
      return b.size - a.size; // Descending by size
    }
    return a.name.localeCompare(b.name); // Alphabetical by name for ties
  });
}

/**
 * Copy a file from source to destination
 * @param {string} source - Source file name
 * @param {string} dest - Destination file name
 * @returns {boolean} - True if copy was successful
 * @throws {Error} - If source doesn't exist or destination already exists
 */
function FILE_COPY(source, dest) {
  // Check if source file exists
  if (!fileExists(source)) {
    throw new Error(\`Source file \${source} does not exist\`);
  }
  
  // Check if destination already exists
  if (fileExists(dest)) {
    throw new Error(\`Destination file \${dest} already exists\`);
  }
  
  // Copy file metadata
  fileSystem[dest] = {
    ...fileSystem[source],
    name: dest,
    uploaded: new Date()
  };
  
  return true;
}`,
    explanation: 'This Level 2 example demonstrates data processing with FILE_SEARCH, including filtering, mapping, and sorting operations. It also shows the FILE_COPY implementation.',
    level: 2
  },
  'level-3-js': {
    language: 'javascript',
    code: `/**
 * FileSystem class to encapsulate all file operations
 */
class FileSystem {
  constructor() {
    this.files = {};
    this.snapshots = {}; // Store timestamped versions
  }
  
  /**
   * Check if a file exists in the system
   * @param {string} fileName - Name of the file to check
   * @param {number} [timestamp] - Optional timestamp to check at a specific point
   * @returns {boolean} - True if the file exists
   */
  fileExists(fileName, timestamp = null) {
    if (timestamp === null) {
      return fileName in this.files;
    }
    
    // Check if file exists at the given timestamp
    return this.snapshots[timestamp] && 
           fileName in this.snapshots[timestamp] &&
           this.isFileAlive(fileName, timestamp);
  }
  
  /**
   * Check if a file is still "alive" (not expired) at the given timestamp
   * @param {string} fileName - Name of the file
   * @param {number} timestamp - Timestamp to check
   * @returns {boolean} - True if the file is still alive
   */
  isFileAlive(fileName, timestamp) {
    const file = this.snapshots[timestamp][fileName];
    return file.ttl === null || timestamp + file.ttl > Date.now();
  }
  
  /**
   * Upload a file to the system
   * @param {string} fileName - Name of the file to upload
   * @param {number} fileSize - Size of the file in bytes
   * @returns {boolean} - True if upload was successful
   * @throws {Error} - If a file with the same name already exists
   */
  FILE_UPLOAD(fileName, fileSize) {
    return this.FILE_UPLOAD_AT(Date.now(), fileName, fileSize, null);
  }
  
  /**
   * Upload a file with a specified timestamp and time-to-live
   * @param {number} timestamp - Timestamp for the operation
   * @param {string} fileName - Name of the file to upload
   * @param {number} fileSize - Size of the file in bytes
   * @param {number|null} ttl - Time-to-live in milliseconds, null for permanent
   * @returns {boolean} - True if upload was successful
   * @throws {Error} - If a file with the same name already exists
   */
  FILE_UPLOAD_AT(timestamp, fileName, fileSize, ttl) {
    // Create snapshot for this timestamp if it doesn't exist
    if (!this.snapshots[timestamp]) {
      this.snapshots[timestamp] = { ...this.files };
    }
    
    // Check if file already exists
    if (this.fileExists(fileName)) {
      throw new Error(\`File \${fileName} already exists\`);
    }
    
    // Create file entry
    const fileData = {
      name: fileName,
      size: fileSize,
      uploaded: timestamp,
      ttl: ttl
    };
    
    // Add to current files and to snapshot
    this.files[fileName] = fileData;
    this.snapshots[timestamp][fileName] = fileData;
    
    return true;
  }
}`,
    explanation: 'This Level 3 example shows refactoring the code into a class structure with encapsulation. It adds timestamp functionality while maintaining backward compatibility with the original functions.',
    level: 3
  },
  'level-4-js': {
    language: 'javascript',
    code: `class AdvancedFileSystem {
  constructor() {
    this.files = {};
    this.snapshots = {};
    this.timestamps = []; // Keep sorted list of timestamps for efficient lookups
    this.eventLog = []; // Track all operations for auditing
  }
  
  /**
   * Roll back the file system to the state at the specified timestamp
   * @param {number} timestamp - Timestamp to roll back to
   * @returns {boolean} - True if rollback was successful
   * @throws {Error} - If the timestamp is invalid
   */
  ROLLBACK(timestamp) {
    // Find closest timestamp at or before the requested time
    const targetTimestamp = this._findClosestTimestamp(timestamp);
    
    if (targetTimestamp === null) {
      throw new Error('No valid timestamp found to roll back to');
    }
    
    try {
      // Restore files from the snapshot
      this.files = JSON.parse(JSON.stringify(this.snapshots[targetTimestamp]));
      
      // Remove all snapshots after this timestamp
      const indexToKeep = this.timestamps.indexOf(targetTimestamp);
      const timestampsToRemove = this.timestamps.slice(indexToKeep + 1);
      
      timestampsToRemove.forEach(ts => {
        delete this.snapshots[ts];
      });
      
      // Update timestamps list
      this.timestamps = this.timestamps.slice(0, indexToKeep + 1);
      
      // Log the rollback operation
      this._logEvent('ROLLBACK', { timestamp }, true);
      
      // Recalculate TTLs based on the new "current" time
      this._recalculateTTLs(targetTimestamp);
      
      return true;
    } catch (error) {
      this._logEvent('ROLLBACK', { timestamp }, false);
      throw new Error(\`Rollback failed: \${error.message}\`);
    }
  }
  
  /**
   * Find the closest timestamp at or before the given time
   * @private
   */
  _findClosestTimestamp(timestamp) {
    // Binary search to find the closest timestamp
    let left = 0;
    let right = this.timestamps.length - 1;
    
    if (right < 0) return null; // No timestamps yet
    if (timestamp >= this.timestamps[right]) return this.timestamps[right];
    if (timestamp < this.timestamps[0]) return null;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      
      if (this.timestamps[mid] === timestamp) {
        return this.timestamps[mid];
      }
      
      if (this.timestamps[mid] < timestamp) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    // Return the closest timestamp that's not after the target
    return this.timestamps[right];
  }
}`,
    explanation: 'This Level 4 example demonstrates advanced functionality with the ROLLBACK method that uses binary search for efficiency and maintains system integrity during rollbacks.',
    level: 4
  }
};
