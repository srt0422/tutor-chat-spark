
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock, Code2, FileCode, FileText } from 'lucide-react';

const FrameworkInfo: React.FC = () => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-primary" />
          Industry Coding Skills Framework
        </CardTitle>
        <CardDescription>
          A progressive framework for evaluating coding skills through four levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="levels">Level Details</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-sm mb-4">
              The Industry Coding Skills Evaluation Framework is designed to assess coding skills 
              of senior software developers or engineers around the key principles of validity, 
              scalability, and fairness. Each evaluation contains a language-agnostic, project-based 
              task with 4 progressive levels.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center p-0">
                  <Clock className="h-4 w-4" />
                </Badge>
                <div>
                  <h4 className="text-sm font-medium">90 Minute Assessment</h4>
                  <p className="text-xs text-muted-foreground">Maximum allowed completion time</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center p-0">
                  <Code2 className="h-4 w-4" />
                </Badge>
                <div>
                  <h4 className="text-sm font-medium">Progressive Difficulty</h4>
                  <p className="text-xs text-muted-foreground">Tasks increase in complexity level by level</p>
                </div>
              </div>
            </div>
            <p className="text-sm">
              The framework assesses key knowledge areas commonly required for experienced software 
              engineering roles, including software design patterns, code implementation, problem solving, 
              data structures and processing, and maintaining codebase via refactoring and encapsulation.
            </p>
          </TabsContent>
          <TabsContent value="levels">
            <div className="space-y-4">
              <div className="p-3 border rounded-lg bg-secondary/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Level 1: Initial Design & Basic Functions</h3>
                  <Badge className="bg-green-500">Beginner</Badge>
                </div>
                <p className="text-sm mb-2">
                  Implement 3-4 simple methods with basic functionality. Focus on general programming 
                  abilities and use of basic data structures.
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>⏱️ 10-15 minutes</span>
                  <span>📝 15-20 lines of code</span>
                </div>
              </div>
              
              <div className="p-3 border rounded-lg bg-secondary/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Level 2: Data Structures & Data Processing</h3>
                  <Badge className="bg-blue-500">Intermediate</Badge>
                </div>
                <p className="text-sm mb-2">
                  Implement data processing functions with calculations, aggregations, and sorting 
                  while assessing ability to reuse code from Level 1.
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>⏱️ 20-30 minutes</span>
                  <span>📝 40-45 lines of code</span>
                </div>
              </div>
              
              <div className="p-3 border rounded-lg bg-secondary/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Level 3: Refactoring & Encapsulation</h3>
                  <Badge className="bg-purple-500">Advanced</Badge>
                </div>
                <p className="text-sm mb-2">
                  Extend and maintain existing codebase to incorporate additional functionalities 
                  while maintaining backward compatibility.
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>⏱️ 30-60 minutes</span>
                  <span>📝 90-130 lines of code</span>
                </div>
              </div>
              
              <div className="p-3 border rounded-lg bg-secondary/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Level 4: Extending Design & Functionality</h3>
                  <Badge className="bg-red-500">Expert</Badge>
                </div>
                <p className="text-sm mb-2">
                  Finalize the project by implementing functional methods that enhance 
                  functionality and are backward compatible with existing architecture.
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>⏱️ 60+ minutes</span>
                  <span>📝 110-160 lines of code</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FrameworkInfo;
