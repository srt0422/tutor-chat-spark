
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ChatInterface, { Message } from '@/components/ChatInterface';
import CodeEditor from '@/components/CodeEditor';
import LevelSelector from '@/components/LevelSelector';
import FrameworkInfo from '@/components/FrameworkInfo';
import { Card } from '@/components/ui/card';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { getAIResponse } from '@/services/aiService';
import { codingLevels, codeExamples } from '@/services/mockData';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { PanelRightOpen, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [showInfo, setShowInfo] = useState<boolean>(true);

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
      // Prepare messages for AI service
      const messagesForAI = messages
        .slice(-6) // Only use the last 6 messages for context
        .map((msg) => ({ role: msg.role, content: msg.content }));
      
      messagesForAI.push({ role: 'user', content: message });
      
      // Get AI response
      const response = await getAIResponse(messagesForAI);
      
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
    toast.info(`Switched to ${codingLevels.find(l => l.id === levelId)?.name}`);
  };

  const toggleInfoPanel = () => {
    setShowInfo(!showInfo);
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
              isLoading={isLoading}
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Code Editor Panel */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full flex flex-col">
            <LevelSelector 
              levels={codingLevels}
              selectedLevel={selectedLevel}
              onLevelChange={handleLevelChange}
            />
            <div className="flex-1 relative">
              <CodeEditor 
                initialCode={code} 
                onChange={handleCodeChange} 
                onRun={handleRunCode}
                language={language}
              />
              
              <div className="absolute top-3 right-3 z-10">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={toggleInfoPanel}
                >
                  {showInfo ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                </Button>
              </div>
              
              {showInfo && (
                <div className="absolute top-12 right-3 w-72 z-10">
                  <FrameworkInfo />
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Layout>
  );
};

export default Index;
