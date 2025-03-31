import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ChatInterface, { Message } from '@/components/ChatInterface';
import WebIDE from '@/components/WebIDE';
import LevelSelector from '@/components/LevelSelector';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { codingLevels, codeExamples } from '@/services/mockData';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import Timer from '@/components/Timer';
import useAgents from '@/hooks/useAgents';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CodingProblem } from '@/agents/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Map difficulty levels between the agents and UI
const mapDifficultyToLevel = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return 'level-1';
    case 'medium': return 'level-2';
    case 'hard': return 'level-3';
    case 'expert': return 'level-4';
    default: return 'level-1';
  }
};

const mapLevelToDifficulty = (level: string): string => {
  switch (level) {
    case 'level-1': return 'easy';
    case 'level-2': return 'medium';
    case 'level-3': return 'hard';
    case 'level-4': return 'expert';
    default: return 'easy';
  }
};

const Index = () => {
  // State
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
  const [userId] = useState<string>(() => localStorage.getItem('userId') || uuidv4());
  const [showStudyPlan, setShowStudyPlan] = useState<boolean>(false);
  
  // Initialize the agent hook
  const {
    isLoading: agentLoading,
    error: agentError,
    sessionId,
    currentProblem,
    evaluation,
    hints,
    studyPlan,
    sessionHistory,
    initSession,
    requestProblem,
    evaluateCode,
    requestHint,
    generateStudyPlan,
    fetchHistory
  } = useAgents();

  const navigate = useNavigate();

  // Initialize the agent system
  useEffect(() => {
    const initializeAgentSession = async () => {
      // Don't initialize if we already have a session
      if (sessionId) return;
      
      setIsLoading(true);
      // Store userId in localStorage for persistence
      localStorage.setItem('userId', userId);
      
      const sessionId = await initSession(
        userId, 
        'intermediate', 
        ['algorithms', 'data-structures']
      );
      
      if (sessionId) {
        toast.success('Connected to AI tutoring system');
      } else {
        toast.error('Failed to connect to AI tutoring system');
      }
      
      setIsLoading(false);
    };
    
    initializeAgentSession();
  }, [userId, initSession, sessionId]);

  // Show errors from agent system
  useEffect(() => {
    if (agentError) {
      toast.error(agentError);
    }
  }, [agentError]);

  // Update code when problem changes
  useEffect(() => {
    if (currentProblem) {
      // Generate starter code based on the problem
      const starterCode = generateStarterCode(currentProblem, language);
      setCode(starterCode);
      
      // Update the level selector based on problem difficulty
      setSelectedLevel(mapDifficultyToLevel(currentProblem.difficulty));
    }
  }, [currentProblem, language]);

  // Handle sending a message to the tutor
  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Check for special commands
      if (message.toLowerCase().includes('hint') || message.toLowerCase().includes('help')) {
        await handleRequestHint();
      } else if (message.toLowerCase().includes('evaluate') || message.toLowerCase().includes('check my code')) {
        await handleEvaluateCode();
      } else if (message.toLowerCase().includes('new problem') || message.toLowerCase().includes('another problem')) {
        await handleRequestProblem();
      } else if (message.toLowerCase().includes('study plan') || message.toLowerCase().includes('improvement plan')) {
        await handleGenerateStudyPlan();
      } else if (message.toLowerCase().includes('history') || message.toLowerCase().includes('previous sessions')) {
        await handleFetchHistory();
      } else {
        // General message - AI will respond based on context
        
        // In a real implementation, we would send this to a natural language processor
        // For now, provide a generic response
        setTimeout(() => {
          const aiMessage: Message = {
            id: uuidv4(),
            role: 'assistant',
            content: generateGenericResponse(message),
            timestamp: new Date(),
          };
          
          setMessages((prev) => [...prev, aiMessage]);
          setIsLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process your request. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle requesting a new problem
  const handleRequestProblem = async () => {
    if (!sessionId) {
      toast.error('Session not initialized. Please try refreshing the page.');
      setIsLoading(false);
      return;
    }
    
    try {
      const difficulty = mapLevelToDifficulty(selectedLevel);
      const problem = await requestProblem(userId, sessionId, difficulty);
      
      if (problem) {
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: formatProblemMessage(problem),
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        toast.success('New problem loaded!');
      } else {
        toast.error('Failed to load a problem. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting problem:', error);
      toast.error('Failed to request a problem. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle code evaluation
  const handleEvaluateCode = async () => {
    if (!sessionId || !currentProblem) {
      toast.error('No active problem to evaluate. Please request a problem first.');
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await evaluateCode(
        code,
        language,
        currentProblem.id,
        userId,
        sessionId
      );
      
      if (result) {
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: formatEvaluationMessage(result),
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        toast.success('Code evaluated!');
      } else {
        toast.error('Failed to evaluate code. Please try again.');
      }
    } catch (error) {
      console.error('Error evaluating code:', error);
      toast.error('Failed to evaluate code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle requesting a hint
  const handleRequestHint = async () => {
    if (!sessionId || !currentProblem) {
      toast.error('No active problem. Please request a problem first.');
      setIsLoading(false);
      return;
    }
    
    try {
      const hint = await requestHint(
        code,
        language,
        currentProblem.id,
        userId,
        sessionId,
        Math.min(hints.length + 1, 5)
      );
      
      if (hint) {
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: formatHintMessage(hint),
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        toast.success('Hint provided!');
      } else {
        toast.error('Failed to generate a hint. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting hint:', error);
      toast.error('Failed to request a hint. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle generating a study plan
  const handleGenerateStudyPlan = async () => {
    if (!sessionId) {
      toast.error('Session not initialized. Please try refreshing the page.');
      setIsLoading(false);
      return;
    }
    
    try {
      const plan = await generateStudyPlan(userId);
      
      if (plan) {
        setShowStudyPlan(true);
        
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: 'I\'ve generated a personalized study plan for you based on your performance. You can view it in the Study Plan tab.',
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        toast.success('Study plan generated!');
      } else {
        toast.error('Failed to generate a study plan. Please try again.');
      }
    } catch (error) {
      console.error('Error generating study plan:', error);
      toast.error('Failed to generate a study plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle fetching history
  const handleFetchHistory = async () => {
    if (!sessionId) {
      toast.error('Session not initialized. Please try refreshing the page.');
      setIsLoading(false);
      return;
    }
    
    try {
      const history = await fetchHistory(userId);
      
      if (history && history.length > 0) {
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: formatHistoryMessage(history),
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        toast.success('Session history retrieved!');
      } else {
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: 'You don\'t have any previous session history yet. Keep practicing to build up your history!',
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        toast.info('No session history found');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to fetch session history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle code changes
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  // Handle running code
  const handleRunCode = () => {
    try {
      console.log('Code execution requested:', code);
      toast.success('Code execution simulated!');
      
      // In a real implementation, we would actually run the code
      // For now, we'll just simulate it
      
      // After running, automatically evaluate the code
      handleEvaluateCode();
    } catch (error) {
      console.error('Error running code:', error);
      toast.error('Error running code');
    }
  };

  // Handle level changes
  const handleLevelChange = (levelId: string) => {
    setSelectedLevel(levelId);
    
    if (!timerActive) {
      setTimerActive(true);
      setTimerStartTime(Date.now());
    }
    
    const level = codingLevels.find(l => l.id === levelId);
    
    if (level) {
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `You've selected ${level.name}. This level typically takes ${level.timeEstimate} to complete. Would you like me to give you a problem at this level?`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    }
    
    toast.info(`Switched to ${codingLevels.find(l => l.id === levelId)?.name}`);
  };

  // Handle timer toggle
  const handleTimerToggle = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setTimerActive(prev => !prev);
    
    if (!timerActive) {
      setTimerStartTime(Date.now());
      toast.info('Timer started');
    } else {
      toast.info('Timer paused');
    }
  };

  // Helper function to format a problem message
  const formatProblemMessage = (problem: CodingProblem): string => {
    return `
# ${problem.title}

${problem.description}

## Input Format
${problem.inputFormat}

## Output Format
${problem.outputFormat}

## Constraints
${problem.constraints.map(c => `- ${c}`).join('\n')}

## Examples
${problem.examples.map((example, index) => `
### Example ${index + 1}
Input: ${example.input}
Output: ${example.output}
${example.explanation ? `Explanation: ${example.explanation}` : ''}
`).join('\n')}

## Expected Complexity
- Time Complexity: ${problem.timeComplexity}
- Space Complexity: ${problem.spaceComplexity}

I've loaded a starter template for you in the code editor. Let me know if you need any hints!
`;
  };

  // Helper function to format an evaluation message
  const formatEvaluationMessage = (evaluation: any): string => {
    return `
# Code Evaluation

${evaluation.feedback}

## Detailed Scores
- Correctness: ${evaluation.correctness}/100
- Time Complexity: ${evaluation.timeComplexity.score}/100 (${evaluation.timeComplexity.actual} vs expected ${evaluation.timeComplexity.expected})
- Space Complexity: ${evaluation.spaceComplexity.score}/100 (${evaluation.spaceComplexity.actual} vs expected ${evaluation.spaceComplexity.expected})
- Edge Case Handling: ${evaluation.edgeCases.score}/100
- Code Quality: ${Math.round((evaluation.codeQuality.readability + evaluation.codeQuality.maintainability + evaluation.codeQuality.bestPractices) / 3)}/100

## Suggestions for Improvement
${evaluation.suggestions.map(s => `- ${s}`).join('\n')}

Would you like more detailed feedback on any specific aspect?
`;
  };

  // Helper function to format a hint message
  const formatHintMessage = (hint: any): string => {
    return `
# Hint (Level ${hint.level}/5)

${hint.text}

${hint.codeSnippet ? `\`\`\`${language}\n${hint.codeSnippet}\n\`\`\`` : ''}

Let me know if you need more help or if you'd like me to explain this hint in more detail.
`;
  };

  // Helper function to format a history message
  const formatHistoryMessage = (history: any[]): string => {
    return `
# Your Session History

You've completed ${history.length} tutoring sessions so far.

## Recent Sessions
${history.slice(0, 3).map((session, index) => `
### Session ${index + 1} (${new Date(session.startTime).toLocaleDateString()})
- Problems Solved: ${session.problems.length}
- Average Score: ${session.metrics?.averageScore || 'N/A'}
- Time Spent: ${formatTime(session.endTime - session.startTime)}
${session.metrics?.improvementAreas?.length ? `- Areas to Improve: ${session.metrics.improvementAreas.join(', ')}` : ''}
`).join('\n')}

Would you like to see your full history or generate a personalized study plan based on your performance?
`;
  };

  // Helper function to format time
  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return hours > 0 
      ? `${hours}h ${minutes % 60}m` 
      : `${minutes}m ${seconds % 60}s`;
  };

  // Helper function to generate a generic response
  const generateGenericResponse = (userMessage: string): string => {
    if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
      return 'Hello! How can I help you with your coding practice today?';
    }
    
    if (userMessage.toLowerCase().includes('thank')) {
      return 'You\'re welcome! Is there anything else you\'d like to work on?';
    }
    
    if (userMessage.toLowerCase().includes('how do i')) {
      return 'That\'s a good question. To help you better, could you try requesting a specific problem first? Then I can provide more targeted assistance.';
    }
    
    // Default response if no patterns match
    return 'I\'m here to help you practice coding skills. Would you like me to give you a problem to solve, evaluate your code, or provide a hint for your current problem?';
  };

  // Helper function to generate starter code
  const generateStarterCode = (problem: CodingProblem, language: string): string => {
    if (language === 'javascript') {
      return `/**
 * ${problem.title}
 * 
 * ${problem.description.split('\n')[0]}
 */

/**
 * @param {${problem.inputFormat.toLowerCase().includes('array') ? 'Array' : 'any'}} input
 * @return {${problem.outputFormat.toLowerCase().includes('array') ? 'Array' : 'any'}}
 */
function solution(input) {
  // Your code here
  
  return null;
}

// Test cases
const testCases = [
${problem.examples.map(ex => `  { input: ${ex.input}, expected: ${ex.output} }`).join(',\n')}
];

// Run tests
testCases.forEach((test, index) => {
  const result = solution(test.input);
  console.log(\`Test \${index + 1}: \${JSON.stringify(result) === JSON.stringify(test.expected) ? 'PASS' : 'FAIL'}\`);
});`;
    } else if (language === 'python') {
      return `"""
${problem.title}

${problem.description.split('\n')[0]}
"""

def solution(input):
    # Your code here
    
    return None

# Test cases
test_cases = [
${problem.examples.map(ex => `    {"input": ${ex.input}, "expected": ${ex.output}}`).join(',\n')}
]

# Run tests
for i, test in enumerate(test_cases):
    result = solution(test["input"])
    print(f"Test {i + 1}: {'PASS' if result == test['expected'] else 'FAIL'}")`;
    } else {
      // Default to JavaScript if the language is not supported
      return `// Starter code for ${problem.title}\n// ${problem.description.split('\n')[0]}\n\n// Your code here\n`;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Industry Coding Tutor</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Prepare for coding interviews with our AI-powered tutoring system. 
            Practice problems, receive instant feedback, and improve your coding skills.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-2xl">Timed Assessment</CardTitle>
              <CardDescription>
                Take a timed assessment to test your skills under interview conditions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Multiple problems of varying difficulty</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Timed environment similar to real interviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Detailed evaluation of your solutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Performance analysis and improvement suggestions</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" onClick={() => navigate('/assessment')}>
                Start Assessment
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-2xl">Practice Mode</CardTitle>
              <CardDescription>
                Practice individual problems with guidance and unlimited time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Receive hints when you get stuck</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Detailed feedback on your solution</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Learn optimal solution approaches</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Focus on specific problem categories</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" onClick={() => navigate('/practice')}>
                Practice Problems
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-128px)]">
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full flex flex-col">
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                onRequestCodeHelp={handleRequestProblem}
                isLoading={isLoading || agentLoading}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center px-4 py-2 border-b">
                <LevelSelector 
                  levels={codingLevels}
                  selectedLevel={selectedLevel}
                  onLevelChange={handleLevelChange}
                />
                <div className="flex gap-2 items-center">
                  <Dialog open={showStudyPlan} onOpenChange={setShowStudyPlan}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setShowStudyPlan(true)}>
                        Study Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Your Personalized Study Plan</DialogTitle>
                      </DialogHeader>
                      {studyPlan ? (
                        <div className="space-y-4 py-4">
                          <h3 className="text-xl font-semibold">Performance Analysis</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {studyPlan.metrics.map((metric, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <h4 className="font-medium text-lg">{metric.category}</h4>
                                <div className="mt-2 space-y-2">
                                  <div className="flex justify-between">
                                    <span>Overall Score:</span>
                                    <span className="font-medium">{metric.score}/100</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Problems Solved:</span>
                                    <span className="font-medium">{metric.problemsSolved}</span>
                                  </div>
                                  {metric.strengths.length > 0 && (
                                    <div className="mt-2">
                                      <span className="text-sm font-medium text-green-600">Strengths:</span>
                                      <ul className="list-disc pl-5 text-sm">
                                        {metric.strengths.map((strength, idx) => (
                                          <li key={idx}>{strength}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {metric.weaknesses.length > 0 && (
                                    <div className="mt-2">
                                      <span className="text-sm font-medium text-red-600">Areas to Improve:</span>
                                      <ul className="list-disc pl-5 text-sm">
                                        {metric.weaknesses.map((weakness, idx) => (
                                          <li key={idx}>{weakness}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <h3 className="text-xl font-semibold mt-6">Recommended Resources</h3>
                          <div className="space-y-4">
                            {studyPlan.recommendations.map((rec, index) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium text-lg">{rec.category}</h4>
                                  <span className="px-2 py-1 bg-primary/10 rounded-full text-xs">
                                    Priority: {rec.priority}/5
                                  </span>
                                </div>
                                <div className="mt-4 space-y-3">
                                  {rec.resources.map((resource, idx) => (
                                    <div key={idx} className="border-l-2 border-primary pl-3">
                                      <div className="flex items-center">
                                        <span className="text-sm font-medium">{resource.title}</span>
                                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-secondary/20 rounded-full">
                                          {resource.type}
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {resource.description}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <h3 className="text-xl font-semibold mt-6">Milestones</h3>
                          <div className="space-y-3">
                            {studyPlan.milestones.map((milestone, index) => (
                              <div key={index} className="flex items-center space-x-3 border rounded-lg p-4">
                                <div className={`w-4 h-4 rounded-full ${milestone.completed ? 'bg-green-500' : 'bg-orange-500'}`} />
                                <div>
                                  <h4 className="font-medium">{milestone.title}</h4>
                                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                                  <p className="text-xs mt-1">
                                    Target: {new Date(milestone.targetDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <p>No study plan available. Generate one by asking for a study plan in the chat.</p>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Timer 
                    active={timerActive} 
                    startTime={timerStartTime} 
                    onToggle={handleTimerToggle} 
                  />
                </div>
              </div>
              <div className="flex-1">
                <WebIDE 
                  initialCode={code} 
                  onChange={handleCodeChange} 
                  onRun={handleRunCode}
                  language={language}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
};

export default Index;
