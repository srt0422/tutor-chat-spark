// Agent Message Types
export type AgentRole = 'session' | 'problem' | 'evaluation' | 'hint' | 'study-plan' | 'history';

export interface AgentMessage {
  id: string;
  type: string;
  payload: any;
}

// Session Agent Types
export interface SessionContext {
  userId: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  targetAreas: string[];
  sessionStartTime: number;
  lastActive: number;
}

export interface SessionAgentMessage extends AgentMessage {
  type: 'init' | 'update' | 'end' | 'persist';
  payload: {
    context?: SessionContext;
    message?: string;
    sessionId?: string;
  };
}

// Problem Agent Types
export interface CodingProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: string[];
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  timeComplexity: string;
  spaceComplexity: string;
  tags: string[];
}

export interface ProblemAgentMessage extends AgentMessage {
  type: 'request' | 'suggest' | 'provide' | 'filter';
  payload: {
    difficulty?: string;
    category?: string[];
    problem?: CodingProblem;
    userId?: string;
    sessionId?: string;
  };
}

// Evaluation Agent Types
export interface CodeEvaluation {
  correctness: number; // 0-100
  timeComplexity: {
    actual: string;
    expected: string;
    score: number; // 0-100
  };
  spaceComplexity: {
    actual: string;
    expected: string;
    score: number; // 0-100
  };
  edgeCases: {
    covered: string[];
    missed: string[];
    score: number; // 0-100
  };
  codeQuality: {
    readability: number; // 0-100
    maintainability: number; // 0-100
    bestPractices: number; // 0-100
  };
  overallScore: number; // 0-100
  feedback: string;
  suggestions: string[];
}

export interface EvaluationAgentMessage extends AgentMessage {
  type: 'evaluate' | 'feedback' | 'improve';
  payload: {
    code: string;
    language: string;
    problemId: string;
    userId: string;
    sessionId: string;
    evaluation?: CodeEvaluation;
  };
}

// Hint Agent Types
export interface HintRequest {
  code: string;
  language: string;
  problemId: string;
  userId: string;
  sessionId: string;
  hintsProvided: number;
  difficultyLevel: number; // 1-5, how explicit the hint should be
}

export interface Hint {
  id: string;
  text: string;
  level: number; // 1-5, how explicit the hint is
  relatedConcept?: string;
  codeSnippet?: string;
}

export interface HintAgentMessage extends AgentMessage {
  type: 'request' | 'provide';
  payload: HintRequest | Hint;
}

// Study Plan Agent Types
export interface PerformanceMetric {
  category: string;
  score: number; // 0-100
  problemsSolved: number;
  averageTime: number; // in seconds
  commonMistakes: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface StudyPlan {
  userId: string;
  createdAt: number;
  metrics: PerformanceMetric[];
  recommendations: {
    category: string;
    resources: {
      title: string;
      type: 'article' | 'video' | 'practice' | 'book';
      url?: string;
      description: string;
    }[];
    priority: number; // 1-5
  }[];
  milestones: {
    title: string;
    description: string;
    targetDate: number;
    completed: boolean;
  }[];
}

export interface StudyPlanAgentMessage extends AgentMessage {
  type: 'analyze' | 'generate' | 'update';
  payload: {
    userId: string;
    sessionIds?: string[];
    evaluations?: CodeEvaluation[];
    studyPlan?: StudyPlan;
  };
}

// History Agent Types
export interface SessionHistory {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime: number;
  problems: {
    problemId: string;
    startTime: number;
    endTime: number;
    attempts: number;
    evaluation?: CodeEvaluation;
  }[];
  metrics: {
    problemsSolved: number;
    averageScore: number;
    timeSpent: number;
    improvementAreas: string[];
  };
}

export interface HistoryAgentMessage extends AgentMessage {
  type: 'fetch' | 'save' | 'analyze';
  payload: {
    userId: string;
    sessionId?: string;
    timeRange?: {
      start: number;
      end: number;
    };
    history?: SessionHistory | SessionHistory[];
  };
} 