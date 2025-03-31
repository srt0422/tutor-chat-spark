import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import WebIDE from '@/components/WebIDE';
import HintPanel from '@/components/HintPanel';
import FeedbackPanel from '@/components/FeedbackPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useAgents from '@/hooks/useAgents';
import { CodingProblem, CodeEvaluation, Hint } from '@/agents/types';
import { BookOpen, Code, HelpCircle, BarChart2 } from 'lucide-react';

const PracticeProblem = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const [userId] = useState<string>(() => localStorage.getItem('userId') || uuidv4());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [code, setCode] = useState<string>('// Your code here');
  const [language, setLanguage] = useState<string>('javascript');
  const [activeTab, setActiveTab] = useState<string>('problem');
  const [isEvaluationLoading, setIsEvaluationLoading] = useState<boolean>(false);
  const [isHintLoading, setIsHintLoading] = useState<boolean>(false);
  
  // Initialize the agent hook
  const {
    isLoading: agentLoading,
    error: agentError,
    sessionId: agentSessionId,
    currentProblem,
    evaluation,
    hints,
    initSession,
    requestProblem,
    evaluateCode,
    requestHint,
    generateStudyPlan
  } = useAgents();

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      // Store userId in localStorage for persistence
      localStorage.setItem('userId', userId);
      
      // Initialize a session with the agent system
      const sid = await initSession(
        userId, 
        'intermediate', 
        ['algorithms', 'data-structures']
      );
      
      if (sid) {
        setSessionId(sid);
        
        // If we have a problemId from the URL, load that problem
        if (problemId) {
          await loadSpecificProblem(sid, problemId);
        } else {
          // Otherwise load a problem based on user level
          await loadRandomProblem(sid);
        }
      } else {
        toast.error('Failed to initialize session');
      }
    };
    
    initializeSession();
  }, [userId, problemId, initSession]);

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
    }
  }, [currentProblem, language]);

  // Load a specific problem by ID
  const loadSpecificProblem = async (sid: string, id: string) => {
    try {
      // In a real implementation, we would have an API to fetch a problem by ID
      // For now, we'll simulate this by getting a random problem and pretending it's the one we want
      await requestProblem(userId, sid);
      
      // In a real system, we'd verify the problem ID matches what was requested
      toast.success('Problem loaded successfully');
    } catch (error) {
      console.error('Error loading problem:', error);
      toast.error('Failed to load the requested problem');
    }
  };

  // Load a random problem
  const loadRandomProblem = async (sid: string) => {
    try {
      await requestProblem(userId, sid);
      toast.success('Problem loaded successfully');
    } catch (error) {
      console.error('Error loading problem:', error);
      toast.error('Failed to load a problem');
    }
  };

  // Handle code changes
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  // Handle language changes
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    
    // If there's a current problem, regenerate starter code in the new language
    if (currentProblem) {
      setCode(generateStarterCode(currentProblem, newLanguage));
    }
  };

  // Handle running code
  const handleRunCode = () => {
    toast.info('Code execution simulated in this environment.');
  };

  // Handle code submission for evaluation
  const handleSubmitCode = async () => {
    if (!sessionId || !currentProblem) {
      toast.error('No active problem to evaluate.');
      return;
    }
    
    setIsEvaluationLoading(true);
    
    try {
      await evaluateCode(
        code,
        language,
        currentProblem.id,
        userId,
        sessionId
      );
      
      toast.success('Code evaluated!');
      // Automatically switch to the feedback tab
      setActiveTab('feedback');
    } catch (error) {
      console.error('Error evaluating code:', error);
      toast.error('Failed to evaluate code');
    } finally {
      setIsEvaluationLoading(false);
    }
  };

  // Handle requesting a hint
  const handleRequestHint = async (difficultyLevel: number) => {
    if (!sessionId || !currentProblem) {
      toast.error('No active problem.');
      return null;
    }
    
    setIsHintLoading(true);
    
    try {
      const hint = await requestHint(
        code,
        language,
        currentProblem.id,
        userId,
        sessionId,
        difficultyLevel
      );
      
      toast.success('Hint provided!');
      return hint;
    } catch (error) {
      console.error('Error requesting hint:', error);
      toast.error('Failed to get hint');
      return null;
    } finally {
      setIsHintLoading(false);
    }
  };

  // Handle requesting detailed improvements
  const handleRequestImprovements = async () => {
    if (!sessionId || !currentProblem || !evaluation) {
      toast.error('No evaluation available.');
      return;
    }
    
    setIsEvaluationLoading(true);
    
    try {
      // This would call a more detailed improvement suggestion API
      // For now, we'll reuse the evaluateCode function
      await evaluateCode(
        code,
        language,
        currentProblem.id,
        userId,
        sessionId
      );
      
      toast.success('Improvement suggestions generated!');
    } catch (error) {
      console.error('Error generating improvements:', error);
      toast.error('Failed to generate improvements');
    } finally {
      setIsEvaluationLoading(false);
    }
  };

  // Generate starter code based on problem
  const generateStarterCode = (problem: CodingProblem, lang: string): string => {
    if (lang === 'javascript') {
      return `/**
 * ${problem.title}
 *
 * ${problem.description}
 *
 * @example
 * Input: ${problem.examples[0]?.input || 'N/A'}
 * Output: ${problem.examples[0]?.output || 'N/A'}
 */

function solution(input) {
  // Your code here
  
  return result;
}`;
    } else if (lang === 'python') {
      return `'''
${problem.title}

${problem.description}

Example:
Input: ${problem.examples[0]?.input || 'N/A'}
Output: ${problem.examples[0]?.output || 'N/A'}
'''

def solution(input):
    # Your code here
    
    return result`;
    }
    
    return '// Your code here';
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {currentProblem ? currentProblem.title : 'Loading Problem...'}
            </h1>
            {currentProblem && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Difficulty: {currentProblem.difficulty}</span>
                <span>•</span>
                <span>Category: {currentProblem.category.join(', ')}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
            <Button
              onClick={handleSubmitCode}
              disabled={!currentProblem || isEvaluationLoading}
            >
              {isEvaluationLoading ? 'Evaluating...' : 'Submit Solution'}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="problem" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Problem
                </TabsTrigger>
                <TabsTrigger value="solution" className="flex items-center gap-2">
                  <Code className="h-4 w-4" /> Your Solution
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" /> Feedback
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="problem">
                {currentProblem ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="prose dark:prose-invert max-w-none">
                        <p>{currentProblem.description}</p>
                        
                        <h3>Input Format</h3>
                        <p>{currentProblem.inputFormat}</p>
                        
                        <h3>Output Format</h3>
                        <p>{currentProblem.outputFormat}</p>
                        
                        <h3>Constraints</h3>
                        <ul>
                          {currentProblem.constraints.map((constraint, i) => (
                            <li key={i}>{constraint}</li>
                          ))}
                        </ul>
                        
                        <h3>Examples</h3>
                        {currentProblem.examples.map((example, i) => (
                          <div key={i} className="mb-4">
                            <p><strong>Example {i+1}:</strong></p>
                            <div className="bg-secondary/40 p-3 rounded mb-2">
                              <p><strong>Input:</strong> {example.input}</p>
                              <p><strong>Output:</strong> {example.output}</p>
                              {example.explanation && (
                                <p><strong>Explanation:</strong> {example.explanation}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="p-8 text-center">
                    <div className="animate-pulse">
                      <h3 className="text-xl font-semibold mb-2">Loading problem...</h3>
                      <p className="text-muted-foreground">Please wait while we prepare your problem.</p>
                    </div>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="solution">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Solution</CardTitle>
                    <CardDescription>
                      Write and test your solution before submitting
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WebIDE 
                      initialCode={code}
                      onChange={handleCodeChange}
                      onRun={handleRunCode}
                      language={language}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="feedback">
                <FeedbackPanel 
                  evaluation={evaluation}
                  code={code}
                  language={language}
                  isLoading={isEvaluationLoading}
                  onRequestImprovement={handleRequestImprovements}
                />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="lg:col-span-1">
            <HintPanel
              code={code}
              language={language}
              problemId={currentProblem?.id || ''}
              userId={userId}
              sessionId={sessionId || ''}
              onRequestHint={handleRequestHint}
              hints={hints}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PracticeProblem; 