import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './BaseAgent';
import { AgentMessage, SessionAgentMessage, SessionContext } from '../types';

class SessionAgent extends BaseAgent {
  private readonly STORE_NAME = 'sessions';
  
  // Main message handler for the session agent
  protected async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    const sessionMessage = message as SessionAgentMessage;
    
    switch (sessionMessage.type) {
      case 'init':
        return this.initializeSession(sessionMessage);
      case 'update':
        return this.updateSession(sessionMessage);
      case 'end':
        return this.endSession(sessionMessage);
      case 'persist':
        return this.persistSession(sessionMessage);
      default:
        throw new Error(`Unknown message type: ${sessionMessage.type}`);
    }
  }
  
  // Initialize a new tutoring session
  private async initializeSession(message: SessionAgentMessage): Promise<SessionAgentMessage> {
    const { context } = message.payload;
    
    if (!context || !context.userId) {
      throw new Error('Session context must include userId');
    }
    
    // Generate a session ID
    const sessionId = uuidv4();
    
    // Create the welcome message based on the user's experience level and target areas
    const welcomeMessage = this.generateWelcomeMessage(context);
    
    // Store the session in IndexedDB
    const sessionData = {
      id: sessionId,
      context,
      startTime: Date.now(),
      lastActive: Date.now(),
      isActive: true,
      messages: [{
        id: uuidv4(),
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }]
    };
    
    await this.persistToIndexedDB(this.STORE_NAME, sessionData);
    
    // Return the initialized session
    return this.createResponse(message, 'init', {
      sessionId,
      message: welcomeMessage,
      context
    }) as SessionAgentMessage;
  }
  
  // Update an existing session
  private async updateSession(message: SessionAgentMessage): Promise<SessionAgentMessage> {
    const { sessionId, context } = message.payload;
    
    if (!sessionId) {
      throw new Error('Session ID is required for updates');
    }
    
    // Retrieve the existing session
    const session = await this.retrieveFromIndexedDB(this.STORE_NAME, sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Update the session context and lastActive timestamp
    const updatedSession = {
      ...session,
      context: context || session.context,
      lastActive: Date.now()
    };
    
    await this.persistToIndexedDB(this.STORE_NAME, updatedSession);
    
    return this.createResponse(message, 'update', {
      sessionId,
      context: updatedSession.context
    }) as SessionAgentMessage;
  }
  
  // End a session
  private async endSession(message: SessionAgentMessage): Promise<SessionAgentMessage> {
    const { sessionId } = message.payload;
    
    if (!sessionId) {
      throw new Error('Session ID is required to end session');
    }
    
    // Retrieve the existing session
    const session = await this.retrieveFromIndexedDB(this.STORE_NAME, sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Mark the session as inactive and set the end time
    const endedSession = {
      ...session,
      isActive: false,
      endTime: Date.now()
    };
    
    await this.persistToIndexedDB(this.STORE_NAME, endedSession);
    
    return this.createResponse(message, 'end', {
      sessionId,
      message: 'Your tutoring session has ended. Thank you for practicing with the Industry Coding Tutor!'
    }) as SessionAgentMessage;
  }
  
  // Persist a message to the session
  private async persistSession(message: SessionAgentMessage): Promise<SessionAgentMessage> {
    const { sessionId, message: messageContent } = message.payload;
    
    if (!sessionId || !messageContent) {
      throw new Error('Session ID and message content are required');
    }
    
    // Retrieve the existing session
    const session = await this.retrieveFromIndexedDB(this.STORE_NAME, sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    // Add the message to the session's message history
    const updatedSession = {
      ...session,
      lastActive: Date.now(),
      messages: [
        ...session.messages,
        {
          id: uuidv4(),
          role: 'assistant',
          content: messageContent,
          timestamp: new Date()
        }
      ]
    };
    
    await this.persistToIndexedDB(this.STORE_NAME, updatedSession);
    
    return this.createResponse(message, 'persist', {
      sessionId,
      message: messageContent
    }) as SessionAgentMessage;
  }
  
  // Generate a personalized welcome message based on the user's context
  private generateWelcomeMessage(context: SessionContext): string {
    const { experienceLevel, targetAreas } = context;
    
    let levelDescription = '';
    switch (experienceLevel) {
      case 'beginner':
        levelDescription = 'foundational coding skills';
        break;
      case 'intermediate':
        levelDescription = 'intermediate coding skills';
        break;
      case 'advanced':
        levelDescription = 'advanced programming techniques';
        break;
      case 'expert':
        levelDescription = 'expert-level software engineering';
        break;
    }
    
    const areasDescription = targetAreas && targetAreas.length 
      ? `focusing on ${targetAreas.join(', ')}`
      : 'covering various industry-standard coding practices';
    
    return `Welcome to your Industry Coding Assessment Prep Session! I'll be your tutor for ${levelDescription} ${areasDescription}.

Our sessions will help you prepare for technical assessments with an emphasis on:
• Algorithmic efficiency
• Code quality and best practices
• Edge case handling
• Problem-solving approaches

What area would you like to focus on today?`;
  }
}

// Instantiate the agent to start listening for messages
new SessionAgent(); 