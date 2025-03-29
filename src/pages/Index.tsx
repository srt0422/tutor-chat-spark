
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ChatInterface, { Message } from '@/components/ChatInterface';
import CodeEditor from '@/components/CodeEditor';
import LevelSelector from '@/components/LevelSelector';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { getAIResponse } from '@/services/aiService';
import { sendTutorMessage, createTutorSession, codingTopics } from '@/services/tutorService';
import { codingLevels, codeExamples } from '@/services/mockData';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import Timer from '@/components/Timer';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: 'Welcome to the Industry Coding Tutor! I\'m here to help you learn and practice coding skills based on the Industry Coding Skills Evaluation Framework. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('level-1');
  const [code, setCode] = useState<string>(codeExamples['level-1-js']?.code || '// Your code here');
  const [language, setLanguage] = useState<string>('javascript');
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [tutorSession, setTutorSession] = useState<{
    topic: string;
    level: number;
    mode: 'guided' | 'unguided';
  } | null>(null);

  const handleSendMessage = async (message: string) => {
    // Add user message to chat
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      let response;
      
      // If we're in a tutoring session, use the tutor service
      if (tutorSession) {
        // Prepare messages for tutor service
        const messagesForTutor = messages
          .slice(-6) // Only use the last 6 messages for context
          .map((msg) => ({ role: msg.role, content: msg.content }));
        
        messagesForTutor.push({ role: 'user', content: message });
        
        // Get tutor response
        response = await sendTutorMessage(
          messagesForTutor,
          tutorSession.topic,
          tutorSession.level,
          tutorSession.mode
        );
      } else {
        // Use regular AI service if not in tutoring mode
        const messagesForAI = messages
          .slice(-6) // Only use the last 6 messages for context
          .map((msg) => ({ role: msg.role, content: msg.content }));
        
        messagesForAI.push({ role: 'user', content: message });
        
        // Get AI response
        response = await getAIResponse(messagesForAI);
      }
      
      // Add AI response to chat
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCodeHelp = () => {
    const levelId = selectedLevel;
    const exampleKey = `${levelId}-${language}`;
    
    if (codeExamples[exampleKey]) {
      const example = codeExamples[exampleKey];
      setCode(example.code);
      
      // Add assistant message explaining the code
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `Here's a ${language} example for ${codingLevels.find(l => l.id === levelId)?.name}:\n\n\`\`\`${language}\n${example.code}\n\`\`\`\n\n${example.explanation}`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      toast.success('Code example loaded!');
    } else {
      toast.error(`No example available for ${levelId} in ${language}`);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleRunCode = () => {
    try {
      // For safety, we're not actually executing the code
      // In a real implementation, you might use a sandboxed environment
      console.log('Code execution requested:', code);
      toast.success('Code execution simulated!');
    } catch (error) {
      console.error('Error running code:', error);
      toast.error('Error running code');
    }
  };

  const handleLevelChange = (levelId: string) => {
    setSelectedLevel(levelId);
    
    // Reset and start timer when level changes
    setTimerActive(true);
    setTimerStartTime(Date.now());
    
    // Find the selected level info
    const level = codingLevels.find(l => l.id === levelId);
    
    // Add assistant message with time expectations
    if (level) {
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `You've selected ${level.name}. This level typically takes ${level.timeEstimate} to complete. I'll guide you through each step. The timer has started - let me know if you need any assistance!`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    }
    
    toast.info(`Switched to ${codingLevels.find(l => l.id === levelId)?.name}`);
  };

  const handleTimerToggle = () => {
    setTimerActive(prev => !prev);
    
    if (!timerActive) {
      // Starting the timer
      setTimerStartTime(Date.now());
      toast.info('Timer started');
    } else {
      // Stopping the timer
      toast.info('Timer paused');
    }
  };

  const handleStartTutoring = (topic: string, level: number, mode: 'guided' | 'unguided') => {
    // Create a new tutoring session
    setTutorSession({
      topic,
      level,
      mode
    });
    
    // Get the session data
    const session = createTutorSession(topic, level, mode);
    
    // Reset messages and add the initial tutor message
    setMessages([
      {
        id: uuidv4(),
        role: 'assistant',
        content: session.messageHistory[0].content,
        timestamp: new Date(),
      }
    ]);
    
    // Map level to the appropriate format for the code editor
    const levelMapping: Record<number, string> = {
      1: 'level-1',
      2: 'level-2',
      3: 'level-3',
      4: 'level-4'
    };
    
    // Update selected level in the editor
    setSelectedLevel(levelMapping[level] || 'level-1');
    
    // Reset timer
    setTimerActive(true);
    setTimerStartTime(Date.now());
    
    const topicName = codingTopics.find(t => t.id === topic)?.name || topic;
    toast.success(`Started ${mode} tutoring session for ${topicName} (Level ${level})`);
  };

  return (
    <Layout>
      <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-128px)]">
        {/* Chat Panel */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full flex flex-col">
            <ChatInterface 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              onRequestCodeHelp={handleRequestCodeHelp}
              onStartTutoring={handleStartTutoring}
              isLoading={isLoading}
              currentTutorSession={tutorSession}
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Code Editor Panel */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <LevelSelector 
                levels={codingLevels}
                selectedLevel={selectedLevel}
                onLevelChange={handleLevelChange}
              />
              <Timer 
                active={timerActive} 
                startTime={timerStartTime} 
                onToggle={handleTimerToggle} 
              />
            </div>
            <div className="flex-1 relative">
              <CodeEditor 
                initialCode={code} 
                onChange={handleCodeChange} 
                onRun={handleRunCode}
                language={language}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Layout>
  );
};

export default Index;
