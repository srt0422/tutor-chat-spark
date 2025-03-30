
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, RefreshCw, Code2, BookOpen } from 'lucide-react';
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { codingTopics } from '@/services/tutorService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onRequestCodeHelp: () => void;
  onStartTutoring?: (topic: string, level: number, mode: 'guided' | 'unguided') => void;
  isLoading: boolean;
  currentTutorSession?: {
    topic: string;
    level: number;
    mode: 'guided' | 'unguided';
  } | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onRequestCodeHelp,
  onStartTutoring,
  isLoading,
  currentTutorSession = null
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('arrays');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedMode, setSelectedMode] = useState<'guided' | 'unguided'>('guided');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle starting a new tutoring session
  const handleStartTutoring = () => {
    if (onStartTutoring) {
      onStartTutoring(selectedTopic, selectedLevel, selectedMode);
    }
  };

  // Format message content to render markdown and code blocks
  const formatMessage = (content: string) => {
    // Replace code blocks
    const formattedContent = content.replace(
      /```([\s\S]*?)```/g,
      (_, code) => `<pre><code>${code.trim()}</code></pre>`
    );

    // Replace inline code
    return formattedContent.replace(
      /`([^`]+)`/g,
      (_, code) => `<code>${code}</code>`
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary/10 px-4 py-2 border-b">
        <div className="flex items-center justify-between">
          {/* Tutoring Session Controls */}
          {currentTutorSession && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">
                {codingTopics.find(t => t.id === currentTutorSession.topic)?.name || 'Tutoring'} 
                • Level {currentTutorSession.level} 
                • {currentTutorSession.mode === 'guided' ? 'Guided' : 'Unguided'}
              </span>
            </div>
          )}
          
          {/* Tutoring Dialog Trigger */}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                New Tutoring Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a New Tutoring Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="topic" className="text-sm font-medium">Select Topic</label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {codingTopics.map(topic => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="level" className="text-sm font-medium">Select Level</label>
                  <Tabs defaultValue="1" onValueChange={(value) => setSelectedLevel(parseInt(value))}>
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="1">Level 1</TabsTrigger>
                      <TabsTrigger value="2">Level 2</TabsTrigger>
                      <TabsTrigger value="3">Level 3</TabsTrigger>
                      <TabsTrigger value="4">Level 4</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="mode" className="text-sm font-medium">Tutoring Mode</label>
                  <Tabs defaultValue="guided" onValueChange={(value) => setSelectedMode(value as 'guided' | 'unguided')}>
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="guided">Guided</TabsTrigger>
                      <TabsTrigger value="unguided">Unguided</TabsTrigger>
                    </TabsList>
                    <TabsContent value="guided" className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        Guided mode provides step-by-step instructions and waits for your 
                        implementation at each step.
                      </p>
                    </TabsContent>
                    <TabsContent value="unguided" className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        Unguided mode presents the problem and lets you work independently.
                        Help is available when requested.
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <Button onClick={handleStartTutoring} className="w-full">
                  Start Tutoring Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`chat-message ${
                message.role === 'user' ? 'user-message' : 'assistant-message'
              }`}
            >
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: formatMessage(message.content) 
                }} 
              />
            </div>
          ))}
          {isLoading && (
            <div className="chat-message assistant-message">
              <div className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="border-t p-3">
        <div className="flex items-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button" 
                size="icon" 
                variant="outline"
                onClick={onRequestCodeHelp}
              >
                <Code2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Get code examples
            </TooltipContent>
          </Tooltip>
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about coding skills..."
            className="min-h-[80px] flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!inputValue.trim() || isLoading}
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
