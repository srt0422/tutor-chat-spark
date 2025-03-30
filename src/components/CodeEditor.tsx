
import React, { useEffect, useState, useRef } from 'react';
import CodeMirror from 'codemirror';

// Import required CodeMirror styles
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/theme/eclipse.css';

// Import CodeMirror addons
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';

// Import CodeMirror language modes
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';

interface CodeEditorProps {
  initialCode: string;
  onChange: (code: string) => void;
  language: string;
  darkMode?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode,
  onChange,
  language,
  darkMode = false,
}) => {
  const [editorLoaded, setEditorLoaded] = useState(false);
  const editorRef = useRef<any>(null);
  const editorInstanceRef = useRef<any>(null);
  const [editorInitialized, setEditorInitialized] = useState(false);

  // Initialize editor when component mounts
  useEffect(() => {
    if (editorInitialized) return;
    
    const initializeEditor = () => {
      try {
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

  // Update editor when initialCode changes
  useEffect(() => {
    if (editorInstanceRef.current && editorInitialized) {
      editorInstanceRef.current.setValue(initialCode);
    }
  }, [initialCode]);

  // Update editor theme when darkMode changes
  useEffect(() => {
    if (editorInstanceRef.current && darkMode !== undefined) {
      editorInstanceRef.current.setOption('theme', darkMode ? 'material' : 'eclipse');
    }
  }, [darkMode]);

  // Update editor mode when language changes
  useEffect(() => {
    if (!editorInstanceRef.current) return;
    
    editorInstanceRef.current.setOption('mode', 
      language === 'typescript' ? 'text/typescript' : 
      language === 'javascript' ? 'text/javascript' : 
      language === 'python' ? 'text/x-python' :
      language === 'java' ? 'text/x-java' : 'text/plain'
    );
  }, [language]);

  // Refresh editor on mount and after DOM updates
  useEffect(() => {
    if (editorInstanceRef.current) {
      setTimeout(() => {
        editorInstanceRef.current.refresh();
        editorInstanceRef.current.focus();
      }, 100);
    }
  }, []);

  return (
    <div className="h-full">
      <textarea ref={editorRef} className="hidden" />
      {!editorLoaded && (
        <div className="p-4 text-muted-foreground">Loading editor...</div>
      )}
    </div>
  );
};

export default CodeEditor;
