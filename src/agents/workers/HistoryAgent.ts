import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './BaseAgent';
import { 
  AgentMessage, 
  HistoryAgentMessage, 
  SessionHistory, 
  CodeEvaluation 
} from '../types';

class HistoryAgent extends BaseAgent {
  private readonly STORE_NAME = 'session_history';
  
  // Main message handler for the history agent
  protected async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    const historyMessage = message as HistoryAgentMessage;
    
    switch (historyMessage.type) {
      case 'fetch':
        return this.fetchHistory(historyMessage);
      case 'save':
        return this.saveHistory(historyMessage);
      case 'analyze':
        return this.analyzeHistory(historyMessage);
      default:
        throw new Error(`Unknown message type: ${historyMessage.type}`);
    }
  }
  
  // Fetch session history for a user
  private async fetchHistory(message: HistoryAgentMessage): Promise<HistoryAgentMessage> {
    const { userId, sessionId, timeRange } = message.payload;
    
    if (!userId) {
      throw new Error('User ID is required to fetch history');
    }
    
    let history: SessionHistory[] = [];
    
    try {
      // Retrieve all session history records for this user
      const allHistory = await this.retrieveAllFromIndexedDB(this.STORE_NAME);
      
      // Filter by user ID
      history = allHistory.filter(h => h.userId === userId);
      
      // If session ID is provided, filter for just that session
      if (sessionId) {
        history = history.filter(h => h.sessionId === sessionId);
      }
      
      // If time range is provided, filter by that
      if (timeRange) {
        history = history.filter(h => 
          h.startTime >= timeRange.start && 
          (h.endTime <= timeRange.end || !h.endTime)
        );
      }
      
      // Sort by start time, most recent first
      history.sort((a, b) => b.startTime - a.startTime);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
    
    return this.createResponse(message, 'fetch', {
      userId,
      history: history.length === 1 && sessionId ? history[0] : history
    }) as HistoryAgentMessage;
  }
  
  // Save session history
  private async saveHistory(message: HistoryAgentMessage): Promise<HistoryAgentMessage> {
    const { userId, history } = message.payload;
    
    if (!userId || !history) {
      throw new Error('User ID and history are required to save history');
    }
    
    try {
      // Handle both single history object and array of history objects
      if (Array.isArray(history)) {
        for (const historyItem of history) {
          await this.persistToIndexedDB(this.STORE_NAME, historyItem);
        }
      } else {
        await this.persistToIndexedDB(this.STORE_NAME, history);
      }
    } catch (error) {
      console.error('Error saving history:', error);
      throw new Error(`Failed to save history: ${error}`);
    }
    
    return this.createResponse(message, 'save', {
      userId,
      saved: true
    }) as HistoryAgentMessage;
  }
  
  // Analyze session history for trends and insights
  private async analyzeHistory(message: HistoryAgentMessage): Promise<HistoryAgentMessage> {
    const { userId, timeRange } = message.payload;
    
    if (!userId) {
      throw new Error('User ID is required to analyze history');
    }
    
    // Fetch the history first
    const fetchMessage = await this.fetchHistory({
      ...message,
      type: 'fetch',
      payload: {
        userId,
        timeRange
      }
    } as HistoryAgentMessage);
    
    const history = Array.isArray(fetchMessage.payload.history) 
      ? fetchMessage.payload.history as SessionHistory[]
      : [fetchMessage.payload.history as SessionHistory];
    
    // Perform the analysis
    const analysis = this.analyzeSessionHistory(history);
    
    return this.createResponse(message, 'analyze', {
      userId,
      history,
      analysis
    }) as HistoryAgentMessage;
  }
  
  // Helper function to analyze session history
  private analyzeSessionHistory(history: SessionHistory[]): any {
    if (!history || history.length === 0) {
      return {
        totalSessions: 0,
        message: 'No session history available for analysis.'
      };
    }
    
    // Calculate overall metrics
    const totalSessions = history.length;
    const totalProblems = history.reduce((sum, session) => sum + session.problems.length, 0);
    const totalTime = history.reduce((sum, session) => sum + (session.endTime - session.startTime), 0);
    const averageSessionTime = totalTime / totalSessions;
    const averageProblemsPerSession = totalProblems / totalSessions;
    
    // Calculate average scores
    let totalScore = 0;
    let scoreCount = 0;
    
    history.forEach(session => {
      session.problems.forEach(problem => {
        if (problem.evaluation) {
          totalScore += problem.evaluation.overallScore;
          scoreCount++;
        }
      });
    });
    
    const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;
    
    // Find most common improvement areas
    const improvementAreas = new Map<string, number>();
    
    history.forEach(session => {
      if (session.metrics && session.metrics.improvementAreas) {
        session.metrics.improvementAreas.forEach(area => {
          improvementAreas.set(area, (improvementAreas.get(area) || 0) + 1);
        });
      }
    });
    
    // Sort areas by frequency
    const sortedAreas = Array.from(improvementAreas.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([area]) => area);
    
    // Analyze progress over time
    const chronologicalSessions = [...history].sort((a, b) => a.startTime - b.startTime);
    const scoreProgression = [];
    
    for (let i = 0; i < chronologicalSessions.length; i++) {
      const session = chronologicalSessions[i];
      if (session.metrics && typeof session.metrics.averageScore === 'number') {
        scoreProgression.push({
          sessionId: session.sessionId,
          date: new Date(session.startTime).toISOString().split('T')[0],
          score: session.metrics.averageScore
        });
      }
    }
    
    // Calculate trend
    let trend = 'Neutral';
    if (scoreProgression.length >= 2) {
      const firstScore = scoreProgression[0].score;
      const lastScore = scoreProgression[scoreProgression.length - 1].score;
      
      if (lastScore > firstScore * 1.1) {
        trend = 'Improving';
      } else if (lastScore < firstScore * 0.9) {
        trend = 'Declining';
      }
    }
    
    // Identify strengths and weaknesses
    const strengthAreas: string[] = [];
    const weaknessAreas: string[] = [];
    
    // Collect all evaluations from all sessions
    const allEvaluations: CodeEvaluation[] = [];
    
    history.forEach(session => {
      session.problems.forEach(problem => {
        if (problem.evaluation) {
          allEvaluations.push(problem.evaluation);
        }
      });
    });
    
    // Analyze different aspects
    const timeComplexityScores = allEvaluations.map(e => e.timeComplexity.score);
    const spaceComplexityScores = allEvaluations.map(e => e.spaceComplexity.score);
    const edgeCaseScores = allEvaluations.map(e => e.edgeCases.score);
    const readabilityScores = allEvaluations.map(e => e.codeQuality.readability);
    const maintainabilityScores = allEvaluations.map(e => e.codeQuality.maintainability);
    const bestPracticesScores = allEvaluations.map(e => e.codeQuality.bestPractices);
    
    const avgTimeComplexity = this.calculateAverage(timeComplexityScores);
    const avgSpaceComplexity = this.calculateAverage(spaceComplexityScores);
    const avgEdgeCases = this.calculateAverage(edgeCaseScores);
    const avgReadability = this.calculateAverage(readabilityScores);
    const avgMaintainability = this.calculateAverage(maintainabilityScores);
    const avgBestPractices = this.calculateAverage(bestPracticesScores);
    
    // Identify strengths (scores > 80)
    if (avgTimeComplexity > 80) strengthAreas.push('Algorithm Efficiency');
    if (avgSpaceComplexity > 80) strengthAreas.push('Memory Optimization');
    if (avgEdgeCases > 80) strengthAreas.push('Edge Case Handling');
    if (avgReadability > 80) strengthAreas.push('Code Readability');
    if (avgMaintainability > 80) strengthAreas.push('Code Maintainability');
    if (avgBestPractices > 80) strengthAreas.push('Best Practices');
    
    // Identify weaknesses (scores < 60)
    if (avgTimeComplexity < 60) weaknessAreas.push('Algorithm Efficiency');
    if (avgSpaceComplexity < 60) weaknessAreas.push('Memory Optimization');
    if (avgEdgeCases < 60) weaknessAreas.push('Edge Case Handling');
    if (avgReadability < 60) weaknessAreas.push('Code Readability');
    if (avgMaintainability < 60) weaknessAreas.push('Code Maintainability');
    if (avgBestPractices < 60) weaknessAreas.push('Best Practices');
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    // Add specific recommendations based on weaknesses
    weaknessAreas.forEach(area => {
      switch (area) {
        case 'Algorithm Efficiency':
          recommendations.push('Focus on understanding time complexity and practicing algorithm optimization techniques.');
          break;
        case 'Memory Optimization':
          recommendations.push('Study space complexity analysis and practice in-place algorithms and memory-efficient data structures.');
          break;
        case 'Edge Case Handling':
          recommendations.push('Develop a systematic approach to identifying and handling edge cases in your code.');
          break;
        case 'Code Readability':
          recommendations.push('Improve variable naming, add comments, and focus on consistent code formatting.');
          break;
        case 'Code Maintainability':
          recommendations.push('Practice breaking down complex functions into smaller, more maintainable pieces.');
          break;
        case 'Best Practices':
          recommendations.push('Study and apply industry best practices for the languages you\'re working with.');
          break;
      }
    });
    
    // Add general recommendations if needed
    if (recommendations.length === 0 && weaknessAreas.length === 0) {
      recommendations.push('Continue practicing to maintain and improve your already solid skills.');
    }
    
    if (totalSessions < 5) {
      recommendations.push('Complete more practice sessions to get a more accurate assessment of your skills.');
    }
    
    // Return the analysis
    return {
      totalSessions,
      totalProblems,
      totalTime,
      averageSessionTime,
      averageProblemsPerSession,
      averageScore,
      improvementAreas: sortedAreas.slice(0, 3), // Top 3 improvement areas
      scoreProgression,
      trend,
      strengthAreas,
      weaknessAreas,
      recommendations
    };
  }
  
  // Helper function to calculate average
  private calculateAverage(values: number[]): number {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}

// Instantiate the agent to start listening for messages
new HistoryAgent(); 