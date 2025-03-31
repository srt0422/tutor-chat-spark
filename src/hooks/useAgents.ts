import { useState, useEffect } from 'react';
import AgentManager from '../agents/AgentManager';
import { 
  SessionContext, 
  CodingProblem, 
  CodeEvaluation, 
  Hint, 
  StudyPlan, 
  SessionHistory 
} from '../agents/types';

type AgentHookState = {
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  sessionContext: SessionContext | null;
  currentProblem: CodingProblem | null;
  evaluation: CodeEvaluation | null;
  hints: Hint[];
  studyPlan: StudyPlan | null;
  sessionHistory: SessionHistory[] | null;
};

/**
 * Hook to interface with the agent system
 */
export const useAgents = () => {
  const [agentManager] = useState<AgentManager>(() => AgentManager.getInstance());
  const [state, setState] = useState<AgentHookState>({
    isLoading: false,
    error: null,
    sessionId: null,
    sessionContext: null,
    currentProblem: null,
    evaluation: null,
    hints: [],
    studyPlan: null,
    sessionHistory: null
  });

  /**
   * Initialize a new tutoring session
   */
  const initSession = async (
    userId: string, 
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    targetAreas: string[]
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await agentManager.initSession(userId, experienceLevel, targetAreas);
      setState(prev => ({
        ...prev,
        isLoading: false,
        sessionId: response.payload.sessionId || null,
        sessionContext: response.payload.context || null
      }));
      return response.payload.sessionId;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize session'
      }));
      return null;
    }
  };

  /**
   * Request a coding problem based on criteria
   */
  const requestProblem = async (
    userId: string,
    sessionId: string,
    difficulty?: string,
    category?: string[]
  ) => {
    if (!sessionId) {
      setState(prev => ({
        ...prev,
        error: 'Session ID is required to request a problem'
      }));
      return null;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await agentManager.requestProblem(userId, sessionId, difficulty, category);
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentProblem: response.payload.problem || null
      }));
      return response.payload.problem;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to request problem'
      }));
      return null;
    }
  };

  /**
   * Evaluate code solution against the problem criteria
   */
  const evaluateCode = async (
    code: string,
    language: string,
    problemId: string,
    userId: string,
    sessionId: string
  ) => {
    if (!sessionId || !problemId) {
      setState(prev => ({
        ...prev,
        error: 'Session ID and problem ID are required to evaluate code'
      }));
      return null;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await agentManager.evaluateCode(code, language, problemId, userId, sessionId);
      setState(prev => ({
        ...prev,
        isLoading: false,
        evaluation: response.payload.evaluation || null
      }));
      return response.payload.evaluation;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to evaluate code'
      }));
      return null;
    }
  };

  /**
   * Request a hint for the current problem
   */
  const requestHint = async (
    code: string,
    language: string,
    problemId: string,
    userId: string,
    sessionId: string,
    difficultyLevel: number = 1
  ) => {
    if (!sessionId || !problemId) {
      setState(prev => ({
        ...prev,
        error: 'Session ID and problem ID are required to request a hint'
      }));
      return null;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await agentManager.requestHint(
        code, 
        language, 
        problemId, 
        userId, 
        sessionId, 
        state.hints.length, 
        difficultyLevel
      );
      
      const hint = response.payload as Hint;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        hints: [...prev.hints, hint]
      }));
      
      return hint;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to request hint'
      }));
      return null;
    }
  };

  /**
   * Generate a personalized study plan
   */
  const generateStudyPlan = async (userId: string, sessionIds: string[] = []) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await agentManager.generateStudyPlan(userId, sessionIds);
      setState(prev => ({
        ...prev,
        isLoading: false,
        studyPlan: response.payload.studyPlan || null
      }));
      return response.payload.studyPlan;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate study plan'
      }));
      return null;
    }
  };

  /**
   * Fetch session history
   */
  const fetchHistory = async (
    userId: string, 
    timeRange?: { start: number; end: number }
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await agentManager.fetchHistory(userId, timeRange);
      
      const history = Array.isArray(response.payload.history) 
        ? response.payload.history 
        : response.payload.history ? [response.payload.history] : [];
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        sessionHistory: history
      }));
      
      return history;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch history'
      }));
      return null;
    }
  };

  /**
   * Clean up resources when the component unmounts
   */
  useEffect(() => {
    return () => {
      // Don't actually terminate workers on unmount; they should persist for the app lifetime
      // This would only be appropriate when closing the application
      // agentManager.terminateWorkers();
    };
  }, [agentManager]);

  return {
    ...state,
    initSession,
    requestProblem,
    evaluateCode,
    requestHint,
    generateStudyPlan,
    fetchHistory
  };
};

export default useAgents; 