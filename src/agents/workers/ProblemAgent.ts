import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './BaseAgent';
import { AgentMessage, ProblemAgentMessage, CodingProblem } from '../types';

class ProblemAgent extends BaseAgent {
  private readonly STORE_NAME = 'problems';
  
  // Main message handler for the problem agent
  protected async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    const problemMessage = message as ProblemAgentMessage;
    
    switch (problemMessage.type) {
      case 'request':
        return this.requestProblem(problemMessage);
      case 'suggest':
        return this.suggestProblems(problemMessage);
      case 'provide':
        return this.provideProblem(problemMessage);
      case 'filter':
        return this.filterProblems(problemMessage);
      default:
        throw new Error(`Unknown message type: ${problemMessage.type}`);
    }
  }
  
  // Request a problem based on user criteria
  private async requestProblem(message: ProblemAgentMessage): Promise<ProblemAgentMessage> {
    const { userId, sessionId, difficulty, category } = message.payload;
    
    if (!userId || !sessionId) {
      throw new Error('User ID and session ID are required');
    }
    
    // Load all problems from the database
    const allProblems = await this.getProblemsFromDatabase();
    
    // Initialize problems if database is empty
    if (allProblems.length === 0) {
      await this.initializeSampleProblems();
      allProblems.push(...await this.getProblemsFromDatabase());
    }
    
    // Filter problems based on criteria
    let filteredProblems = [...allProblems];
    
    if (difficulty) {
      filteredProblems = filteredProblems.filter(p => p.difficulty === difficulty);
    }
    
    if (category && category.length > 0) {
      filteredProblems = filteredProblems.filter(p => 
        p.category.some(c => category.includes(c))
      );
    }
    
    // Select a problem randomly from the filtered list
    const selectedProblem = filteredProblems.length > 0 
      ? filteredProblems[Math.floor(Math.random() * filteredProblems.length)]
      : this.generateGenericProblem(difficulty || 'medium', category || ['algorithms']);
    
    // Track that this problem was served to this user
    await this.trackProblemUsage(selectedProblem.id, userId, sessionId);
    
    return this.createResponse(message, 'provide', {
      problem: selectedProblem,
      userId,
      sessionId
    }) as ProblemAgentMessage;
  }
  
  // Suggest multiple problems that match criteria
  private async suggestProblems(message: ProblemAgentMessage): Promise<ProblemAgentMessage> {
    const { userId, sessionId, difficulty, category } = message.payload;
    
    if (!userId || !sessionId) {
      throw new Error('User ID and session ID are required');
    }
    
    // Load all problems from the database
    const allProblems = await this.getProblemsFromDatabase();
    
    // Filter problems based on criteria
    let filteredProblems = [...allProblems];
    
    if (difficulty) {
      filteredProblems = filteredProblems.filter(p => p.difficulty === difficulty);
    }
    
    if (category && category.length > 0) {
      filteredProblems = filteredProblems.filter(p => 
        p.category.some(c => category.includes(c))
      );
    }
    
    // Select up to 3 problems
    const suggestedProblems = filteredProblems.slice(0, 3);
    
    return this.createResponse(message, 'suggest', {
      problems: suggestedProblems,
      userId,
      sessionId
    }) as ProblemAgentMessage;
  }
  
  // Provide details for a specific problem
  private async provideProblem(message: ProblemAgentMessage): Promise<ProblemAgentMessage> {
    const { userId, sessionId, problem } = message.payload;
    
    if (!userId || !sessionId) {
      throw new Error('User ID and session ID are required');
    }
    
    if (!problem || !problem.id) {
      throw new Error('Problem ID is required');
    }
    
    // Retrieve the problem from the database
    const problemFromDb = await this.retrieveFromIndexedDB(this.STORE_NAME, problem.id);
    
    if (!problemFromDb) {
      throw new Error(`Problem not found: ${problem.id}`);
    }
    
    // Track that this problem was served to this user
    await this.trackProblemUsage(problemFromDb.id, userId, sessionId);
    
    return this.createResponse(message, 'provide', {
      problem: problemFromDb,
      userId,
      sessionId
    }) as ProblemAgentMessage;
  }
  
  // Filter problems based on criteria
  private async filterProblems(message: ProblemAgentMessage): Promise<ProblemAgentMessage> {
    const { userId, sessionId, difficulty, category } = message.payload;
    
    if (!userId || !sessionId) {
      throw new Error('User ID and session ID are required');
    }
    
    // Load all problems from the database
    const allProblems = await this.getProblemsFromDatabase();
    
    // Filter problems based on criteria
    let filteredProblems = [...allProblems];
    
    if (difficulty) {
      filteredProblems = filteredProblems.filter(p => p.difficulty === difficulty);
    }
    
    if (category && category.length > 0) {
      filteredProblems = filteredProblems.filter(p => 
        p.category.some(c => category.includes(c))
      );
    }
    
    return this.createResponse(message, 'filter', {
      problems: filteredProblems,
      userId,
      sessionId
    }) as ProblemAgentMessage;
  }
  
  // Helper to get all problems from the database
  private async getProblemsFromDatabase(): Promise<CodingProblem[]> {
    try {
      return await this.retrieveAllFromIndexedDB(this.STORE_NAME);
    } catch (error) {
      console.error('Error retrieving problems:', error);
      return [];
    }
  }
  
  // Helper to track which problems have been used by which users
  private async trackProblemUsage(problemId: string, userId: string, sessionId: string): Promise<void> {
    const usageData = {
      id: uuidv4(),
      problemId,
      userId,
      sessionId,
      timestamp: Date.now()
    };
    
    await this.persistToIndexedDB('problem_usage', usageData);
  }
  
  // Helper to generate a generic problem if no suitable problems are found
  private generateGenericProblem(difficulty: string, categories: string[]): CodingProblem {
    return {
      id: uuidv4(),
      title: `${categories[0].charAt(0).toUpperCase() + categories[0].slice(1)} Challenge`,
      description: `Implement a solution for a ${difficulty} level ${categories[0]} problem. The goal is to demonstrate your understanding of ${categories.join(', ')} concepts.`,
      difficulty: difficulty as 'easy' | 'medium' | 'hard' | 'expert',
      category: categories,
      inputFormat: 'Your function should accept appropriate parameters based on the problem description.',
      outputFormat: 'Return the appropriate result as specified in the problem description.',
      constraints: [
        'Your solution should handle edge cases appropriately.',
        `Time complexity should be appropriate for a ${difficulty} level problem.`,
        'Space complexity should be optimized when possible.'
      ],
      examples: [
        {
          input: 'Example input will depend on the specific problem.',
          output: 'Example output will depend on the specific problem.',
          explanation: 'A detailed explanation would be provided here.'
        }
      ],
      timeComplexity: difficulty === 'easy' ? 'O(n)' : difficulty === 'medium' ? 'O(n log n)' : 'O(n²)',
      spaceComplexity: 'O(n)',
      tags: [...categories, difficulty]
    };
  }
  
  // Initialize sample problems for testing and development
  private async initializeSampleProblems(): Promise<void> {
    const sampleProblems: CodingProblem[] = [
      {
        id: uuidv4(),
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
        difficulty: 'easy',
        category: ['arrays', 'algorithms'],
        inputFormat: 'An array of integers nums and an integer target.',
        outputFormat: 'Return an array of two integers, the indices of the two numbers that add up to target.',
        constraints: [
          '2 <= nums.length <= 10^4',
          '-10^9 <= nums[i] <= 10^9',
          '-10^9 <= target <= 10^9',
          'Only one valid answer exists.'
        ],
        examples: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
          },
          {
            input: 'nums = [3,2,4], target = 6',
            output: '[1,2]',
            explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        tags: ['arrays', 'hash-table', 'easy']
      },
      {
        id: uuidv4(),
        title: 'Merge Sorted Arrays',
        description: 'Given two sorted arrays, merge them into a single sorted array.',
        difficulty: 'easy',
        category: ['arrays', 'algorithms'],
        inputFormat: 'Two sorted arrays of integers.',
        outputFormat: 'A single sorted array containing all elements from both input arrays.',
        constraints: [
          'Both input arrays are already sorted in ascending order.',
          'The arrays may be of different lengths.'
        ],
        examples: [
          {
            input: 'arr1 = [1,3,5], arr2 = [2,4,6]',
            output: '[1,2,3,4,5,6]',
            explanation: 'The arrays are merged while maintaining the sorted order.'
          },
          {
            input: 'arr1 = [1,2,3], arr2 = [4,5,6]',
            output: '[1,2,3,4,5,6]',
            explanation: 'The second array is appended to the first.'
          }
        ],
        timeComplexity: 'O(n+m)',
        spaceComplexity: 'O(n+m)',
        tags: ['arrays', 'two-pointers', 'easy']
      },
      {
        id: uuidv4(),
        title: 'Valid Parentheses',
        description: 'Given a string containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order.',
        difficulty: 'medium',
        category: ['stacks', 'algorithms'],
        inputFormat: 'A string containing only parentheses characters: `(`, `)`, `{`, `}`, `[` and `]`.',
        outputFormat: 'Return true if the string is valid, false otherwise.',
        constraints: [
          '1 <= s.length <= 10^4',
          's consists of parentheses only `()[]{}`'
        ],
        examples: [
          {
            input: 's = "()"',
            output: 'true',
            explanation: 'The opening parenthesis is properly closed.'
          },
          {
            input: 's = "()[]{}"',
            output: 'true',
            explanation: 'All opening brackets are closed by the same type in the correct order.'
          },
          {
            input: 's = "(]"',
            output: 'false',
            explanation: 'The brackets are not closed with the same type.'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        tags: ['stacks', 'strings', 'medium']
      },
      {
        id: uuidv4(),
        title: 'LRU Cache',
        description: 'Design and implement a data structure for Least Recently Used (LRU) cache. It should support the following operations: get and put. get(key) - Get the value of the key if the key exists in the cache, otherwise return -1. put(key, value) - Set or insert the value if the key is not already present. When the cache reached its capacity, it should invalidate the least recently used item before inserting a new item.',
        difficulty: 'hard',
        category: ['data-structures', 'design'],
        inputFormat: 'Operations to perform on the LRU cache.',
        outputFormat: 'Results of the get operations and confirmation of put operations.',
        constraints: [
          'The capacity of the cache is a positive integer.',
          'The functions get and put must each run in O(1) average time complexity.'
        ],
        examples: [
          {
            input: 'LRUCache cache = new LRUCache(2); cache.put(1, 1); cache.put(2, 2); cache.get(1); cache.put(3, 3); cache.get(2); cache.put(4, 4); cache.get(1); cache.get(3); cache.get(4);',
            output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
            explanation: 'The operations follow the LRU policy where least recently used items are evicted when the cache is full.'
          }
        ],
        timeComplexity: 'O(1) for both get and put operations',
        spaceComplexity: 'O(capacity)',
        tags: ['hash-table', 'linked-list', 'design', 'hard']
      },
      {
        id: uuidv4(),
        title: 'Binary Tree Level Order Traversal',
        description: 'Given the root of a binary tree, return the level order traversal of its nodes\' values. (i.e., from left to right, level by level).',
        difficulty: 'medium',
        category: ['trees', 'algorithms'],
        inputFormat: 'The root of a binary tree.',
        outputFormat: 'An array of arrays, where each inner array contains the values of nodes at that level.',
        constraints: [
          'The number of nodes in the tree is in the range [0, 2000].',
          '-1000 <= Node.val <= 1000'
        ],
        examples: [
          {
            input: 'root = [3,9,20,null,null,15,7]',
            output: '[[3],[9,20],[15,7]]',
            explanation: 'The tree has 3 levels, and each level is represented as an array.'
          },
          {
            input: 'root = [1]',
            output: '[[1]]',
            explanation: 'A tree with only the root node has a single level.'
          }
        ],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        tags: ['trees', 'breadth-first-search', 'medium']
      }
    ];
    
    // Store each problem in the database
    for (const problem of sampleProblems) {
      await this.persistToIndexedDB(this.STORE_NAME, problem);
    }
  }
}

// Instantiate the agent to start listening for messages
new ProblemAgent(); 