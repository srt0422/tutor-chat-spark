
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlayIcon, DownloadIcon, SaveIcon } from 'lucide-react';
import { toast } from "sonner";

interface CodeEditorProps {
  initialCode: string;
  onChange: (code: string) => void;
  onRun: () => void;
  language: string;
  darkMode?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode,
  onChange,
  onRun,
  language,
  darkMode = false,
}) => {
  const [code, setCode] = useState(initialCode);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    // Dynamically import CodeMirror components
    const loadEditor = async () => {
      try {
        const CodeMirror = await import('codemirror');
        
        // Import mode based on language
        if (language === 'javascript' || language === 'typescript') {
          await import('codemirror/mode/javascript/javascript');
        } else if (language === 'python') {
          await import('codemirror/mode/python/python');
        } else if (language === 'java') {
          await import('codemirror/mode/clike/clike');
        }
        
        // Import themes
        await import('codemirror/theme/material.css');
        await import('codemirror/theme/eclipse.css');
        await import('codemirror/addon/edit/closebrackets');
        await import('codemirror/addon/edit/matchbrackets');
        await import('codemirror/addon/hint/show-hint');
        await import('codemirror/addon/hint/javascript-hint');
        await import('codemirror/lib/codemirror.css');
        
        const textArea = document.getElementById('code-editor') as HTMLTextAreaElement;
        if (textArea) {
          const editorInstance = CodeMirror.fromTextArea(textArea, {
            mode: language === 'typescript' ? 'text/typescript' : 
                  language === 'javascript' ? 'text/javascript' : 
                  language === 'python' ? 'text/x-python' :
                  language === 'java' ? 'text/x-java' : 'text/plain',
            theme: darkMode ? 'material' : 'eclipse',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            lineWrapping: true,
            autofocus: true,
          });
          
          editorInstance.setValue(initialCode);
          editorInstance.on('change', (instance: any) => {
            const newCode = instance.getValue();
            setCode(newCode);
            onChange(newCode);
          });
          
          setEditor(editorInstance);
          setEditorLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load CodeMirror:', error);
        toast.error('Failed to load code editor. Please refresh the page.');
      }
    };
    
    loadEditor();
    
    return () => {
      if (editor) {
        editor.toTextArea();
      }
    };
  }, [initialCode, onChange, language, darkMode]);

  useEffect(() => {
    if (editor && darkMode !== undefined) {
      editor.setOption('theme', darkMode ? 'material' : 'eclipse');
    }
  }, [darkMode, editor]);

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

  return (
    <div className="flex flex-col h-full border rounded-md shadow-sm">
      <div className="border-b bg-secondary/40 p-2">
        <Tabs defaultValue="editor">
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
            <div className="relative overflow-hidden h-[calc(100vh-240px)]">
              <textarea id="code-editor" className="hidden" />
              {!editorLoaded && (
                <div className="p-4 text-muted-foreground">Loading editor...</div>
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

export default CodeEditor;
