import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ChevronRight, Code, ArrowRight } from 'lucide-react';
import { Hint } from '@/agents/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

interface HintPanelProps {
  code: string;
  language: string;
  problemId: string;
  userId: string;
  sessionId: string;
  onRequestHint: (difficultyLevel: number) => Promise<Hint | null>;
  hints: Hint[];
}

const HintPanel: React.FC<HintPanelProps> = ({
  code,
  language,
  problemId,
  userId,
  sessionId,
  onRequestHint,
  hints
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hintDifficulty, setHintDifficulty] = useState(1); // 1-5 scale
  const [showCodeHint, setShowCodeHint] = useState<Record<string, boolean>>({});

  const handleHintRequest = async () => {
    setIsLoading(true);
    try {
      await onRequestHint(hintDifficulty);
    } catch (error) {
      console.error('Error requesting hint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCodeHint = (hintId: string) => {
    setShowCodeHint(prev => ({
      ...prev,
      [hintId]: !prev[hintId]
    }));
  };

  const getHintLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Subtle';
      case 2: return 'Guiding';
      case 3: return 'Specific';
      case 4: return 'Detailed';
      case 5: return 'Solution-oriented';
      default: return 'Custom';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Hints & Assistance
            </CardTitle>
            <CardDescription>
              Get progressive hints to help you solve the problem
            </CardDescription>
          </div>
          <Badge variant="outline">
            {hints.length} hint{hints.length !== 1 ? 's' : ''} provided
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {hints.length > 0 ? (
          <Tabs defaultValue="hints">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="hints" className="flex-1">Provided Hints</TabsTrigger>
              <TabsTrigger value="request" className="flex-1">Request New Hint</TabsTrigger>
            </TabsList>
            
            <TabsContent value="hints">
              <div className="space-y-4">
                {hints.map((hint, index) => (
                  <div 
                    key={hint.id}
                    className="border rounded-lg p-4 transition-all hover:border-primary"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="mb-2">
                        Level {hint.level}: {getHintLevelLabel(hint.level)}
                      </Badge>
                      {hint.relatedConcept && (
                        <Badge variant="secondary">
                          {hint.relatedConcept}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="mb-3">{hint.text}</p>
                    
                    {hint.codeSnippet && (
                      <div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => toggleCodeHint(hint.id)}
                          className="flex items-center gap-2"
                        >
                          <Code className="h-4 w-4" />
                          {showCodeHint[hint.id] ? 'Hide Code Example' : 'Show Code Example'}
                        </Button>
                        
                        {showCodeHint[hint.id] && (
                          <div className="mt-2 p-3 bg-muted rounded font-mono text-sm overflow-x-auto">
                            <pre>{hint.codeSnippet}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="request">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Hint Explicitness Level</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Slider
                        value={[hintDifficulty]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={(values) => setHintDifficulty(values[0])}
                      />
                    </div>
                    <div className="w-32 text-center">
                      <Badge>
                        Level {hintDifficulty}: {getHintLevelLabel(hintDifficulty)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-1">What to expect:</h4>
                  {hintDifficulty === 1 && (
                    <p className="text-sm text-muted-foreground">A gentle nudge in the right direction without giving away the solution.</p>
                  )}
                  {hintDifficulty === 2 && (
                    <p className="text-sm text-muted-foreground">A more specific hint about the approach or algorithm to consider.</p>
                  )}
                  {hintDifficulty === 3 && (
                    <p className="text-sm text-muted-foreground">Direct guidance with relevant concepts and possible code patterns.</p>
                  )}
                  {hintDifficulty === 4 && (
                    <p className="text-sm text-muted-foreground">Detailed explanation with pseudocode or partial implementation.</p>
                  )}
                  {hintDifficulty === 5 && (
                    <p className="text-sm text-muted-foreground">Step-by-step guidance with specific code examples close to the solution.</p>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Requesting more explicit hints may impact your learning experience. Try to solve with minimal assistance when possible.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-6">
            <Lightbulb className="h-12 w-12 text-yellow-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Need some help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Request a hint to get unstuck. Hints are adaptive and become more detailed as needed.
            </p>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Hint Explicitness Level</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Slider
                      value={[hintDifficulty]}
                      min={1}
                      max={5}
                      step={1}
                      onValueChange={(values) => setHintDifficulty(values[0])}
                    />
                  </div>
                  <div className="w-32 text-center">
                    <Badge>
                      Level {hintDifficulty}: {getHintLevelLabel(hintDifficulty)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleHintRequest}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? 'Generating hint...' : hints.length === 0 ? 'Get First Hint' : 'Request Next Hint'}
          {!isLoading && <ChevronRight className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HintPanel; 