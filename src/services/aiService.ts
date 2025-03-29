import { toast } from "sonner";
import { supabaseClient } from './supabaseClient';

// Types for AI chat requests and responses
export interface AIChatRequest {
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
  model?: string;
}

export interface AIChatResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
}

const SYSTEM_PROMPT = `You are an expert coding tutor specializing in the Industry Coding Skills Evaluation Framework. 
This framework assesses coding skills at 4 progressive levels:

Level 1 - Initial Design & Basic Functions:
- Basic implementation, simple methods
- Focus on conditions, loops, type conversions
- Expected time: 10-15 minutes, 15-20 lines of code

Level 2 - Data Structures & Data Processing:
- Implement data processing functions
- Focus on calculations, aggregations, sorting
- Expected time: 20-30 minutes, 40-45 lines of code

Level 3 - Refactoring & Encapsulation:
- Extend and maintain existing codebase
- Focus on refactoring and encapsulation techniques
- Expected time: 30-60 minutes, 90-130 lines of code

Level 4 - Extending Design & Functionality:
- Enhance functionality with backward compatibility
- Focus on efficient code design and performance
- Expected time: 60+ minutes, 110-160 lines of code

When helping users, guide them through problem-solving without giving complete solutions immediately. 
Encourage them to build incrementally, starting with Level 1 and progressing.

File operation functions to focus on implementing:
- FILE_UPLOAD(file_name, size)
- FILE_GET(file_name)
- FILE_COPY(source, dest)
- FILE_SEARCH(prefix)
- FILE_UPLOAD_AT(timestamp, file_name, file_size, ttl)
- FILE_GET_AT(timestamp, file_name)
- FILE_COPY_AT(timestamp, file_from, file_to)
- FILE_SEARCH_AT(timestamp, prefix)
- ROLLBACK(timestamp)

Provide clear explanations, code examples, and guidance aligned with the level they're working on.`;

export const getAIResponse = async (messages: AIChatRequest['messages']): Promise<string> => {
  try {
    // Add system message at the beginning if it doesn't exist
    const messagesWithSystem = messages.some(m => m.role === 'system')
      ? messages
      : [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    try {
      // Use Supabase Edge Function to call AI service
      const { data, error } = await supabaseClient.functions.invoke('ai-chat', {
        body: { messages: messagesWithSystem }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      // Extract the response based on OpenRouter's response format
      if (data?.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }

      throw new Error('Invalid response format from AI service');
    } catch (serviceError) {
      console.error('Error with AI service:', serviceError);
      // Fall back to mock responses if the service fails
      return getMockResponse(messages[messages.length - 1].content);
    }
  } catch (error) {
    console.error('Error getting AI response:', error);
    toast.error('Failed to get AI response. Please try again.');
    return "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
};

// Get mock responses based on keywords in the user's question
const getMockResponse = (userQuestion: string): string => {
  userQuestion = userQuestion.toLowerCase();
  
  if (userQuestion.includes('level 1') || userQuestion.includes('file_upload') || userQuestion.includes('file_get')) {
    return `
Let's focus on Level 1 - Initial Design & Basic Functions.

For implementing the basic file operations like FILE_UPLOAD and FILE_GET, you'll want to start with simple functions that handle the core functionality without worrying about advanced features yet.

Here's an example implementation for FILE_UPLOAD:

\`\`\`javascript
/**
 * Uploads a file to the remote storage server
 * @param {string} fileName - Name of the file to upload
 * @param {number} fileSize - Size of the file in bytes
 * @returns {boolean} - True if upload was successful
 * @throws {Error} - If a file with the same name already exists
 */
function FILE_UPLOAD(fileName, fileSize) {
  // Check if file already exists
  if (fileExists(fileName)) {
    throw new Error(\`File ${fileName} already exists\`);
  }
  
  // In a real implementation, this would make an API call
  // to upload the file to a server
  console.log(\`Uploading file: ${fileName}, size: ${fileSize} bytes\`);
  
  // Store file metadata in our file system
  fileSystem[fileName] = {
    name: fileName,
    size: fileSize,
    uploaded: new Date()
  };
  
  return true;
}
\`\`\`

For FILE_GET, you would implement a similar function that retrieves file information:

\`\`\`javascript
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
\`\`\`

Remember to also create a helper function to check if a file exists:

\`\`\`javascript
/**
 * Helper function to check if a file exists
 * @param {string} fileName - Name of the file to check
 * @returns {boolean} - True if the file exists
 */
function fileExists(fileName) {
  return fileName in fileSystem;
}
\`\`\`

These functions cover the basic requirements for Level 1. Try implementing them and then we can test with some example usage.
`;
  }
  
  if (userQuestion.includes('level 2') || userQuestion.includes('file_search') || userQuestion.includes('data structure')) {
    return `
For Level 2 - Data Structures & Data Processing, we'll focus on implementing FILE_SEARCH which requires more complex data processing.

Here's how you might implement the FILE_SEARCH function:

\`\`\`javascript
/**
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
\`\`\`

This implementation demonstrates several important concepts for Level 2:

1. Using appropriate data structures (objects and arrays)
2. Data processing with filter and map methods
3. Complex sorting with multiple criteria
4. Handling edge cases

To test this, you'll want to have some files in your system:

\`\`\`javascript
// Initialize our file system with some test data
const fileSystem = {
  'file-1.txt': { name: 'file-1.txt', size: 1100, uploaded: new Date() },
  'file-2.txt': { name: 'file-2.txt', size: 2200, uploaded: new Date() },
  'file-3.csv': { name: 'file-3.csv', size: 3300, uploaded: new Date() },
  'doc-1.pdf': { name: 'doc-1.pdf', size: 4400, uploaded: new Date() }
};

// Test the FILE_SEARCH function
console.log(FILE_SEARCH('file-'));
// Should return: [
//   { name: 'file-3.csv', size: 3300 },
//   { name: 'file-2.txt', size: 2200 },
//   { name: 'file-1.txt', size: 1100 }
// ]
\`\`\`

Remember, Level 2 focuses on data processing without involving complex algorithms or advanced optimizations. This implementation gives you a solid foundation to build upon.
`;
  }
  
  if (userQuestion.includes('level 3') || userQuestion.includes('refactor') || userQuestion.includes('file_upload_at')) {
    return `
For Level 3 - Refactoring & Encapsulation, we'll build on our previous implementations by adding timestamp functionality while maintaining backward compatibility.

Let's implement FILE_UPLOAD_AT and refactor our existing code:

\`\`\`javascript
/**
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
      throw new Error(\`File ${fileName} already exists\`);
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
  
  /**
   * Get file information from the system
   * @param {string} fileName - Name of the file to retrieve
   * @returns {number|null} - Size of the file, or null if it doesn't exist
   */
  FILE_GET(fileName) {
    return this.FILE_GET_AT(Date.now(), fileName);
  }
  
  /**
   * Get file information at a specific timestamp
   * @param {number} timestamp - Timestamp for the operation
   * @param {string} fileName - Name of the file to retrieve
   * @returns {number|null} - Size of the file, or null if it doesn't exist
   */
  FILE_GET_AT(timestamp, fileName) {
    // Check if file exists at the timestamp
    if (!this.fileExists(fileName, timestamp)) {
      return null;
    }
    
    // Return the file size from that point in time
    return this.snapshots[timestamp][fileName].size;
  }
  
  // Other methods like FILE_SEARCH, FILE_COPY, etc. would follow the same pattern
}

// Example usage
const fs = new FileSystem();
fs.FILE_UPLOAD('document.txt', 1024);
console.log(fs.FILE_GET('document.txt')); // 1024

// With timestamp and TTL
const currentTime = Date.now();
fs.FILE_UPLOAD_AT(currentTime, 'temporary.txt', 2048, 3600000); // 1 hour TTL
console.log(fs.FILE_GET_AT(currentTime, 'temporary.txt')); // 2048
\`\`\`

This implementation demonstrates key Level 3 concepts:

1. Refactoring to use a class structure for encapsulation
2. Maintaining backward compatibility with the original functions
3. Adding new functionality (timestamps and TTL) through extensions
4. Handling the time dimension in data management

The class structure gives us a clean way to organize related functionality and maintain state. It also makes it easier to extend with additional methods in the future.
`;
  }
  
  if (userQuestion.includes('level 4') || userQuestion.includes('rollback') || userQuestion.includes('extending')) {
    return `
For Level 4 - Extending Design & Functionality, we'll implement the ROLLBACK function and enhance our system with more robust error handling and performance optimizations.

Here's an implementation that builds on our Level 3 code:

\`\`\`javascript
class AdvancedFileSystem {
  constructor() {
    this.files = {};
    this.snapshots = {};
    this.timestamps = []; // Keep sorted list of timestamps for efficient lookups
    this.eventLog = []; // Track all operations for auditing
  }
  
  /**
   * Log an event to the system audit trail
   * @private
   */
  _logEvent(operation, params, result) {
    this.eventLog.push({
      operation,
      params,
      result,
      timestamp: Date.now()
    });
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
    } catch (err) {
      this._logEvent('ROLLBACK', { timestamp }, false);
      throw new Error(\`Rollback failed: ${err.message}\`);
    }
  }
  
  /**
   * Recalculate TTLs after a rollback
   * @private
   */
  _recalculateTTLs(currentTimestamp) {
    Object.keys(this.files).forEach(fileName => {
      const file = this.files[fileName];
      
      // If the file has a TTL, check if it would be expired
      if (file.ttl !== null) {
        const expirationTime = file.uploaded + file.ttl;
        
        // If the file would be expired at the current timestamp, remove it
        if (expirationTime <= currentTimestamp) {
          delete this.files[fileName];
        }
      }
    });
  }
  
  /**
   * Upload a file with a specified timestamp and time-to-live
   * Enhanced with improved error handling and performance
   */
  FILE_UPLOAD_AT(timestamp, fileName, fileSize, ttl) {
    try {
      // Validate inputs
      if (!fileName || typeof fileName !== 'string') {
        throw new Error('Invalid file name');
      }
      
      if (typeof fileSize !== 'number' || fileSize <= 0) {
        throw new Error('File size must be a positive number');
      }
      
      if (ttl !== null && (typeof ttl !== 'number' || ttl < 0)) {
        throw new Error('TTL must be null or a non-negative number');
      }
      
      // Create snapshot for this timestamp
      this._createSnapshot(timestamp);
      
      // Check if file already exists
      if (this.fileExists(fileName)) {
        throw new Error(\`File ${fileName} already exists\`);
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
      
      // Log operation
      this._logEvent('FILE_UPLOAD_AT', { timestamp, fileName, fileSize, ttl }, true);
      
      return true;
    } catch (err) {
      this._logEvent('FILE_UPLOAD_AT', { timestamp, fileName, fileSize, ttl }, false);
      throw err;
    }
  }
  
  /**
   * Create a snapshot at the specified timestamp
   * @private
   */
  _createSnapshot(timestamp) {
    if (!this.snapshots[timestamp]) {
      // Deep clone current files to avoid reference issues
      this.snapshots[timestamp] = JSON.parse(JSON.stringify(this.files));
      
      // Add timestamp to sorted list
      const insertIndex = this.timestamps.findIndex(ts => ts > timestamp);
      
      if (insertIndex === -1) {
        this.timestamps.push(timestamp);
      } else {
        this.timestamps.splice(insertIndex, 0, timestamp);
      }
    }
  }
  
  // Additional enhanced methods would be implemented following the same pattern
  // ...
}

// Example usage
const fs = new AdvancedFileSystem();

// Create a series of snapshots
const t1 = Date.now();
fs.FILE_UPLOAD_AT(t1, 'file1.txt', 1000, null);

// Wait a bit and add more files
const t2 = t1 + 60000; // 1 minute later
fs.FILE_UPLOAD_AT(t2, 'file2.txt', 2000, 120000); // 2 minute TTL

// Make more changes
const t3 = t2 + 60000; // 2 minutes after start
fs.FILE_UPLOAD_AT(t3, 'file3.txt', 3000, null);

// Roll back to t1
fs.ROLLBACK(t1);
console.log(fs.files); // Should only contain file1.txt
\`\`\`

This Level 4 implementation demonstrates:

1. Advanced error handling with input validation
2. Performance optimization using binary search for timestamp lookups
3. Audit logging for all operations
4. Deep cloning to avoid reference issues with objects
5. TTL recalculation during rollbacks
6. Enhanced ROLLBACK functionality that maintains system integrity

The key aspects here are extending the design while maintaining backward compatibility and ensuring the system remains robust even under complex operations. This implementation shows how to handle time-based operations efficiently while maintaining data integrity.
`;
  }
  
  return `
Let me explain a bit about the Industry Coding Skills Evaluation Framework.

This framework is designed to assess coding skills across four progressive levels:

1. **Level 1 - Initial Design & Basic Functions**
   - Focus on basic implementation and simple methods
   - Expected completion: 10-15 minutes, 15-20 lines of code

2. **Level 2 - Data Structures & Data Processing**
   - Focus on implementing data processing functions
   - Expected completion: 20-30 minutes, 40-45 lines of code

3. **Level 3 - Refactoring & Encapsulation**
   - Focus on extending and maintaining existing code
   - Expected completion: 30-60 minutes, 90-130 lines of code

4. **Level 4 - Extending Design & Functionality**
   - Focus on enhancing functionality with backward compatibility
   - Expected completion: 60+ minutes, 110-160 lines of code

Each level builds upon the previous one, increasing in complexity while testing different aspects of coding proficiency.

What specific aspect of the framework would you like to learn about or practice? I can help you:

1. Understand the requirements for each level
2. Provide code examples for specific levels
3. Offer practice problems based on the framework
4. Guide you through implementing solutions step-by-step

Let me know how I can best assist you!
`;
};
