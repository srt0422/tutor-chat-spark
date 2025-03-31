import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeEvaluation } from '@/agents/types';
import { CheckCircle, AlertTriangle, XCircle, Code, Clock, BarChart2, FileCode, ScrollText } from 'lucide-react';

interface FeedbackPanelProps {
  evaluation: CodeEvaluation | null;
  code: string;
  language: string;
  isLoading: boolean;
  onRequestImprovement: () => Promise<void>;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  evaluation,
  code,
  language,
  isLoading,
  onRequestImprovement
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSuggestionCode, setShowSuggestionCode] = useState(false);

  if (!evaluation) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Code Evaluation
          </CardTitle>
          <CardDescription>
            Submit your solution to receive detailed feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <FileCode className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No evaluation available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Submit your solution to receive detailed feedback on correctness, efficiency, and code quality.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const averageCodeQuality = Math.round(
    (evaluation.codeQuality.readability + 
     evaluation.codeQuality.maintainability + 
     evaluation.codeQuality.bestPractices) / 3
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Solution Evaluation
            </CardTitle>
            <CardDescription>
              Detailed analysis of your code solution
            </CardDescription>
          </div>
          <Badge 
            className={`text-md px-3 py-1 ${getScoreBackground(evaluation.overallScore)} ${getScoreColor(evaluation.overallScore)}`}
          >
            {evaluation.overallScore}%
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="details" className="flex-1">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="suggestions" className="flex-1">Suggestions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Alert className="mb-4">
              <AlertTitle className="flex items-center gap-2">
                {getScoreIcon(evaluation.overallScore)}
                {evaluation.overallScore >= 80 ? 'Great job!' : 
                 evaluation.overallScore >= 60 ? 'Good effort!' : 
                 'Needs improvement'}
              </AlertTitle>
              <AlertDescription>
                {evaluation.feedback}
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <h3 className="text-sm font-medium">Correctness</h3>
                    <span className={`text-sm ${getScoreColor(evaluation.correctness)}`}>
                      {evaluation.correctness}%
                    </span>
                  </div>
                  <Progress value={evaluation.correctness} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <h3 className="text-sm font-medium">Time Complexity</h3>
                    <span className={`text-sm ${getScoreColor(evaluation.timeComplexity.score)}`}>
                      {evaluation.timeComplexity.score}%
                    </span>
                  </div>
                  <Progress value={evaluation.timeComplexity.score} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Actual: {evaluation.timeComplexity.actual}</span>
                    <span>Expected: {evaluation.timeComplexity.expected}</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <h3 className="text-sm font-medium">Space Complexity</h3>
                    <span className={`text-sm ${getScoreColor(evaluation.spaceComplexity.score)}`}>
                      {evaluation.spaceComplexity.score}%
                    </span>
                  </div>
                  <Progress value={evaluation.spaceComplexity.score} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Actual: {evaluation.spaceComplexity.actual}</span>
                    <span>Expected: {evaluation.spaceComplexity.expected}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <h3 className="text-sm font-medium">Edge Cases</h3>
                    <span className={`text-sm ${getScoreColor(evaluation.edgeCases.score)}`}>
                      {evaluation.edgeCases.score}%
                    </span>
                  </div>
                  <Progress value={evaluation.edgeCases.score} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <h3 className="text-sm font-medium">Code Quality</h3>
                    <span className={`text-sm ${getScoreColor(averageCodeQuality)}`}>
                      {averageCodeQuality}%
                    </span>
                  </div>
                  <Progress value={averageCodeQuality} className="h-2" />
                </div>
                
                <div className="pt-2">
                  <h3 className="text-sm font-medium mb-2">Top Improvement Areas:</h3>
                  <ul className="space-y-1">
                    {evaluation.suggestions.slice(0, 2).map((suggestion, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          {suggestion.length > 100 ? suggestion.substring(0, 100) + '...' : suggestion}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Correctness Analysis
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Your solution scored {evaluation.correctness}% on correctness, which means 
                  {evaluation.correctness >= 90 ? ' it correctly handles almost all test cases.' : 
                   evaluation.correctness >= 70 ? ' it handles most test cases correctly, but there might be some edge cases it misses.' : 
                   ' it has some significant correctness issues.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Complexity Analysis
                </h3>
                <div className="space-y-2">
                  <div className="p-3 rounded bg-muted">
                    <p className="text-sm">
                      <strong>Time Complexity:</strong> {evaluation.timeComplexity.actual} (Expected: {evaluation.timeComplexity.expected})
                      <br />
                      <strong>Space Complexity:</strong> {evaluation.spaceComplexity.actual} (Expected: {evaluation.spaceComplexity.expected})
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {evaluation.timeComplexity.score >= 90 ? 'Your algorithm is optimally efficient.' : 
                     evaluation.timeComplexity.score >= 70 ? 'Your algorithm has good efficiency, but there might be room for optimization.' : 
                     'Your algorithm could be significantly optimized for better efficiency.'}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Edge Case Handling
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Covered Edge Cases</h4>
                    {evaluation.edgeCases.covered.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {evaluation.edgeCases.covered.map((edgeCase, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{edgeCase}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No edge cases were explicitly handled.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Missed Edge Cases</h4>
                    {evaluation.edgeCases.missed.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {evaluation.edgeCases.missed.map((edgeCase, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <XCircle className="h-3 w-3 text-red-500" />
                            <span>{edgeCase}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">All expected edge cases were handled. Great job!</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2 flex items-center gap-2">
                  <Code className="h-4 w-4 text-indigo-500" />
                  Code Quality Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <h4 className="text-sm font-medium">Readability</h4>
                      <span className={`text-sm ${getScoreColor(evaluation.codeQuality.readability)}`}>
                        {evaluation.codeQuality.readability}%
                      </span>
                    </div>
                    <Progress value={evaluation.codeQuality.readability} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <h4 className="text-sm font-medium">Maintainability</h4>
                      <span className={`text-sm ${getScoreColor(evaluation.codeQuality.maintainability)}`}>
                        {evaluation.codeQuality.maintainability}%
                      </span>
                    </div>
                    <Progress value={evaluation.codeQuality.maintainability} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <h4 className="text-sm font-medium">Best Practices</h4>
                      <span className={`text-sm ${getScoreColor(evaluation.codeQuality.bestPractices)}`}>
                        {evaluation.codeQuality.bestPractices}%
                      </span>
                    </div>
                    <Progress value={evaluation.codeQuality.bestPractices} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="suggestions">
            <div className="space-y-4">
              {evaluation.suggestions.length > 0 ? (
                evaluation.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <p className="text-sm mb-2">{suggestion}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-green-500/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No suggestions needed!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your solution is well-optimized and follows best practices.
                  </p>
                </div>
              )}
              
              {evaluation.suggestions.length > 0 && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSuggestionCode(!showSuggestionCode)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <ScrollText className="h-4 w-4" />
                    {showSuggestionCode ? 'Hide Example Implementation' : 'Show Example Implementation'}
                  </Button>
                  
                  {showSuggestionCode && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Example Optimized Solution:</h4>
                      <pre className="text-xs overflow-auto p-2 bg-background rounded">
                        {/* This would typically be generated based on the problem and user solution */}
                        {language === 'javascript' ? 
`// Optimized solution example
function solution(input) {
  // Use a hash map for O(1) lookups
  const map = new Map();
  
  // Process the input in a single pass
  for (let i = 0; i < input.length; i++) {
    // Add proper edge case handling
    if (input[i] === null || input[i] === undefined) continue;
    
    // Store in map for efficient lookup
    map.set(input[i], i);
  }
  
  // Process results efficiently
  return map.size > 0 ? Array.from(map.keys()) : [];
}` : 
`# Optimized solution example
def solution(input):
    # Use a dictionary for O(1) lookups
    mapping = {}
    
    # Process the input in a single pass
    for i, val in enumerate(input):
        # Add proper edge case handling
        if val is None:
            continue
        
        # Store in dict for efficient lookup
        mapping[val] = i
    
    # Process results efficiently
    return list(mapping.keys()) if mapping else []`}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button
          variant="outline"
          disabled={isLoading}
          onClick={onRequestImprovement}
        >
          {isLoading ? 'Generating Improvements...' : 'Get Detailed Improvement Suggestions'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FeedbackPanel; 