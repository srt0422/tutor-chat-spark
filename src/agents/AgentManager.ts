import { v4 as uuidv4 } from 'uuid';
import { 
  AgentRole, 
  AgentMessage,
  SessionAgentMessage,
  ProblemAgentMessage,
  EvaluationAgentMessage,
  HintAgentMessage,
  StudyPlanAgentMessage,
  HistoryAgentMessage
} from './types';

// Type for worker message handlers
type MessageHandler = (message: AgentMessage) => void;

class AgentManager {
  private static instance: AgentManager;
  private workers: Map<AgentRole, Worker> = new Map();
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private activeRequests: Map<string, { resolve: Function, reject: Function }> = new Map();

  private constructor() {
    this.initializeWorkers();
  }

  // Singleton pattern
  public static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  // Initialize all agent workers
  private initializeWorkers(): void {
    this.createWorker('session', new Worker(new URL('./workers/SessionAgent.ts', import.meta.url), { type: 'module' }));
    this.createWorker('problem', new Worker(new URL('./workers/ProblemAgent.ts', import.meta.url), { type: 'module' }));
    this.createWorker('evaluation', new Worker(new URL('./workers/EvaluationAgent.ts', import.meta.url), { type: 'module' }));
    this.createWorker('hint', new Worker(new URL('./workers/HintAgent.ts', import.meta.url), { type: 'module' }));
    this.createWorker('study-plan', new Worker(new URL('./workers/StudyPlanAgent.ts', import.meta.url), { type: 'module' }));
    this.createWorker('history', new Worker(new URL('./workers/HistoryAgent.ts', import.meta.url), { type: 'module' }));
  }

  // Create and set up a worker with message handling
  private createWorker(role: AgentRole, worker: Worker): void {
    worker.onmessage = (event) => this.handleWorkerMessage(event.data);
    worker.onerror = (error) => this.handleWorkerError(role, error);
    this.workers.set(role, worker);
  }

  // Handle messages from workers
  private handleWorkerMessage(message: AgentMessage): void {
    console.log(`Received message from worker: ${message.type}`, message);
    
    // If there's a pending promise for this message ID, resolve it
    if (this.activeRequests.has(message.id)) {
      const { resolve } = this.activeRequests.get(message.id)!;
      resolve(message);
      this.activeRequests.delete(message.id);
    }
    
    // Check for registered handlers for this message type
    if (this.messageHandlers.has(message.type)) {
      this.messageHandlers.get(message.type)!(message);
    }
  }

  // Handle worker errors
  private handleWorkerError(role: AgentRole, error: ErrorEvent): void {
    console.error(`Error in ${role} worker:`, error);
    // Attempt to restart the worker if it crashed
    this.restartWorker(role);
  }

  // Restart a worker if it crashes
  private restartWorker(role: AgentRole): void {
    const worker = this.workers.get(role);
    if (worker) {
      worker.terminate();
      switch (role) {
        case 'session':
          this.createWorker(role, new Worker(new URL('./workers/SessionAgent.ts', import.meta.url), { type: 'module' }));
          break;
        case 'problem':
          this.createWorker(role, new Worker(new URL('./workers/ProblemAgent.ts', import.meta.url), { type: 'module' }));
          break;
        case 'evaluation':
          this.createWorker(role, new Worker(new URL('./workers/EvaluationAgent.ts', import.meta.url), { type: 'module' }));
          break;
        case 'hint':
          this.createWorker(role, new Worker(new URL('./workers/HintAgent.ts', import.meta.url), { type: 'module' }));
          break;
        case 'study-plan':
          this.createWorker(role, new Worker(new URL('./workers/StudyPlanAgent.ts', import.meta.url), { type: 'module' }));
          break;
        case 'history':
          this.createWorker(role, new Worker(new URL('./workers/HistoryAgent.ts', import.meta.url), { type: 'module' }));
          break;
      }
    }
  }

  // Register a handler for a specific message type
  public registerHandler(messageType: string, handler: MessageHandler): void {
    this.messageHandlers.set(messageType, handler);
  }

  // Unregister a handler
  public unregisterHandler(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }

  // Send message to a worker and return a promise
  public sendMessage(role: AgentRole, message: AgentMessage): Promise<AgentMessage> {
    return new Promise((resolve, reject) => {
      const worker = this.workers.get(role);
      if (!worker) {
        reject(new Error(`Worker for role '${role}' not found`));
        return;
      }

      const messageId = message.id || uuidv4();
      const messageWithId = { ...message, id: messageId };
      
      // Register promise callbacks
      this.activeRequests.set(messageId, { resolve, reject });
      
      // Set a timeout to reject the promise if no response is received
      setTimeout(() => {
        if (this.activeRequests.has(messageId)) {
          const { reject } = this.activeRequests.get(messageId)!;
          reject(new Error(`Request timed out for message ${messageId}`));
          this.activeRequests.delete(messageId);
        }
      }, 30000); // 30 second timeout
      
      // Send the message to the worker
      worker.postMessage(messageWithId);
    });
  }

  // User Story 1: Session Management
  public async initSession(userId: string, experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert', targetAreas: string[]): Promise<SessionAgentMessage> {
    const message: SessionAgentMessage = {
      id: uuidv4(),
      type: 'init',
      payload: {
        context: {
          userId,
          experienceLevel,
          targetAreas,
          sessionStartTime: Date.now(),
          lastActive: Date.now()
        }
      }
    };
    return this.sendMessage('session', message) as Promise<SessionAgentMessage>;
  }

  // User Story 2: Problem Selection
  public async requestProblem(userId: string, sessionId: string, difficulty?: string, category?: string[]): Promise<ProblemAgentMessage> {
    const message: ProblemAgentMessage = {
      id: uuidv4(),
      type: 'request',
      payload: {
        userId,
        sessionId,
        difficulty,
        category
      }
    };
    return this.sendMessage('problem', message) as Promise<ProblemAgentMessage>;
  }

  // User Story 3: Code Evaluation
  public async evaluateCode(code: string, language: string, problemId: string, userId: string, sessionId: string): Promise<EvaluationAgentMessage> {
    const message: EvaluationAgentMessage = {
      id: uuidv4(),
      type: 'evaluate',
      payload: {
        code,
        language,
        problemId,
        userId,
        sessionId
      }
    };
    return this.sendMessage('evaluation', message) as Promise<EvaluationAgentMessage>;
  }

  // User Story 4: Hint Provision
  public async requestHint(code: string, language: string, problemId: string, userId: string, sessionId: string, hintsProvided: number, difficultyLevel: number): Promise<HintAgentMessage> {
    const message: HintAgentMessage = {
      id: uuidv4(),
      type: 'request',
      payload: {
        code,
        language,
        problemId,
        userId,
        sessionId,
        hintsProvided,
        difficultyLevel
      } as HintRequest
    };
    return this.sendMessage('hint', message) as Promise<HintAgentMessage>;
  }

  // User Story 5: Study Plan Generation
  public async generateStudyPlan(userId: string, sessionIds: string[] = []): Promise<StudyPlanAgentMessage> {
    const message: StudyPlanAgentMessage = {
      id: uuidv4(),
      type: 'generate',
      payload: {
        userId,
        sessionIds
      }
    };
    return this.sendMessage('study-plan', message) as Promise<StudyPlanAgentMessage>;
  }

  // User Story 6: Session History
  public async fetchHistory(userId: string, timeRange?: { start: number; end: number }): Promise<HistoryAgentMessage> {
    const message: HistoryAgentMessage = {
      id: uuidv4(),
      type: 'fetch',
      payload: {
        userId,
        timeRange
      }
    };
    return this.sendMessage('history', message) as Promise<HistoryAgentMessage>;
  }

  // Clean up workers when no longer needed
  public terminateWorkers(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
    this.messageHandlers.clear();
    this.activeRequests.clear();
  }
}

export default AgentManager; 