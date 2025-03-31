import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlayIcon, DownloadIcon, SaveIcon } from 'lucide-react';
import { toast } from "sonner";
import CodeEditor from './CodeEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WebIDEProps {
  initialCode: string;
  onChange: (code: string) => void;
  onRun: () => void;
  language: string;
  darkMode?: boolean;
}

const WebIDE: React.FC<WebIDEProps> = ({
  initialCode,
  onChange,
  onRun,
  language,
  darkMode = false,
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);
  const [activeTab, setActiveTab] = useState("editor");

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    onChange(newCode);
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    
    let convertedCode = code;
    
    if (language === 'javascript' && value === 'python') {
      convertedCode = convertJsToPython(code);
    } 
    else if (language === 'python' && value === 'javascript') {
      convertedCode = convertPythonToJs(code);
    }
    else if (language === 'javascript' && value === 'go') {
      convertedCode = convertJsToGo(code);
    }
    else if (language === 'python' && value === 'go') {
      convertedCode = convertPythonToGo(code);
    }
    else if (language === 'go' && value === 'javascript') {
      convertedCode = convertGoToJs(code);
    }
    else if (language === 'go' && value === 'python') {
      convertedCode = convertGoToPython(code);
    }
    
    setCode(convertedCode);
    onChange(convertedCode);
  };

  const convertJsToPython = (jsCode: string): string => {
    let pythonCode = jsCode;
    
    pythonCode = pythonCode.replace(/console\.log\((.*?)\);/g, 'print($1)');
    
    pythonCode = pythonCode.replace(/function\s+(\w+)\s*\((.*?)\)\s*\{/g, 'def $1($2):');
    
    pythonCode = pythonCode.replace(/(var|let|const)\s+/g, '');
    
    pythonCode = pythonCode.replace(/\}/g, '');
    
    pythonCode = pythonCode.replace(/null/g, 'None');
    
    pythonCode = pythonCode.replace(/true/g, 'True');
    pythonCode = pythonCode.replace(/false/g, 'False');
    
    pythonCode = pythonCode.replace(/===/g, '==');
    
    return pythonCode;
  };

  const convertPythonToJs = (pythonCode: string): string => {
    let jsCode = pythonCode;
    
    jsCode = jsCode.replace(/print\((.*?)\)/g, 'console.log($1);');
    
    jsCode = jsCode.replace(/def\s+(\w+)\s*\((.*?)\):/g, 'function $1($2) {');
    
    jsCode = jsCode.replace(/\n(\s+)/g, (match, p1) => {
      return `\n${p1}`;
    });
    
    jsCode = jsCode.replace(/None/g, 'null');
    
    jsCode = jsCode.replace(/True/g, 'true');
    jsCode = jsCode.replace(/False/g, 'false');
    
    jsCode = jsCode + '\n}';
    
    return jsCode;
  };

  const convertJsToGo = (jsCode: string): string => {
    let goCode = 'package main\n\nimport (\n\t"fmt"\n)\n\n';
    
    // Convert console.log to fmt.Println
    goCode += jsCode.replace(/console\.log\((.*?)\);/g, 'fmt.Println($1)');
    
    // Convert function declaration
    goCode = goCode.replace(/function\s+(\w+)\s*\((.*?)\)\s*\{/g, 'func $1($2) {');
    
    // Convert var/let/const declarations to var
    goCode = goCode.replace(/(var|let|const)\s+(\w+)/g, 'var $2');
    
    // Convert null to nil
    goCode = goCode.replace(/null/g, 'nil');
    
    // Convert boolean values
    goCode = goCode.replace(/true/g, 'true');
    goCode = goCode.replace(/false/g, 'false');
    
    // Add main function if it doesn't exist
    if (!goCode.includes('func main()')) {
      goCode += '\n\nfunc main() {\n\t// Call your solution here\n}';
    }
    
    return goCode;
  };

  const convertPythonToGo = (pythonCode: string): string => {
    let goCode = 'package main\n\nimport (\n\t"fmt"\n)\n\n';
    
    // Convert print to fmt.Println
    goCode += pythonCode.replace(/print\((.*?)\)/g, 'fmt.Println($1)');
    
    // Convert function declaration
    goCode = goCode.replace(/def\s+(\w+)\s*\((.*?)\):/g, 'func $1($2) {');
    
    // Convert None to nil
    goCode = goCode.replace(/None/g, 'nil');
    
    // Convert boolean values
    goCode = goCode.replace(/True/g, 'true');
    goCode = goCode.replace(/False/g, 'false');
    
    // Add closing braces for functions
    goCode += '\n}';
    
    // Add main function if it doesn't exist
    if (!goCode.includes('func main()')) {
      goCode += '\n\nfunc main() {\n\t// Call your solution here\n}';
    }
    
    return goCode;
  };

  const convertGoToJs = (goCode: string): string => {
    let jsCode = goCode;
    
    // Remove package and import statements
    jsCode = jsCode.replace(/package main\s*/, '');
    jsCode = jsCode.replace(/import\s*\(\s*.*?\s*\)\s*/s, '');
    
    // Convert fmt.Println to console.log
    jsCode = jsCode.replace(/fmt\.Println\((.*?)\)/g, 'console.log($1);');
    
    // Convert function declaration
    jsCode = jsCode.replace(/func\s+(\w+)\s*\((.*?)\)\s*{/g, 'function $1($2) {');
    
    // Remove main function
    jsCode = jsCode.replace(/func\s+main\s*\(\s*\)\s*{[\s\S]*?}/g, '');
    
    // Convert nil to null
    jsCode = jsCode.replace(/nil/g, 'null');
    
    return jsCode;
  };

  const convertGoToPython = (goCode: string): string => {
    let pythonCode = '';
    
    // Remove package and import statements
    goCode = goCode.replace(/package main\s*/, '');
    goCode = goCode.replace(/import\s*\(\s*.*?\s*\)\s*/s, '');
    
    // Convert fmt.Println to print
    pythonCode = goCode.replace(/fmt\.Println\((.*?)\)/g, 'print($1)');
    
    // Convert function declaration
    pythonCode = pythonCode.replace(/func\s+(\w+)\s*\((.*?)\)\s*{/g, 'def $1($2):');
    
    // Remove closing braces
    pythonCode = pythonCode.replace(/\}/g, '');
    
    // Remove main function
    pythonCode = pythonCode.replace(/func\s+main\s*\(\s*\)\s*{[\s\S]*?}/g, '');
    
    // Convert nil to None
    pythonCode = pythonCode.replace(/nil/g, 'None');
    
    // Convert boolean values
    pythonCode = pythonCode.replace(/true/g, 'True');
    pythonCode = pythonCode.replace(/false/g, 'False');
    
    return pythonCode;
  };

  const handleRun = () => {
    onRun();
    toast.success('Code executed!');
  };

  const handleSave = () => {
    toast.success('Code saved successfully!');
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${selectedLanguage === 'typescript' ? 'ts' : 
                          selectedLanguage === 'javascript' ? 'js' : 
                          selectedLanguage === 'python' ? 'py' : 
                          selectedLanguage === 'go' ? 'go' :
                          selectedLanguage === 'java' ? 'java' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="flex flex-col h-full border rounded-md shadow-sm">
      <div className="border-b bg-secondary/40 p-2">
        <Tabs defaultValue="editor" value={activeTab} onValueChange={handleTabChange}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="output">Output</TabsTrigger>
            </TabsList>
            <div className="flex space-x-2">
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleRun}>
                <PlayIcon className="h-4 w-4 mr-1" />
                Run
              </Button>
              <Button variant="outline" size="sm" onClick={handleSave}>
                <SaveIcon className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <DownloadIcon className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
          <TabsContent value="editor" className="p-0 m-0 h-[calc(100vh-240px)]">
            <div className="h-full w-full">
              <CodeEditor 
                initialCode={code}
                onChange={handleCodeChange}
                language={selectedLanguage}
                darkMode={darkMode}
              />
            </div>
          </TabsContent>
          <TabsContent value="output" className="mt-0">
            <div className="bg-black text-green-400 p-4 font-mono h-[calc(100vh-240px)] overflow-auto">
              <p>// Output will appear here when you run your code</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WebIDE;
