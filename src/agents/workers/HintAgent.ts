import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './BaseAgent';
import { AgentMessage, HintAgentMessage, HintRequest, Hint, CodingProblem } from '../types';

class HintAgent extends BaseAgent {
  private readonly STORE_NAME = 'hints';
  
  // Main message handler for the hint agent
  protected async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    const hintMessage = message as HintAgentMessage;
    
    switch (hintMessage.type) {
      case 'request':
        return this.generateHint(hintMessage);
      case 'provide':
        return this.storeHint(hintMessage);
      default:
        throw new Error(`Unknown message type: ${hintMessage.type}`);
    }
  }
  
  // Generate a hint based on user code and problem
  private async generateHint(message: HintAgentMessage): Promise<HintAgentMessage> {
    const payload = message.payload as HintRequest;
    const { code, language, problemId, userId, sessionId, hintsProvided, difficultyLevel } = payload;
    
    if (!code || !language || !problemId || !userId || !sessionId) {
      throw new Error('All hint parameters are required');
    }
    
    // Get the problem details
    const problem = await this.getProblemDetails(problemId);
    
    if (!problem) {
      throw new Error(`Problem not found: ${problemId}`);
    }
    
    // Generate a hint of appropriate difficulty
    const hint = await this.createHint(code, language, problem, hintsProvided, difficultyLevel);
    
    // Store the hint for future reference
    await this.persistToIndexedDB(this.STORE_NAME, {
      id: hint.id,
      problemId,
      userId,
      sessionId,
      hint,
      timestamp: Date.now()
    });
    
    return this.createResponse(message, 'provide', hint) as HintAgentMessage;
  }
  
  // Store a hint that was provided to a user
  private async storeHint(message: HintAgentMessage): Promise<HintAgentMessage> {
    const hint = message.payload as Hint;
    
    if (!hint || !hint.id) {
      throw new Error('Valid hint is required');
    }
    
    // Simply acknowledge the storage
    return this.createResponse(message, 'provide', {
      ...hint,
      acknowledged: true
    }) as HintAgentMessage;
  }
  
  // Helper to get problem details
  private async getProblemDetails(problemId: string): Promise<CodingProblem | null> {
    try {
      return await this.retrieveFromIndexedDB('problems', problemId);
    } catch (error) {
      console.error('Error retrieving problem details:', error);
      return null;
    }
  }
  
  // Generate a hint based on code analysis and problem requirements
  private async createHint(
    code: string, 
    language: string, 
    problem: CodingProblem, 
    hintsProvided: number, 
    difficultyLevel: number
  ): Promise<Hint> {
    // Analyze the code to determine what kind of hint would be most helpful
    const codeAnalysis = this.analyzeCode(code, language, problem);
    
    // Determine hint level based on how many hints have been provided
    // and the requested difficulty level
    const hintLevel = Math.min(difficultyLevel + hintsProvided, 5);
    
    // Generate a hint based on the analysis and level
    let hintText = '';
    let relatedConcept = '';
    let codeSnippet = '';
    
    // Missing essential concepts
    if (codeAnalysis.missingConcepts.length > 0) {
      const concept = codeAnalysis.missingConcepts[0];
      relatedConcept = concept;
      
      switch (hintLevel) {
        case 1:
          hintText = `Think about how ${concept} might be useful for this problem.`;
          break;
        case 2:
          hintText = `This problem typically requires using ${concept}. Consider how you might apply that.`;
          break;
        case 3:
          hintText = `You should implement a ${concept} approach to solve this efficiently.`;
          codeSnippet = this.getConceptExampleSnippet(concept, language);
          break;
        case 4:
          hintText = `Your solution is missing ${concept}, which is crucial for this problem. Here's how you could start:`;
          codeSnippet = this.getConceptImplementationSnippet(concept, language, problem);
          break;
        case 5:
          hintText = `Let me show you a partial implementation using ${concept}:`;
          codeSnippet = this.getDetailedImplementationSnippet(concept, language, problem);
          break;
      }
    }
    // Inefficient approach
    else if (codeAnalysis.inefficientApproach) {
      relatedConcept = 'optimization';
      
      switch (hintLevel) {
        case 1:
          hintText = 'Consider if there\'s a more efficient approach to this problem.';
          break;
        case 2:
          hintText = `Your current approach might be too ${codeAnalysis.inefficientReason}. Think about alternative data structures.`;
          break;
        case 3:
          hintText = `Try using a ${codeAnalysis.suggestedDataStructure} to improve the efficiency of your solution.`;
          codeSnippet = this.getDataStructureExampleSnippet(codeAnalysis.suggestedDataStructure, language);
          break;
        case 4:
          hintText = `Your solution can be optimized by replacing the ${codeAnalysis.inefficientPattern} with a ${codeAnalysis.suggestedDataStructure} approach:`;
          codeSnippet = this.getOptimizationSnippet(codeAnalysis.suggestedDataStructure, language, problem);
          break;
        case 5:
          hintText = `Here's how you can rewrite your solution to be more efficient:`;
          codeSnippet = this.getOptimizedImplementationSnippet(language, problem);
          break;
      }
    }
    // Edge case handling
    else if (codeAnalysis.missingEdgeCases.length > 0) {
      const edgeCase = codeAnalysis.missingEdgeCases[0];
      relatedConcept = 'edge case handling';
      
      switch (hintLevel) {
        case 1:
          hintText = 'Have you considered all possible edge cases?';
          break;
        case 2:
          hintText = `Make sure your solution handles ${edgeCase} correctly.`;
          break;
        case 3:
          hintText = `Your solution needs to handle ${edgeCase}. Think about what should happen in this case.`;
          break;
        case 4:
          hintText = `Add a check for ${edgeCase} to ensure your solution is robust:`;
          codeSnippet = this.getEdgeCaseHandlingSnippet(edgeCase, language);
          break;
        case 5:
          hintText = `Here's how to properly handle ${edgeCase} in your solution:`;
          codeSnippet = this.getDetailedEdgeCaseSnippet(edgeCase, language, problem);
          break;
      }
    }
    // Logical errors
    else if (codeAnalysis.logicalErrors.length > 0) {
      const error = codeAnalysis.logicalErrors[0];
      relatedConcept = 'logic correction';
      
      switch (hintLevel) {
        case 1:
          hintText = 'There might be a logical issue in your solution. Review your approach.';
          break;
        case 2:
          hintText = `Check your logic around ${error.location}.`;
          break;
        case 3:
          hintText = `There's a potential issue with ${error.description}. Think about the expected behavior.`;
          break;
        case 4:
          hintText = `The problem is in your ${error.location}. Here's what's happening:`;
          codeSnippet = `// ${error.explanation}`;
          break;
        case 5:
          hintText = `Here's how to fix the issue in your solution:`;
          codeSnippet = error.fixExample;
          break;
      }
    }
    // General hint if no specific issues were found
    else {
      relatedConcept = 'general approach';
      
      switch (hintLevel) {
        case 1:
          hintText = 'Think about the key operations needed to solve this problem.';
          break;
        case 2:
          hintText = `For this problem, consider using a ${problem.category[0]} approach.`;
          break;
        case 3:
          hintText = `A common pattern for solving this type of problem is to use ${problem.tags?.[0] || 'iteration'}.`;
          break;
        case 4:
          hintText = `Here's a general outline of how to approach this problem:`;
          codeSnippet = this.getApproachOutlineSnippet(language, problem);
          break;
        case 5:
          hintText = `Here's a partial implementation to help you get started:`;
          codeSnippet = this.getPartialImplementationSnippet(language, problem);
          break;
      }
    }
    
    return {
      id: uuidv4(),
      text: hintText,
      level: hintLevel,
      relatedConcept,
      codeSnippet
    };
  }
  
  // Analyze code to determine appropriate hints
  private analyzeCode(code: string, language: string, problem: CodingProblem): any {
    // This would be a sophisticated analysis in a real implementation
    // Here we're just doing basic pattern matching and keyword detection
    
    const analysis = {
      missingConcepts: [] as string[],
      inefficientApproach: false,
      inefficientReason: '',
      inefficientPattern: '',
      suggestedDataStructure: '',
      missingEdgeCases: [] as string[],
      logicalErrors: [] as {
        location: string;
        description: string;
        explanation: string;
        fixExample: string;
      }[]
    };
    
    // Check for missing essential concepts based on problem tags and category
    if (problem.category.includes('arrays') && !code.includes('[') && !code.includes(']')) {
      analysis.missingConcepts.push('array');
    }
    
    if (problem.tags?.includes('hash-table') && 
        !code.includes('Map') && 
        !code.includes('Object') && 
        !code.includes('{}') && 
        !code.match(/{\s*\[.*\]:/)) {
      analysis.missingConcepts.push('hash map');
    }
    
    if (problem.tags?.includes('stack') && 
        !(code.includes('.push') && code.includes('.pop'))) {
      analysis.missingConcepts.push('stack');
    }
    
    if (problem.tags?.includes('queue') && 
        !(code.includes('.push') && code.includes('.shift'))) {
      analysis.missingConcepts.push('queue');
    }
    
    // Check for inefficient approaches
    const hasNestedLoops = code.includes('for') && 
                           code.includes('for', code.indexOf('for') + 1);
    
    if (hasNestedLoops && problem.timeComplexity === 'O(n)') {
      analysis.inefficientApproach = true;
      analysis.inefficientReason = 'slow';
      analysis.inefficientPattern = 'nested loops';
      analysis.suggestedDataStructure = 'hash map';
    }
    
    if (problem.tags?.includes('binary-search') && 
        !code.includes('mid') && 
        !code.includes('middle') && 
        !code.match(/\w+\s*=\s*\(\s*\w+\s*\+\s*\w+\s*\)\s*\/\s*2/)) {
      analysis.missingConcepts.push('binary search');
    }
    
    // Check for missing edge case handling
    if (!code.includes('null') && 
        !code.includes('undefined') && 
        !code.includes('!') && 
        !code.includes('== null')) {
      analysis.missingEdgeCases.push('null inputs');
    }
    
    if (!code.includes('length === 0') && 
        !code.includes('length == 0') && 
        !code.includes('isEmpty') && 
        !code.includes('empty')) {
      analysis.missingEdgeCases.push('empty collections');
    }
    
    // Detect potential logical errors
    if (code.includes('for') && 
        code.includes('i++') && 
        code.includes('i <') && 
        !code.includes('i < ') && 
        !code.includes('i<=')) {
      analysis.logicalErrors.push({
        location: 'loop condition',
        description: 'loop boundary condition',
        explanation: 'Your loop condition might have an off-by-one error.',
        fixExample: 'for (let i = 0; i < array.length; i++) {'
      });
    }
    
    if (code.includes('return') && 
        code.includes('for') && 
        !code.includes('break') && 
        !code.match(/if\s*\([^)]*\)\s*\{\s*return/)) {
      analysis.logicalErrors.push({
        location: 'return statement',
        description: 'early return without condition',
        explanation: 'You might be returning too early, before the loop completes.',
        fixExample: 'let result = initialValue;\nfor (let i = 0; i < array.length; i++) {\n  // process data\n}\nreturn result;'
      });
    }
    
    return analysis;
  }
  
  // Example snippet generators
  private getConceptExampleSnippet(concept: string, language: string): string {
    const examples: Record<string, Record<string, string>> = {
      'array': {
        'javascript': 'const array = [1, 2, 3, 4, 5];\n// Access: array[0] -> 1\n// Length: array.length -> 5',
        'python': 'array = [1, 2, 3, 4, 5]\n# Access: array[0] -> 1\n# Length: len(array) -> 5'
      },
      'hash map': {
        'javascript': 'const map = new Map();\nmap.set("key", "value");\n// Get: map.get("key") -> "value"\n// Check: map.has("key") -> true',
        'python': 'map = {}\nmap["key"] = "value"\n# Get: map["key"] -> "value"\n# Check: "key" in map -> True'
      },
      'stack': {
        'javascript': 'const stack = [];\nstack.push(1);  // Add to top\nstack.push(2);  // Add to top\nconst top = stack.pop();  // Remove from top (returns 2)',
        'python': 'stack = []\nstack.append(1)  # Add to top\nstack.append(2)  # Add to top\ntop = stack.pop()  # Remove from top (returns 2)'
      },
      'queue': {
        'javascript': 'const queue = [];\nqueue.push(1);  // Add to end\nqueue.push(2);  // Add to end\nconst front = queue.shift();  // Remove from front (returns 1)',
        'python': 'from collections import deque\nqueue = deque()\nqueue.append(1)  # Add to end\nqueue.append(2)  # Add to end\nfront = queue.popleft()  # Remove from front (returns 1)'
      },
      'binary search': {
        'javascript': 'let left = 0, right = array.length - 1;\nwhile (left <= right) {\n  const mid = Math.floor((left + right) / 2);\n  if (array[mid] === target) return mid;\n  if (array[mid] < target) left = mid + 1;\n  else right = mid - 1;\n}',
        'python': 'left, right = 0, len(array) - 1\nwhile left <= right:\n  mid = (left + right) // 2\n  if array[mid] == target: return mid\n  if array[mid] < target: left = mid + 1\n  else: right = mid - 1'
      }
    };
    
    return examples[concept]?.[language] || 'Example not available for this concept and language';
  }
  
  private getConceptImplementationSnippet(concept: string, language: string, problem: CodingProblem): string {
    // Simplified implementation
    return this.getConceptExampleSnippet(concept, language);
  }
  
  private getDetailedImplementationSnippet(concept: string, language: string, problem: CodingProblem): string {
    // More detailed implementation
    return this.getConceptExampleSnippet(concept, language);
  }
  
  private getDataStructureExampleSnippet(dataStructure: string, language: string): string {
    return this.getConceptExampleSnippet(dataStructure, language);
  }
  
  private getOptimizationSnippet(dataStructure: string, language: string, problem: CodingProblem): string {
    // Simplified optimization example
    return this.getConceptExampleSnippet(dataStructure, language);
  }
  
  private getOptimizedImplementationSnippet(language: string, problem: CodingProblem): string {
    // More detailed optimization example
    const examples: Record<string, string> = {
      'javascript': 'function optimizedSolution(input) {\n  // Using a more efficient approach\n  const map = new Map();\n  \n  // Process the input\n  for (let i = 0; i < input.length; i++) {\n    map.set(input[i], i);\n  }\n  \n  // Use the map for O(1) lookups\n  // ...\n  \n  return result;\n}',
      'python': 'def optimized_solution(input):\n  # Using a more efficient approach\n  mapping = {}\n  \n  // Process the input\n  for i, value in enumerate(input):\n    mapping[value] = i\n  \n  // Use the mapping for O(1) lookups\n  // ...\n  \n  return result'
    };
    
    return examples[language] || 'Example not available for this language';
  }
  
  private getEdgeCaseHandlingSnippet(edgeCase: string, language: string): string {
    const examples: Record<string, Record<string, string>> = {
      'null inputs': {
        'javascript': 'if (input === null || input === undefined) {\n  return defaultValue; // Or throw an error\n}',
        'python': 'if input is None:\n  return default_value  # Or raise an exception'
      },
      'empty collections': {
        'javascript': 'if (!array || array.length === 0) {\n  return []; // Or appropriate default\n}',
        'python': 'if not array:\n  return []  # Or appropriate default'
      }
    };
    
    return examples[edgeCase]?.[language] || 'Example not available for this edge case and language';
  }
  
  private getDetailedEdgeCaseSnippet(edgeCase: string, language: string, problem: CodingProblem): string {
    // More detailed edge case handling
    return this.getEdgeCaseHandlingSnippet(edgeCase, language);
  }
  
  private getApproachOutlineSnippet(language: string, problem: CodingProblem): string {
    const examples: Record<string, string> = {
      'javascript': '// 1. Parse the input\n// 2. Initialize data structures\n// 3. Process each element\n// 4. Calculate the result\n// 5. Handle edge cases\n// 6. Return the answer',
      'python': '# 1. Parse the input\n# 2. Initialize data structures\n# 3. Process each element\n# 4. Calculate the result\n# 5. Handle edge cases\n# 6. Return the answer'
    };
    
    return examples[language] || 'Approach outline not available for this language';
  }
  
  private getPartialImplementationSnippet(language: string, problem: CodingProblem): string {
    const examples: Record<string, string> = {
      'javascript': 'function solution(input) {\n  // Handle edge cases\n  if (!input || input.length === 0) {\n    return defaultValue;\n  }\n  \n  // Initialize result\n  let result = initialValue;\n  \n  // Process the input\n  for (let i = 0; i < input.length; i++) {\n    // TODO: Implement the core logic\n  }\n  \n  return result;\n}',
      'python': 'def solution(input):\n  # Handle edge cases\n  if not input:\n    return default_value\n  \n  # Initialize result\n  result = initial_value\n  \n  // Process the input\n  for item in input:\n    # TODO: Implement the core logic\n    pass\n  \n  return result'
    };
    
    return examples[language] || 'Implementation example not available for this language';
  }
}

// Instantiate the agent to start listening for messages
new HintAgent(); 