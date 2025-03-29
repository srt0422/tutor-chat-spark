
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, RefreshCw, Code2 } from 'lucide-react';
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onRequestCodeHelp,
  isLoading
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <img src="/lovable-uploads/160ce008-4076-4510-88bd-a21f3249d913.png" alt="CodeSignal Logo" />
          </Avatar>
          <h2 className="text-lg font-semibold">Industry Coding Tutor</h2>
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
