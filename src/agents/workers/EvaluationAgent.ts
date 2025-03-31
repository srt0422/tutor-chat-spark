import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './BaseAgent';
import { AgentMessage, EvaluationAgentMessage, CodeEvaluation, CodingProblem } from '../types';

class EvaluationAgent extends BaseAgent {
  private readonly STORE_NAME = 'evaluations';
  
  // Main message handler for the evaluation agent
  protected async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    const evaluationMessage = message as EvaluationAgentMessage;
    
    switch (evaluationMessage.type) {
      case 'evaluate':
        return this.evaluateCode(evaluationMessage);
      case 'feedback':
        return this.provideFeedback(evaluationMessage);
      case 'improve':
        return this.suggestImprovements(evaluationMessage);
      default:
        throw new Error(`Unknown message type: ${evaluationMessage.type}`);
    }
  }
  
  // Evaluate code against industry standards
  private async evaluateCode(message: EvaluationAgentMessage): Promise<EvaluationAgentMessage> {
    const { code, language, problemId, userId, sessionId } = message.payload;
    
    if (!code || !language || !problemId || !userId || !sessionId) {
      throw new Error('All evaluation parameters are required');
    }
    
    // Get the problem details to understand what we're evaluating against
    const problem = await this.getProblemDetails(problemId);
    
    if (!problem) {
      throw new Error(`Problem not found: ${problemId}`);
    }
    
    // Run the evaluation
    const evaluation = await this.performEvaluation(code, language, problem);
    
    // Store the evaluation result
    const evaluationData = {
      id: uuidv4(),
      userId,
      sessionId,
      problemId,
      code,
      language,
      evaluation,
      timestamp: Date.now()
    };
    
    await this.persistToIndexedDB(this.STORE_NAME, evaluationData);
    
    return this.createResponse(message, 'evaluate', {
      code,
      language,
      problemId,
      userId,
      sessionId,
      evaluation
    }) as EvaluationAgentMessage;
  }
  
  // Provide detailed feedback on the code
  private async provideFeedback(message: EvaluationAgentMessage): Promise<EvaluationAgentMessage> {
    const { code, language, problemId, userId, sessionId } = message.payload;
    
    if (!code || !language || !problemId || !userId || !sessionId) {
      throw new Error('All feedback parameters are required');
    }
    
    // Get existing evaluation if available
    let evaluation = message.payload.evaluation;
    
    if (!evaluation) {
      // Try to find a saved evaluation for this code
      const existingEvaluations = await this.retrieveAllFromIndexedDB(this.STORE_NAME);
      const matchingEvaluation = existingEvaluations.find(e => 
        e.userId === userId && 
        e.problemId === problemId && 
        e.code === code
      );
      
      if (matchingEvaluation) {
        evaluation = matchingEvaluation.evaluation;
      } else {
        // Get the problem details
        const problem = await this.getProblemDetails(problemId);
        
        if (!problem) {
          throw new Error(`Problem not found: ${problemId}`);
        }
        
        // Perform a new evaluation
        evaluation = await this.performEvaluation(code, language, problem);
      }
    }
    
    // Generate detailed feedback based on the evaluation
    const detailedFeedback = this.generateDetailedFeedback(evaluation, code, language);
    
    return this.createResponse(message, 'feedback', {
      code,
      language,
      problemId,
      userId,
      sessionId,
      evaluation: {
        ...evaluation,
        feedback: detailedFeedback
      }
    }) as EvaluationAgentMessage;
  }
  
  // Suggest specific improvements to the code
  private async suggestImprovements(message: EvaluationAgentMessage): Promise<EvaluationAgentMessage> {
    const { code, language, problemId, userId, sessionId } = message.payload;
    
    if (!code || !language || !problemId || !userId || !sessionId) {
      throw new Error('All improvement parameters are required');
    }
    
    // Get existing evaluation if available
    let evaluation = message.payload.evaluation;
    
    if (!evaluation) {
      // Try to find a saved evaluation for this code
      const existingEvaluations = await this.retrieveAllFromIndexedDB(this.STORE_NAME);
      const matchingEvaluation = existingEvaluations.find(e => 
        e.userId === userId && 
        e.problemId === problemId && 
        e.code === code
      );
      
      if (matchingEvaluation) {
        evaluation = matchingEvaluation.evaluation;
      } else {
        // Get the problem details
        const problem = await this.getProblemDetails(problemId);
        
        if (!problem) {
          throw new Error(`Problem not found: ${problemId}`);
        }
        
        // Perform a new evaluation
        evaluation = await this.performEvaluation(code, language, problem);
      }
    }
    
    // Generate improvement suggestions
    const improvements = this.generateImprovementSuggestions(evaluation, code, language);
    
    return this.createResponse(message, 'improve', {
      code,
      language,
      problemId,
      userId,
      sessionId,
      evaluation: {
        ...evaluation,
        suggestions: improvements
      }
    }) as EvaluationAgentMessage;
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
  
  // Core evaluation function - applies all evaluation criteria to the code
  private async performEvaluation(code: string, language: string, problem: CodingProblem): Promise<CodeEvaluation> {
    // In a real implementation, this would run actual tests, analyze code, etc.
    // For now, we'll simulate the evaluation with mock analysis
    
    // This is a simplified evaluation for demonstration purposes
    // A real implementation would perform static analysis, run tests, etc.
    
    const analysis = this.analyzeCode(code, language, problem);
    const correctnessScore = this.evaluateCorrectness(code, problem);
    const timeComplexityScore = this.evaluateTimeComplexity(code, problem);
    const spaceComplexityScore = this.evaluateSpaceComplexity(code, problem);
    const edgeCasesScore = this.evaluateEdgeCases(code, problem);
    const codeQualityScore = this.evaluateCodeQuality(code, language);
    
    // Calculate overall score as a weighted average
    const overallScore = Math.round(
      (correctnessScore * 0.4) + 
      (timeComplexityScore.score * 0.15) + 
      (spaceComplexityScore.score * 0.15) + 
      (edgeCasesScore.score * 0.15) + 
      ((codeQualityScore.readability + codeQualityScore.maintainability + codeQualityScore.bestPractices) / 3 * 0.15)
    );
    
    const feedback = this.generateFeedback(
      correctnessScore,
      timeComplexityScore,
      spaceComplexityScore,
      edgeCasesScore,
      codeQualityScore,
      problem
    );
    
    const suggestions = this.generateSuggestions(
      analysis,
      timeComplexityScore,
      spaceComplexityScore,
      edgeCasesScore,
      codeQualityScore
    );
    
    return {
      correctness: correctnessScore,
      timeComplexity: timeComplexityScore,
      spaceComplexity: spaceComplexityScore,
      edgeCases: edgeCasesScore,
      codeQuality: codeQualityScore,
      overallScore,
      feedback,
      suggestions
    };
  }
  
  // Helper to analyze the code structure and characteristics
  private analyzeCode(code: string, language: string, problem: CodingProblem): any {
    // This would be a deep analysis in a real implementation
    // Here we're just doing basic keyword and pattern matching
    
    const analysis = {
      hasLoops: code.includes('for') || code.includes('while'),
      hasRecursion: code.includes('function') && code.match(/\w+\([^)]*\)[^{]*\{[^}]*\1\(/),
      hasComments: code.includes('//') || code.includes('/*'),
      lineCount: code.split('\n').length,
      hasExceptionHandling: code.includes('try') && code.includes('catch'),
      hasEdgeCaseChecks: code.includes('if') && (
        code.includes('null') || 
        code.includes('undefined') || 
        code.includes('length === 0') || 
        code.includes('length == 0')
      ),
      detectedDataStructures: []
    };
    
    // Detect data structures based on keywords
    if (code.includes('Map') || code.includes('new Map') || code.match(/{\s*\[.*\]:/)) {
      analysis.detectedDataStructures.push('hash-map');
    }
    
    if (code.includes('Array') || code.includes('[') || code.includes(']')) {
      analysis.detectedDataStructures.push('array');
    }
    
    if (code.includes('class') || code.includes('prototype')) {
      analysis.detectedDataStructures.push('object-oriented');
    }
    
    if (code.includes('.push') && code.includes('.pop')) {
      analysis.detectedDataStructures.push('stack');
    }
    
    if (code.includes('.push') && code.includes('.shift')) {
      analysis.detectedDataStructures.push('queue');
    }
    
    if (code.includes('next') && code.includes('prev')) {
      analysis.detectedDataStructures.push('linked-list');
    }
    
    return analysis;
  }
  
  // Evaluates code correctness
  private evaluateCorrectness(code: string, problem: CodingProblem): number {
    // In a real implementation, this would run test cases
    // For this demonstration, we'll use a simulated score
    
    // Base score, assuming the solution works
    let score = 85;
    
    // Simple keyword-based checks for this demonstration
    // Using edge cases as a proxy for correctness potential
    if (code.includes('if') && code.includes('else')) {
      score += 5;
    }
    
    if (code.includes('try') && code.includes('catch')) {
      score += 5;
    }
    
    // Check for problem-specific keywords
    const relevantKeywords = this.getRelevantKeywords(problem);
    const matchCount = relevantKeywords.filter(keyword => 
      code.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    score += Math.min(matchCount * 2, 5);
    
    return Math.min(score, 100);
  }
  
  // Evaluates time complexity
  private evaluateTimeComplexity(code: string, problem: CodingProblem): {
    actual: string;
    expected: string;
    score: number;
  } {
    // In a real implementation, this would analyze algorithms
    // For this demonstration, we'll use loop detection as a proxy
    
    const expected = problem.timeComplexity;
    let actual = 'Unknown';
    let score = 70; // Default score
    
    // Very simplistic detection based on code patterns
    if (code.includes('for') && code.includes('for') && code.lastIndexOf('for') !== code.indexOf('for')) {
      // Nested loops suggest O(n²) complexity
      actual = 'O(n²)';
      score = expected === 'O(n²)' ? 100 : expected === 'O(n log n)' ? 70 : 50;
    } else if (code.includes('for') || code.includes('while')) {
      // Single loop suggests O(n) complexity
      actual = 'O(n)';
      score = expected === 'O(n)' ? 100 : expected === 'O(n log n)' ? 90 : expected === 'O(1)' ? 70 : 80;
    } else if (!code.includes('for') && !code.includes('while') && !code.match(/\w+\([^)]*\)[^{]*\{[^}]*\1\(/)) {
      // No loops or recursion suggests O(1) complexity
      actual = 'O(1)';
      score = expected === 'O(1)' ? 100 : 80;
    } else if (code.includes('sort')) {
      // Sort method suggests O(n log n) complexity
      actual = 'O(n log n)';
      score = expected === 'O(n log n)' ? 100 : expected === 'O(n)' ? 70 : 85;
    }
    
    return {
      actual,
      expected,
      score
    };
  }
  
  // Evaluates space complexity
  private evaluateSpaceComplexity(code: string, problem: CodingProblem): {
    actual: string;
    expected: string;
    score: number;
  } {
    // In a real implementation, this would analyze memory usage
    // For this demonstration, we'll use variable creation as a proxy
    
    const expected = problem.spaceComplexity;
    let actual = 'Unknown';
    let score = 70; // Default score
    
    // Very simplistic detection based on code patterns
    if (code.includes('new Array(') || code.includes('Array(') || code.includes('[]')) {
      // Array creation suggests O(n) space
      actual = 'O(n)';
      score = expected === 'O(n)' ? 100 : 75;
    } else if (code.includes('new Map') || code.includes('new Set') || code.match(/{\s*\[.*\]:/)) {
      // Hash maps suggest O(n) space
      actual = 'O(n)';
      score = expected === 'O(n)' ? 100 : 75;
    } else {
      // Few variables suggest O(1) space
      actual = 'O(1)';
      score = expected === 'O(1)' ? 100 : 70;
    }
    
    return {
      actual,
      expected,
      score
    };
  }
  
  // Evaluates handling of edge cases
  private evaluateEdgeCases(code: string, problem: CodingProblem): {
    covered: string[];
    missed: string[];
    score: number;
  } {
    // In a real implementation, this would test edge cases
    // For this demonstration, we'll check for conditional checks
    
    const commonEdgeCases = [
      'empty input',
      'null input',
      'invalid input',
      'boundary values',
      'very large inputs'
    ];
    
    // Check which edge cases are likely covered by the code
    const covered: string[] = [];
    const missed: string[] = [];
    
    if (code.includes('null') || code.includes('undefined') || code.includes('!') || code.includes('== null')) {
      covered.push('null input');
    } else {
      missed.push('null input');
    }
    
    if (code.includes('length === 0') || code.includes('length == 0') || code.includes('isEmpty')) {
      covered.push('empty input');
    } else {
      missed.push('empty input');
    }
    
    if (code.includes('typeof') || code.includes('instanceof') || code.includes('isNaN')) {
      covered.push('invalid input');
    } else {
      missed.push('invalid input');
    }
    
    if (code.includes('Math.max') || code.includes('Math.min') || code.includes('>=') || code.includes('<=')) {
      covered.push('boundary values');
    } else {
      missed.push('boundary values');
    }
    
    if (code.includes('overflow') || code.includes('BigInt') || code.includes('Number.MAX')) {
      covered.push('very large inputs');
    } else {
      missed.push('very large inputs');
    }
    
    // Calculate score based on coverage
    const score = Math.round((covered.length / commonEdgeCases.length) * 100);
    
    return {
      covered,
      missed,
      score
    };
  }
  
  // Evaluates code quality
  private evaluateCodeQuality(code: string, language: string): {
    readability: number;
    maintainability: number;
    bestPractices: number;
  } {
    // In a real implementation, this would use a linter or static analyzer
    // For this demonstration, we'll use simple code characteristics
    
    // Evaluate readability
    let readabilityScore = 70; // Base score
    
    // Check for comments
    if (code.includes('//') || code.includes('/*')) {
      readabilityScore += 10;
    }
    
    // Check for meaningful variable names (approximated by length)
    const variableMatches = code.match(/(?:let|var|const)\s+(\w+)/g) || [];
    const longNamedVariables = variableMatches.filter(v => {
      const name = v.replace(/(?:let|var|const)\s+/, '');
      return name.length > 2 && !['arr', 'obj', 'str', 'num', 'idx', 'val'].includes(name);
    });
    
    if (longNamedVariables.length > 0 && longNamedVariables.length >= variableMatches.length / 2) {
      readabilityScore += 10;
    }
    
    // Check for proper indentation (simplistic)
    if (code.includes('\n  ') || code.includes('\n    ')) {
      readabilityScore += 10;
    }
    
    // Evaluate maintainability
    let maintainabilityScore = 70; // Base score
    
    // Check for function decomposition
    const functionMatches = code.match(/function\s+\w+/g) || [];
    if (functionMatches.length > 1) {
      maintainabilityScore += 15;
    }
    
    // Check for appropriate line length
    const lines = code.split('\n');
    const longLines = lines.filter(line => line.length > 100);
    if (longLines.length < lines.length * 0.1) {
      maintainabilityScore += 15;
    }
    
    // Evaluate best practices
    let bestPracticesScore = 70; // Base score
    
    // Check for const/let usage in modern JS
    if (language.includes('javascript') && (code.includes('const ') || code.includes('let '))) {
      bestPracticesScore += 10;
    }
    
    // Check for error handling
    if (code.includes('try') && code.includes('catch')) {
      bestPracticesScore += 10;
    }
    
    // Check for destructuring or modern syntax
    if (language.includes('javascript') && (code.includes('...') || code.includes('=>') || code.match(/\{[^}]*:/))) {
      bestPracticesScore += 10;
    }
    
    return {
      readability: Math.min(readabilityScore, 100),
      maintainability: Math.min(maintainabilityScore, 100),
      bestPractices: Math.min(bestPracticesScore, 100)
    };
  }
  
  // Generate a summary feedback message
  private generateFeedback(
    correctnessScore: number,
    timeComplexity: { actual: string; expected: string; score: number },
    spaceComplexity: { actual: string; expected: string; score: number },
    edgeCases: { covered: string[]; missed: string[]; score: number },
    codeQuality: { readability: number; maintainability: number; bestPractices: number },
    problem: CodingProblem
  ): string {
    let feedback = '';
    
    // Correctness feedback
    if (correctnessScore >= 90) {
      feedback += 'Your solution correctly addresses the problem requirements. ';
    } else if (correctnessScore >= 70) {
      feedback += 'Your solution appears to address the core problem, but may have minor issues. ';
    } else {
      feedback += 'Your solution may not correctly address all aspects of the problem. ';
    }
    
    // Time complexity feedback
    if (timeComplexity.score >= 90) {
      feedback += `Your time complexity (${timeComplexity.actual}) is optimal for this problem. `;
    } else if (timeComplexity.score >= 70) {
      feedback += `Your time complexity (${timeComplexity.actual}) is good, but could be improved toward ${timeComplexity.expected}. `;
    } else {
      feedback += `Your time complexity (${timeComplexity.actual}) needs improvement to match the expected ${timeComplexity.expected}. `;
    }
    
    // Space complexity feedback
    if (spaceComplexity.score >= 90) {
      feedback += `Your space usage (${spaceComplexity.actual}) is well-optimized. `;
    } else if (spaceComplexity.score >= 70) {
      feedback += `Your space usage (${spaceComplexity.actual}) is acceptable but could be improved. `;
    } else {
      feedback += `Your space usage could be optimized from ${spaceComplexity.actual} toward ${spaceComplexity.expected}. `;
    }
    
    // Edge case feedback
    if (edgeCases.score >= 80) {
      feedback += 'You\'ve handled most important edge cases well. ';
    } else if (edgeCases.score >= 50) {
      feedback += `You've addressed some edge cases, but should also consider: ${edgeCases.missed.join(', ')}. `;
    } else {
      feedback += `Your solution needs more edge case handling for: ${edgeCases.missed.join(', ')}. `;
    }
    
    // Code quality feedback
    const averageQuality = Math.round((codeQuality.readability + codeQuality.maintainability + codeQuality.bestPractices) / 3);
    if (averageQuality >= 85) {
      feedback += 'Your code demonstrates excellent readability and follows best practices. ';
    } else if (averageQuality >= 70) {
      feedback += 'Your code is reasonably clean but could benefit from some style improvements. ';
    } else {
      feedback += 'Your code would benefit significantly from improved formatting and adherence to best practices. ';
    }
    
    return feedback;
  }
  
  // Generate specific improvement suggestions
  private generateSuggestions(
    analysis: any,
    timeComplexity: { actual: string; expected: string; score: number },
    spaceComplexity: { actual: string; expected: string; score: number },
    edgeCases: { covered: string[]; missed: string[]; score: number },
    codeQuality: { readability: number; maintainability: number; bestPractices: number }
  ): string[] {
    const suggestions: string[] = [];
    
    // Time complexity suggestions
    if (timeComplexity.score < 90) {
      if (timeComplexity.actual === 'O(n²)' && timeComplexity.expected === 'O(n log n)') {
        suggestions.push('Consider using a more efficient sorting algorithm or hash-based approach to improve time complexity from O(n²) to O(n log n).');
      } else if (timeComplexity.actual === 'O(n)' && timeComplexity.expected === 'O(1)') {
        suggestions.push('Look for constant-time solutions, possibly using mathematical formulas or hash maps for lookups instead of iteration.');
      } else if (timeComplexity.actual === 'O(n²)' && timeComplexity.expected === 'O(n)') {
        suggestions.push('Replace the nested loops with a single pass through the data, possibly using a hash map or additional data structure.');
      }
    }
    
    // Space complexity suggestions
    if (spaceComplexity.score < 80) {
      suggestions.push('Consider optimizing space usage by modifying data in-place or using more memory-efficient data structures.');
    }
    
    // Edge case suggestions
    if (edgeCases.missed.length > 0) {
      suggestions.push(`Add checks for these edge cases: ${edgeCases.missed.join(', ')}.`);
    }
    
    // Code quality suggestions
    if (codeQuality.readability < 80) {
      suggestions.push('Improve readability with better variable names, comments explaining the approach, and consistent indentation.');
    }
    
    if (codeQuality.maintainability < 80) {
      suggestions.push('Break down complex logic into smaller, well-named functions to improve maintainability.');
    }
    
    if (codeQuality.bestPractices < 80) {
      suggestions.push('Follow industry best practices: use const/let instead of var, add proper error handling, and employ modern syntax where appropriate.');
    }
    
    // Data structure suggestions based on analysis
    if (analysis.hasLoops && !analysis.detectedDataStructures.includes('hash-map') && (timeComplexity.actual === 'O(n²)' || timeComplexity.actual === 'O(n)')) {
      suggestions.push('Consider using a hash map/dictionary for faster lookups, potentially reducing time complexity.');
    }
    
    return suggestions;
  }
  
  // Generate detailed feedback for the feedback message type
  private generateDetailedFeedback(evaluation: CodeEvaluation, code: string, language: string): string {
    // Expands on the basic feedback with more detailed analysis
    let detailedFeedback = evaluation.feedback + '\n\n';
    
    // Add specific details about each aspect
    detailedFeedback += 'Detailed Analysis:\n\n';
    
    // Correctness
    detailedFeedback += `Correctness (${evaluation.correctness}/100): `;
    if (evaluation.correctness >= 90) {
      detailedFeedback += 'Your solution appears to be correct and addresses the requirements of the problem.\n\n';
    } else if (evaluation.correctness >= 70) {
      detailedFeedback += 'Your solution addresses the main requirements but may not handle all scenarios correctly.\n\n';
    } else {
      detailedFeedback += 'Your solution may have significant logical issues that prevent it from solving the problem correctly.\n\n';
    }
    
    // Time Complexity
    detailedFeedback += `Time Complexity (${evaluation.timeComplexity.score}/100): Your solution has an estimated complexity of ${evaluation.timeComplexity.actual}, while the expected optimal solution is ${evaluation.timeComplexity.expected}.\n\n`;
    
    // Space Complexity
    detailedFeedback += `Space Complexity (${evaluation.spaceComplexity.score}/100): Your solution uses approximately ${evaluation.spaceComplexity.actual} space, compared to an expected ${evaluation.spaceComplexity.expected}.\n\n`;
    
    // Edge Cases
    detailedFeedback += `Edge Case Handling (${evaluation.edgeCases.score}/100): `;
    if (evaluation.edgeCases.covered.length > 0) {
      detailedFeedback += `You've handled these edge cases well: ${evaluation.edgeCases.covered.join(', ')}. `;
    }
    if (evaluation.edgeCases.missed.length > 0) {
      detailedFeedback += `You should also consider these edge cases: ${evaluation.edgeCases.missed.join(', ')}. `;
    }
    detailedFeedback += '\n\n';
    
    // Code Quality
    const avgQuality = Math.round((evaluation.codeQuality.readability + evaluation.codeQuality.maintainability + evaluation.codeQuality.bestPractices) / 3);
    detailedFeedback += `Code Quality (${avgQuality}/100):\n`;
    detailedFeedback += `- Readability: ${evaluation.codeQuality.readability}/100\n`;
    detailedFeedback += `- Maintainability: ${evaluation.codeQuality.maintainability}/100\n`;
    detailedFeedback += `- Best Practices: ${evaluation.codeQuality.bestPractices}/100\n\n`;
    
    return detailedFeedback;
  }
  
  // Generate improvement suggestions with more code examples
  private generateImprovementSuggestions(evaluation: CodeEvaluation, code: string, language: string): string[] {
    // Start with the basic suggestions
    const suggestions = [...evaluation.suggestions];
    
    // Add language-specific improvement examples
    if (language === 'javascript' || language === 'typescript') {
      if (evaluation.timeComplexity.score < 90) {
        suggestions.push('For better time efficiency, consider using JavaScript built-ins like Map, Set, or array methods like reduce(), filter(), and map().');
      }
      
      if (evaluation.codeQuality.readability < 85) {
        suggestions.push('Use destructuring and template literals to make your code more readable:\n```javascript\nconst { name, age } = person;\nconst greeting = `Hello, ${name}!`;\n```');
      }
    } else if (language === 'python') {
      if (evaluation.timeComplexity.score < 90) {
        suggestions.push('Consider using Python\'s built-in data structures like dict, set, or list comprehensions for better performance.');
      }
      
      if (evaluation.codeQuality.readability < 85) {
        suggestions.push('Use list comprehensions and dict comprehensions for more concise code:\n```python\nsquared = [x*x for x in numbers]\n```');
      }
    }
    
    // Add specific examples related to code structure
    if (evaluation.codeQuality.maintainability < 80) {
      suggestions.push('Extract repeating logic into helper functions. For example:\n```\nfunction isValidInput(input) {\n  return input !== null && input !== undefined && input.length > 0;\n}\n```');
    }
    
    // Add specific edge case handling examples
    if (evaluation.edgeCases.score < 70) {
      suggestions.push('Add explicit checks for common edge cases at the beginning of your function:\n```\nif (!input || input.length === 0) {\n  return defaultValue; // Handle empty input\n}\n```');
    }
    
    return suggestions;
  }
  
  // Get problem-relevant keywords for correctness evaluation
  private getRelevantKeywords(problem: CodingProblem): string[] {
    // Extract keywords from the problem category and description
    const keywords: string[] = [...problem.category];
    
    // Add tags as keywords
    if (problem.tags && problem.tags.length > 0) {
      keywords.push(...problem.tags);
    }
    
    // Extract additional keywords from the problem description
    const descriptionWords = problem.description.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4); // Only consider longer words
    
    // Add common algorithm names if found in description
    const algorithmKeywords = [
      'sort', 'search', 'bfs', 'dfs', 'dynamic', 'greedy', 'backtrack',
      'recursive', 'divide', 'conquer', 'binary', 'tree', 'graph', 'hash',
      'linked', 'stack', 'queue', 'heap', 'trie', 'segment', 'union'
    ];
    
    for (const word of descriptionWords) {
      if (algorithmKeywords.some(keyword => word.includes(keyword))) {
        keywords.push(word);
      }
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }
}

// Instantiate the agent to start listening for messages
new EvaluationAgent(); 