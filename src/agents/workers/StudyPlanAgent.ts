import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './BaseAgent';
import { 
  AgentMessage, 
  StudyPlanAgentMessage, 
  StudyPlan, 
  PerformanceMetric,
  CodeEvaluation
} from '../types';

class StudyPlanAgent extends BaseAgent {
  private readonly STORE_NAME = 'study_plans';
  
  // Main message handler for the study plan agent
  protected async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    const studyPlanMessage = message as StudyPlanAgentMessage;
    
    switch (studyPlanMessage.type) {
      case 'analyze':
        return this.analyzePerformance(studyPlanMessage);
      case 'generate':
        return this.generateStudyPlan(studyPlanMessage);
      case 'update':
        return this.updateStudyPlan(studyPlanMessage);
      default:
        throw new Error(`Unknown message type: ${studyPlanMessage.type}`);
    }
  }
  
  // Analyze user performance across sessions
  private async analyzePerformance(message: StudyPlanAgentMessage): Promise<StudyPlanAgentMessage> {
    const { userId, sessionIds } = message.payload;
    
    if (!userId) {
      throw new Error('User ID is required for performance analysis');
    }
    
    // Get all evaluations for this user
    const evaluations = await this.getEvaluationsForUser(userId, sessionIds);
    
    // Analyze the evaluations and generate metrics
    const metrics = this.generatePerformanceMetrics(evaluations);
    
    return this.createResponse(message, 'analyze', {
      userId,
      metrics
    }) as StudyPlanAgentMessage;
  }
  
  // Generate a personalized study plan
  private async generateStudyPlan(message: StudyPlanAgentMessage): Promise<StudyPlanAgentMessage> {
    const { userId, sessionIds, evaluations: providedEvaluations } = message.payload;
    
    if (!userId) {
      throw new Error('User ID is required for study plan generation');
    }
    
    // Get evaluations either from the message or from the database
    const evaluations = providedEvaluations || await this.getEvaluationsForUser(userId, sessionIds);
    
    // Generate performance metrics
    const metrics = this.generatePerformanceMetrics(evaluations);
    
    // Generate recommendations based on metrics
    const recommendations = this.generateRecommendations(metrics);
    
    // Generate milestones
    const milestones = this.generateMilestones(metrics, recommendations);
    
    // Create the study plan
    const studyPlan: StudyPlan = {
      userId,
      createdAt: Date.now(),
      metrics,
      recommendations,
      milestones
    };
    
    // Persist the study plan
    await this.persistToIndexedDB(this.STORE_NAME, studyPlan);
    
    return this.createResponse(message, 'generate', {
      userId,
      studyPlan
    }) as StudyPlanAgentMessage;
  }
  
  // Update an existing study plan
  private async updateStudyPlan(message: StudyPlanAgentMessage): Promise<StudyPlanAgentMessage> {
    const { userId, studyPlan } = message.payload;
    
    if (!userId || !studyPlan) {
      throw new Error('User ID and study plan are required for updates');
    }
    
    // Persist the updated study plan
    await this.persistToIndexedDB(this.STORE_NAME, {
      ...studyPlan,
      lastUpdated: Date.now()
    });
    
    return this.createResponse(message, 'update', {
      userId,
      studyPlan
    }) as StudyPlanAgentMessage;
  }
  
  // Retrieve all evaluations for a user
  private async getEvaluationsForUser(userId: string, sessionIds?: string[]): Promise<CodeEvaluation[]> {
    try {
      // Get all evaluations from database
      const allEvaluations = await this.retrieveAllFromIndexedDB('evaluations');
      
      // Filter by user ID
      let userEvaluations = allEvaluations.filter(item => item.userId === userId);
      
      // If session IDs are provided, further filter by those
      if (sessionIds && sessionIds.length > 0) {
        userEvaluations = userEvaluations.filter(item => 
          sessionIds.includes(item.sessionId)
        );
      }
      
      // Extract just the evaluation objects
      return userEvaluations.map(item => item.evaluation);
    } catch (error) {
      console.error('Error retrieving evaluations:', error);
      return [];
    }
  }
  
  // Generate performance metrics from evaluations
  private generatePerformanceMetrics(evaluations: CodeEvaluation[]): PerformanceMetric[] {
    if (!evaluations || evaluations.length === 0) {
      return [];
    }
    
    // Group evaluations by problem category
    const categoriesMap = new Map<string, CodeEvaluation[]>();
    
    // For demo purposes, we'll create some basic categories
    const demoCategories = [
      'arrays',
      'algorithms',
      'data structures',
      'time complexity',
      'space complexity',
      'edge cases',
      'code quality'
    ];
    
    demoCategories.forEach(category => {
      categoriesMap.set(category, []);
    });
    
    // Distribute evaluations to categories randomly for demonstration
    evaluations.forEach(evaluation => {
      // In a real implementation, we would categorize based on problem metadata
      const randomCategory = demoCategories[Math.floor(Math.random() * demoCategories.length)];
      const categoryEvals = categoriesMap.get(randomCategory) || [];
      categoryEvals.push(evaluation);
      categoriesMap.set(randomCategory, categoryEvals);
    });
    
    // Process each category and generate metrics
    const metrics: PerformanceMetric[] = [];
    
    categoriesMap.forEach((categoryEvals, category) => {
      if (categoryEvals.length === 0) return;
      
      // Calculate average scores
      const avgOverallScore = this.calculateAverage(categoryEvals.map(e => e.overallScore));
      const avgTimeComplexityScore = this.calculateAverage(categoryEvals.map(e => e.timeComplexity.score));
      const avgSpaceComplexityScore = this.calculateAverage(categoryEvals.map(e => e.spaceComplexity.score));
      const avgEdgeCasesScore = this.calculateAverage(categoryEvals.map(e => e.edgeCases.score));
      const avgCodeQualityScore = this.calculateAverage(categoryEvals.map(e => 
        (e.codeQuality.readability + e.codeQuality.maintainability + e.codeQuality.bestPractices) / 3
      ));
      
      // Identify common mistakes
      const commonMistakes: string[] = [];
      
      // Check for common time complexity issues
      if (avgTimeComplexityScore < 70) {
        commonMistakes.push('Inefficient algorithms (time complexity)');
      }
      
      // Check for common space complexity issues
      if (avgSpaceComplexityScore < 70) {
        commonMistakes.push('Inefficient memory usage (space complexity)');
      }
      
      // Check for edge case handling
      if (avgEdgeCasesScore < 70) {
        const missedEdgeCases = new Set<string>();
        categoryEvals.forEach(e => {
          e.edgeCases.missed.forEach(edgeCase => missedEdgeCases.add(edgeCase));
        });
        
        if (missedEdgeCases.size > 0) {
          commonMistakes.push(`Missing edge cases: ${Array.from(missedEdgeCases).join(', ')}`);
        }
      }
      
      // Check for code quality issues
      if (avgCodeQualityScore < 70) {
        commonMistakes.push('Code quality issues (readability, maintainability, best practices)');
      }
      
      // Identify strengths
      const strengths: string[] = [];
      
      if (avgTimeComplexityScore >= 85) {
        strengths.push('Good algorithmic efficiency');
      }
      
      if (avgSpaceComplexityScore >= 85) {
        strengths.push('Good memory optimization');
      }
      
      if (avgEdgeCasesScore >= 85) {
        strengths.push('Thorough edge case handling');
      }
      
      if (avgCodeQualityScore >= 85) {
        strengths.push('High code quality');
      }
      
      // Identify weaknesses
      const weaknesses: string[] = [];
      
      if (avgTimeComplexityScore < 60) {
        weaknesses.push('Needs significant improvement in algorithm efficiency');
      }
      
      if (avgSpaceComplexityScore < 60) {
        weaknesses.push('Needs significant improvement in memory optimization');
      }
      
      if (avgEdgeCasesScore < 60) {
        weaknesses.push('Needs significant improvement in edge case handling');
      }
      
      if (avgCodeQualityScore < 60) {
        weaknesses.push('Needs significant improvement in code quality');
      }
      
      // Create the performance metric
      const metric: PerformanceMetric = {
        category,
        score: Math.round(avgOverallScore),
        problemsSolved: categoryEvals.length,
        averageTime: 0, // We don't have time data in this implementation
        commonMistakes,
        strengths,
        weaknesses
      };
      
      metrics.push(metric);
    });
    
    return metrics;
  }
  
  // Generate recommendations based on performance metrics
  private generateRecommendations(metrics: PerformanceMetric[]): StudyPlan['recommendations'] {
    const recommendations: StudyPlan['recommendations'] = [];
    
    metrics.forEach(metric => {
      // Skip categories with high scores
      if (metric.score >= 85) return;
      
      // Create a recommendation based on the metric
      const recommendation = {
        category: metric.category,
        resources: this.getResourcesForCategory(metric.category, metric.weaknesses),
        priority: this.calculatePriority(metric)
      };
      
      recommendations.push(recommendation);
    });
    
    // Sort recommendations by priority (highest first)
    return recommendations.sort((a, b) => b.priority - a.priority);
  }
  
  // Generate milestones for the study plan
  private generateMilestones(
    metrics: PerformanceMetric[], 
    recommendations: StudyPlan['recommendations']
  ): StudyPlan['milestones'] {
    const milestones: StudyPlan['milestones'] = [];
    
    // Add a milestone for each high-priority recommendation
    const highPriorityRecs = recommendations.filter(rec => rec.priority >= 4);
    
    highPriorityRecs.forEach(rec => {
      const targetDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // One week from now
      
      milestones.push({
        title: `Improve ${rec.category}`,
        description: `Focus on improving your ${rec.category} skills by studying the provided resources and practicing problems.`,
        targetDate,
        completed: false
      });
    });
    
    // Add general improvement milestone
    milestones.push({
      title: 'Overall Skill Improvement',
      description: 'Improve your overall coding skills by practicing a diverse set of problems and applying the learned concepts.',
      targetDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // One month from now
      completed: false
    });
    
    return milestones;
  }
  
  // Helper function to calculate average
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  // Helper function to calculate priority
  private calculatePriority(metric: PerformanceMetric): number {
    // Priority is based on score (lower score = higher priority) and weaknesses
    let priority = Math.max(1, 5 - Math.floor(metric.score / 20));
    
    // Adjust priority based on number of weaknesses
    if (metric.weaknesses.length >= 3) {
      priority = Math.min(5, priority + 1);
    }
    
    return priority;
  }
  
  // Helper function to get resources for a category
  private getResourcesForCategory(category: string, weaknesses: string[]): StudyPlan['recommendations'][0]['resources'] {
    // This would be a more sophisticated recommendation engine in a real implementation
    // For demo purposes, we'll provide some static resources for each category
    
    const resources: StudyPlan['recommendations'][0]['resources'] = [];
    
    const categoryResources: Record<string, Array<{
      title: string;
      type: 'article' | 'video' | 'practice' | 'book';
      url?: string;
      description: string;
    }>> = {
      'arrays': [
        {
          title: 'Array Manipulation Techniques',
          type: 'article',
          description: 'Learn essential array manipulation techniques for coding interviews.'
        },
        {
          title: 'Array Problems Practice Set',
          type: 'practice',
          description: 'A set of array problems to practice your skills.'
        }
      ],
      'algorithms': [
        {
          title: 'Introduction to Algorithms',
          type: 'book',
          description: 'A comprehensive guide to algorithms and their implementations.'
        },
        {
          title: 'Algorithm Visualization',
          type: 'video',
          description: 'Visual explanations of common algorithms.'
        }
      ],
      'data structures': [
        {
          title: 'Mastering Data Structures',
          type: 'article',
          description: 'A deep dive into various data structures and their applications.'
        },
        {
          title: 'Data Structures Practice Problems',
          type: 'practice',
          description: 'Practice problems focusing on different data structures.'
        }
      ],
      'time complexity': [
        {
          title: 'Understanding Time Complexity',
          type: 'article',
          description: 'A guide to understanding and calculating time complexity.'
        },
        {
          title: 'Optimizing Algorithms for Performance',
          type: 'video',
          description: 'Learn techniques to optimize your algorithms for better performance.'
        }
      ],
      'space complexity': [
        {
          title: 'Space Complexity Analysis',
          type: 'article',
          description: 'A guide to understanding and calculating space complexity.'
        },
        {
          title: 'Memory Optimization Techniques',
          type: 'video',
          description: 'Learn how to optimize memory usage in your algorithms.'
        }
      ],
      'edge cases': [
        {
          title: 'Handling Edge Cases in Coding',
          type: 'article',
          description: 'Learn how to identify and handle edge cases in your code.'
        },
        {
          title: 'Edge Case Practice Problems',
          type: 'practice',
          description: 'Practice problems that focus on edge case handling.'
        }
      ],
      'code quality': [
        {
          title: 'Writing Clean Code',
          type: 'book',
          description: 'A guide to writing clean, maintainable, and efficient code.'
        },
        {
          title: 'Code Review Checklist',
          type: 'article',
          description: 'A checklist for reviewing and improving your code quality.'
        }
      ]
    };
    
    // Add resources for the category
    const categoryData = categoryResources[category] || [];
    resources.push(...categoryData);
    
    // Add resources for specific weaknesses
    weaknesses.forEach(weakness => {
      const weaknessKeyword = weakness.toLowerCase();
      
      if (weaknessKeyword.includes('algorithm') || weaknessKeyword.includes('time complexity')) {
        resources.push({
          title: 'Algorithm Efficiency Fundamentals',
          type: 'article',
          description: 'Learn how to design efficient algorithms and analyze time complexity.'
        });
      }
      
      if (weaknessKeyword.includes('memory') || weaknessKeyword.includes('space complexity')) {
        resources.push({
          title: 'Memory-Efficient Programming',
          type: 'article',
          description: 'Techniques for reducing memory usage in your programs.'
        });
      }
      
      if (weaknessKeyword.includes('edge case')) {
        resources.push({
          title: 'Comprehensive Edge Case Analysis',
          type: 'article',
          description: 'A systematic approach to identifying and handling edge cases.'
        });
      }
      
      if (weaknessKeyword.includes('code quality') || weaknessKeyword.includes('readability') || weaknessKeyword.includes('maintainability')) {
        resources.push({
          title: 'Code Quality Best Practices',
          type: 'video',
          description: 'Learn industry best practices for writing high-quality code.'
        });
      }
    });
    
    // Remove duplicates
    const uniqueResources = resources.filter((resource, index, self) =>
      index === self.findIndex(r => r.title === resource.title)
    );
    
    return uniqueResources;
  }
}

// Instantiate the agent to start listening for messages
new StudyPlanAgent(); 