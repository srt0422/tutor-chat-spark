
import React, { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlayIcon, DownloadIcon, SaveIcon } from 'lucide-react';
import { toast } from "sonner";
import CodeEditor from './CodeEditor';

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
  const [code, setCode] = useState(initialCode);
  const [activeTab, setActiveTab] = useState("editor");
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    onChange(newCode);
  };

  const handleRun = () => {
    onRun();
    toast.success('Code executed!');
  };

  const handleSave = () => {
    // This would typically save to a database or local storage
    toast.success('Code saved successfully!');
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language === 'typescript' ? 'ts' : 
                          language === 'javascript' ? 'js' : 
                          language === 'python' ? 'py' : 
                          language === 'java' ? 'java' : 'txt'}`;
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
          <TabsContent value="editor" className="p-0 m-0">
            <div ref={editorContainerRef} className="relative h-[calc(100vh-240px)]">
              {activeTab === "editor" && (
                <CodeEditor 
                  initialCode={initialCode}
                  onChange={handleCodeChange}
                  language={language}
                  darkMode={darkMode}
                />
              )}
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
