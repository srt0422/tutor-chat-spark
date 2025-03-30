
import React, { useEffect, useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlayIcon, DownloadIcon, SaveIcon } from 'lucide-react';
import { toast } from "sonner";
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';

interface CodeEditorProps {
  initialCode: string;
  onChange: (code: string) => void;
  onRun: () => void;
  language: string;
  darkMode?: boolean;
}

// Pre-import CodeMirror to speed up initialization
let CodeMirrorLib: any = null;

// Preload CodeMirror once for the entire application
const preloadCodeMirror = async () => {
  if (!CodeMirrorLib) {
    try {
      CodeMirrorLib = await import('codemirror');
      // Load common addons that all languages will use
      await import('codemirror/addon/edit/closebrackets');
      await import('codemirror/addon/edit/matchbrackets');
    } catch (error) {
      console.error('Failed to preload CodeMirror:', error);
    }
  }
  return CodeMirrorLib;
};

// Start preloading immediately
preloadCodeMirror();

// Function to load language mode based on language
const loadLanguageMode = async (language: string) => {
  if (!CodeMirrorLib) return;
  
  try {
    if (language === 'javascript' || language === 'typescript') {
      await import('codemirror/mode/javascript/javascript');
    } else if (language === 'python') {
      await import('codemirror/mode/python/python');
    } else if (language === 'java') {
      await import('codemirror/mode/clike/clike');
    }
  } catch (error) {
    console.error(`Failed to load language mode for ${language}:`, error);
  }
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode,
  onChange,
  onRun,
  language,
  darkMode = false,
}) => {
  const [code, setCode] = useState(initialCode);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const editorRef = useRef<any>(null);
  const editorInstanceRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorInitialized, setEditorInitialized] = useState(false);

  // Update code when initialCode changes
  useEffect(() => {
    if (editorInstanceRef.current && initialCode !== code) {
      editorInstanceRef.current.setValue(initialCode);
      setCode(initialCode);
    }
  }, [initialCode]);

  // Initialize editor when component mounts
  useEffect(() => {
    if (editorInitialized) return;
    
    const initializeEditor = async () => {
      try {
        // Wait for CodeMirror to be loaded
        const CodeMirror = await preloadCodeMirror();
        if (!CodeMirror) {
          console.error('CodeMirror failed to load');
          return;
        }
        
        // Load the specific language mode
        await loadLanguageMode(language);
        
        const textArea = editorRef.current;
        if (textArea && !editorInstanceRef.current) {
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
          
          editorInstanceRef.current = editorInstance;
          setEditorLoaded(true);
          setEditorInitialized(true);
          
          // Ensure editor is properly sized
          setTimeout(() => {
            if (editorInstanceRef.current) {
              editorInstanceRef.current.refresh();
            }
          }, 0);
        }
      } catch (error) {
        console.error('Failed to initialize CodeMirror:', error);
        toast.error('Failed to load code editor. Please refresh the page.');
      }
    };
    
    initializeEditor();
    
    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.toTextArea();
        editorInstanceRef.current = null;
      }
    };
  }, []);

  // Update editor theme when darkMode changes
  useEffect(() => {
    if (editorInstanceRef.current && darkMode !== undefined) {
      editorInstanceRef.current.setOption('theme', darkMode ? 'material' : 'eclipse');
    }
  }, [darkMode]);

  // Update editor mode when language changes
  useEffect(() => {
    if (!editorInstanceRef.current) return;
    
    const updateLanguage = async () => {
      await loadLanguageMode(language);
      
      editorInstanceRef.current.setOption('mode', 
        language === 'typescript' ? 'text/typescript' : 
        language === 'javascript' ? 'text/javascript' : 
        language === 'python' ? 'text/x-python' :
        language === 'java' ? 'text/x-java' : 'text/plain'
      );
    };
    
    updateLanguage();
  }, [language]);

  // Handle tab changes and ensure editor visibility
  useEffect(() => {
    // When switching back to the editor tab, ensure the editor is properly sized and visible
    if (activeTab === "editor" && editorInstanceRef.current) {
      // Use a short delay to ensure the DOM has updated
      setTimeout(() => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.refresh();
          editorInstanceRef.current.focus();
        }
      }, 50);
    }
  }, [activeTab]);

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
              <textarea ref={editorRef} className="hidden" />
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
