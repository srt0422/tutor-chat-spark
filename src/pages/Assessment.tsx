import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import WebIDE from '@/components/WebIDE';
import Timer from '@/components/Timer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import useAgents from '@/hooks/useAgents';
import { CodingProblem, CodeEvaluation } from '@/agents/types';
import { AlertTriangle, CheckCircle, Clock, Code, ListChecks } from 'lucide-react';

// Assessment duration in minutes
const ASSESSMENT_DURATION = 60;

// Assessment difficulty levels
const difficultyDistribution = {
  easy: 2,
  medium: 2,
  hard: 1
};

const Assessment = () => {
  const navigate = useNavigate();
  const [userId] = useState<string>(() => localStorage.getItem('userId') || uuidv4());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);
  const [userSolutions, setUserSolutions] = useState<Record<string, { code: string, language: string, evaluation: CodeEvaluation | null }>>({});
  const [code, setCode] = useState<string>('// Your code here');
  const [language, setLanguage] = useState<string>('javascript');
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(ASSESSMENT_DURATION * 60);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [showConfirmEndDialog, setShowConfirmEndDialog] = useState<boolean>(false);
  
  // Initialize the agent hook
  const {
    isLoading: agentLoading,
    error: agentError,
    sessionId: agentSessionId,
    initSession,
    requestProblem,
    evaluateCode
  } = useAgents();

  // Initialize assessment session
  useEffect(() => {
    const initializeAssessment = async () => {
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
        await loadProblems(sid);
        toast.success('Assessment environment ready');
      } else {
        toast.error('Failed to initialize assessment');
      }
    };
    
    initializeAssessment();
  }, [userId, initSession]);

  // Start timer when problems are loaded
  useEffect(() => {
    if (problems.length > 0 && !startTime) {
      startAssessment();
    }
  }, [problems]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerActive && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, ASSESSMENT_DURATION * 60 - elapsed);
        setTimeLeft(remaining);
        
        // Auto-submit when time runs out
        if (remaining <= 0) {
          handleEndAssessment();
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, startTime]);

  // Show errors from agent system
  useEffect(() => {
    if (agentError) {
      toast.error(agentError);
    }
  }, [agentError]);

  // Load the set of problems for this assessment
  const loadProblems = async (sid: string) => {
    const assessmentProblems: CodingProblem[] = [];
    
    // Load easy problems
    for (let i = 0; i < difficultyDistribution.easy; i++) {
      const problem = await requestProblem(userId, sid, 'easy');
      if (problem) assessmentProblems.push(problem);
    }
    
    // Load medium problems
    for (let i = 0; i < difficultyDistribution.medium; i++) {
      const problem = await requestProblem(userId, sid, 'medium');
      if (problem) assessmentProblems.push(problem);
    }
    
    // Load hard problems
    for (let i = 0; i < difficultyDistribution.hard; i++) {
      const problem = await requestProblem(userId, sid, 'hard');
      if (problem) assessmentProblems.push(problem);
    }
    
    setProblems(assessmentProblems);
    
    // Initialize the user solutions object
    const initialSolutions: Record<string, { code: string, language: string, evaluation: CodeEvaluation | null }> = {};
    assessmentProblems.forEach(problem => {
      initialSolutions[problem.id] = {
        code: generateStarterCode(problem, language),
        language,
        evaluation: null
      };
    });
    setUserSolutions(initialSolutions);
    
    // Set code for the first problem
    if (assessmentProblems.length > 0) {
      setCode(generateStarterCode(assessmentProblems[0], language));
    }
  };

  // Start the assessment and timer
  const startAssessment = () => {
    setStartTime(Date.now());
    setTimerActive(true);
    toast.success('Assessment started! You have 60 minutes to complete it.');
  };

  // Handle code changes
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    
    // Update the solution for the current problem
    if (problems[currentProblemIndex]) {
      const problemId = problems[currentProblemIndex].id;
      setUserSolutions(prev => ({
        ...prev,
        [problemId]: {
          ...prev[problemId],
          code: newCode,
          language
        }
      }));
    }
  };

  // Handle language changes
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    
    // Update the language for the current problem
    if (problems[currentProblemIndex]) {
      const problemId = problems[currentProblemIndex].id;
      setUserSolutions(prev => ({
        ...prev,
        [problemId]: {
          ...prev[problemId],
          language: newLanguage
        }
      }));
    }
  };

  // Handle running code
  const handleRunCode = () => {
    toast.info('Code execution simulated in this environment.');
  };

  // Navigate to different problems
  const handleProblemChange = (index: number) => {
    if (index >= 0 && index < problems.length) {
      setCurrentProblemIndex(index);
      
      // Load the saved code for this problem
      const problemId = problems[index].id;
      if (userSolutions[problemId]) {
        setCode(userSolutions[problemId].code);
        setLanguage(userSolutions[problemId].language);
      } else {
        setCode(generateStarterCode(problems[index], language));
      }
    }
  };

  // Submit the current problem
  const handleSubmitProblem = async () => {
    if (!sessionId || currentProblemIndex >= problems.length) return;
    
    const problem = problems[currentProblemIndex];
    toast.loading('Evaluating your solution...');
    
    try {
      const result = await evaluateCode(
        code,
        language,
        problem.id,
        userId,
        sessionId
      );
      
      if (result) {
        toast.success('Solution evaluated!');
        
        // Save the evaluation
        setUserSolutions(prev => ({
          ...prev,
          [problem.id]: {
            ...prev[problem.id],
            evaluation: result.evaluation
          }
        }));
        
        // Automatically move to the next problem if available
        if (currentProblemIndex < problems.length - 1) {
          handleProblemChange(currentProblemIndex + 1);
        } else {
          // All problems have been attempted
          toast.success('All problems completed! You can review and modify your solutions until time expires.');
        }
      } else {
        toast.error('Failed to evaluate solution');
      }
    } catch (error) {
      console.error('Error evaluating solution:', error);
      toast.error('Failed to evaluate solution');
    }
  };

  // End the assessment
  const handleEndAssessment = async () => {
    setTimerActive(false);
    
    // Evaluate any unevaluated solutions
    const pendingEvaluations = problems.filter(p => !userSolutions[p.id].evaluation);
    
    if (pendingEvaluations.length > 0 && sessionId) {
      toast.loading(`Evaluating ${pendingEvaluations.length} remaining solutions...`);
      
      for (const problem of pendingEvaluations) {
        try {
          const solution = userSolutions[problem.id];
          const result = await evaluateCode(
            solution.code,
            solution.language,
            problem.id,
            userId,
            sessionId
          );
          
          if (result) {
            setUserSolutions(prev => ({
              ...prev,
              [problem.id]: {
                ...prev[problem.id],
                evaluation: result.evaluation
              }
            }));
          }
        } catch (error) {
          console.error('Error evaluating solution:', error);
        }
      }
    }
    
    setIsComplete(true);
    setShowResults(true);
    toast.success('Assessment completed!');
  };

  // Format remaining time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate overall score
  const calculateOverallScore = () => {
    let totalScore = 0;
    let count = 0;
    
    Object.values(userSolutions).forEach(solution => {
      if (solution.evaluation) {
        totalScore += solution.evaluation.overallScore;
        count++;
      }
    });
    
    return count > 0 ? Math.round(totalScore / count) : 0;
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
            <h1 className="text-3xl font-bold">Coding Assessment</h1>
            <p className="text-muted-foreground">Complete {problems.length} problems in {ASSESSMENT_DURATION} minutes</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="text-lg font-medium">{formatTime(timeLeft)}</span>
            </div>
            {!isComplete && (
              <Button 
                variant="destructive" 
                onClick={() => setShowConfirmEndDialog(true)}
              >
                End Assessment
              </Button>
            )}
          </div>
        </div>
        
        {problems.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Problems</CardTitle>
                  <CardDescription>
                    {userSolutions && Object.values(userSolutions).filter(s => s.evaluation).length}/{problems.length} completed
                  </CardDescription>
                  <Progress 
                    value={(Object.values(userSolutions).filter(s => s.evaluation).length / problems.length) * 100} 
                    className="h-2" 
                  />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {problems.map((problem, index) => {
                      const isCompleted = userSolutions[problem.id]?.evaluation !== null;
                      const score = userSolutions[problem.id]?.evaluation?.overallScore;
                      
                      return (
                        <Button
                          key={problem.id}
                          variant={currentProblemIndex === index ? "default" : "outline"}
                          className="justify-start"
                          onClick={() => handleProblemChange(index)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate">
                              {index + 1}. {problem.title}
                            </span>
                            {isCompleted && (
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                score && score >= 80 ? "bg-green-100 text-green-800" :
                                score && score >= 50 ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }`}>
                                {score}%
                              </span>
                            )}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-3">
              {problems[currentProblemIndex] && (
                <>
                  <Card className="mb-4">
                    <CardHeader>
                      <CardTitle>{problems[currentProblemIndex].title}</CardTitle>
                      <CardDescription>
                        Difficulty: {problems[currentProblemIndex].difficulty} | 
                        Category: {problems[currentProblemIndex].category.join(', ')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>{problems[currentProblemIndex].description}</p>
                        
                        <h3>Input Format</h3>
                        <p>{problems[currentProblemIndex].inputFormat}</p>
                        
                        <h3>Output Format</h3>
                        <p>{problems[currentProblemIndex].outputFormat}</p>
                        
                        <h3>Constraints</h3>
                        <ul>
                          {problems[currentProblemIndex].constraints.map((constraint, i) => (
                            <li key={i}>{constraint}</li>
                          ))}
                        </ul>
                        
                        <h3>Examples</h3>
                        {problems[currentProblemIndex].examples.map((example, i) => (
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
                        
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Expected Time Complexity: {problems[currentProblemIndex].timeComplexity}</span>
                          <Code className="h-4 w-4 ml-4" />
                          <span>Expected Space Complexity: {problems[currentProblemIndex].spaceComplexity}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <WebIDE 
                    initialCode={code}
                    onChange={handleCodeChange}
                    onRun={handleRunCode}
                    language={language}
                  />
                  
                  <div className="mt-4 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => handleProblemChange(currentProblemIndex - 1)}
                      disabled={currentProblemIndex === 0}
                    >
                      Previous Problem
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={handleSubmitProblem}
                        disabled={isComplete}
                      >
                        Submit Solution
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleProblemChange(currentProblemIndex + 1)}
                        disabled={currentProblemIndex === problems.length - 1}
                      >
                        Next Problem
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="animate-pulse">
              <h3 className="text-xl font-semibold mb-2">Loading assessment problems...</h3>
              <p className="text-muted-foreground">Please wait while we prepare your assessment.</p>
            </div>
          </Card>
        )}
      </div>
      
      {/* Assessment Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Assessment Results</DialogTitle>
            <DialogDescription>
              Your assessment has been completed. Here are your results.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
                <div className="text-5xl font-bold">{calculateOverallScore()}%</div>
              </div>
              <h3 className="text-xl font-semibold">Overall Score</h3>
            </div>
            
            <Tabs defaultValue="summary">
              <TabsList className="w-full">
                <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
                <TabsTrigger value="problems" className="flex-1">Problem Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-center text-lg">Problems Solved</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-4xl font-bold">
                        {Object.values(userSolutions).filter(s => 
                          s.evaluation && s.evaluation.correctness >= 70
                        ).length}/{problems.length}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-center text-lg">Avg Time Complexity</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl font-bold">
                        {Object.values(userSolutions)
                          .filter(s => s.evaluation)
                          .map(s => s.evaluation?.timeComplexity.score || 0)
                          .reduce((sum, score, _, array) => sum + score / array.length, 0)
                          .toFixed(0)}%
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-center text-lg">Avg Code Quality</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl font-bold">
                        {Object.values(userSolutions)
                          .filter(s => s.evaluation)
                          .map(s => {
                            const quality = s.evaluation?.codeQuality;
                            return quality ? 
                              (quality.readability + quality.maintainability + quality.bestPractices) / 3 : 0;
                          })
                          .reduce((sum, score, _, array) => sum + score / array.length, 0)
                          .toFixed(0)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Key Areas for Improvement</h3>
                  <ul className="space-y-2">
                    {Object.values(userSolutions)
                      .filter(s => s.evaluation)
                      .flatMap(s => s.evaluation?.suggestions || [])
                      .slice(0, 3)
                      .map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                  </ul>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Strengths</h3>
                  <ul className="space-y-2">
                    {(() => {
                      const strengths = [];
                      const evaluations = Object.values(userSolutions).filter(s => s.evaluation);
                      
                      // Check for time complexity strength
                      if (evaluations.filter(s => 
                        s.evaluation && s.evaluation.timeComplexity.score >= 80
                      ).length >= evaluations.length / 2) {
                        strengths.push('Good understanding of algorithm efficiency');
                      }
                      
                      // Check for space complexity strength
                      if (evaluations.filter(s => 
                        s.evaluation && s.evaluation.spaceComplexity.score >= 80
                      ).length >= evaluations.length / 2) {
                        strengths.push('Efficient memory usage');
                      }
                      
                      // Check for edge cases strength
                      if (evaluations.filter(s => 
                        s.evaluation && s.evaluation.edgeCases.score >= 80
                      ).length >= evaluations.length / 2) {
                        strengths.push('Thorough edge case handling');
                      }
                      
                      // Check for code quality strength
                      if (evaluations.filter(s => {
                        const quality = s.evaluation?.codeQuality;
                        return quality && 
                          (quality.readability + quality.maintainability + quality.bestPractices) / 3 >= 80;
                      }).length >= evaluations.length / 2) {
                        strengths.push('High code quality and readability');
                      }
                      
                      return strengths.length > 0 ? strengths : ['Keep practicing to identify your strengths'];
                    })().map((strength, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="problems" className="pt-4">
                <div className="space-y-4">
                  {problems.map((problem, index) => {
                    const solution = userSolutions[problem.id];
                    const evaluation = solution?.evaluation;
                    
                    return (
                      <Card key={problem.id} className="overflow-hidden">
                        <CardHeader className="pb-2 border-b">
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle>{index + 1}. {problem.title}</CardTitle>
                              <CardDescription>
                                Difficulty: {problem.difficulty} | 
                                Category: {problem.category.join(', ')}
                              </CardDescription>
                            </div>
                            {evaluation ? (
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                evaluation.overallScore >= 80 ? "bg-green-100 text-green-800" :
                                evaluation.overallScore >= 50 ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }`}>
                                {evaluation.overallScore}%
                              </div>
                            ) : (
                              <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                Not Submitted
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        
                        {evaluation && (
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="text-sm font-medium mb-1">Correctness</h4>
                                <Progress value={evaluation.correctness} className="h-2" />
                                <span className="text-xs text-muted-foreground">{evaluation.correctness}%</span>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-1">Time Complexity</h4>
                                <Progress value={evaluation.timeComplexity.score} className="h-2" />
                                <span className="text-xs text-muted-foreground">
                                  {evaluation.timeComplexity.actual} (Expected: {evaluation.timeComplexity.expected})
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-sm">
                              <p className="font-medium mb-2">Feedback:</p>
                              <p>{evaluation.feedback}</p>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button onClick={() => navigate('/')}>Return to Home</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm End Assessment Dialog */}
      <Dialog open={showConfirmEndDialog} onOpenChange={setShowConfirmEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Assessment?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this assessment? All your current solutions will be submitted for evaluation.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmEndDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setShowConfirmEndDialog(false);
                handleEndAssessment();
              }}
            >
              End Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Assessment; 