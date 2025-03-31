import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from 'codemirror';

// Import required CodeMirror styles
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/theme/eclipse.css';

// Import CodeMirror addons
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/javascript-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/selection/active-line';

// Import CodeMirror language modes
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/go/go';

interface CodeEditorProps {
  initialCode: string;
  onChange: (code: string) => void;
  language?: string;
  darkMode?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  initialCode, 
  onChange, 
  language = 'javascript',
  darkMode = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editor = useRef<CodeMirror.Editor | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [currentCode, setCurrentCode] = useState(initialCode);

  // Map language prop to CodeMirror mode
  const getModeForLanguage = (lang: string): string => {
    switch (lang.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'text/javascript';
      case 'python':
      case 'py':
        return 'text/x-python';
      case 'java':
        return 'text/x-java';
      case 'cpp':
      case 'c++':
        return 'text/x-c++src';
      case 'c':
        return 'text/x-csrc';
      case 'go':
        return 'text/x-go';
      default:
        return 'text/javascript';
    }
  };

  // Initialize CodeMirror
  useEffect(() => {
    if (editorRef.current && !editor.current) {
      try {
        // Import language modes dynamically to ensure they're loaded
        require('codemirror/mode/javascript/javascript');
        require('codemirror/mode/python/python');
        require('codemirror/mode/clike/clike');
        require('codemirror/mode/go/go');
        
        // Create the CodeMirror instance with proper configuration
        editor.current = CodeMirror(editorRef.current, {
          value: initialCode || '',
          mode: getModeForLanguage(language),
          theme: darkMode ? 'material' : 'eclipse',
          lineNumbers: true,
          autoCloseBrackets: true,
          matchBrackets: true,
          indentUnit: 2,
          tabSize: 2,
          styleActiveLine: true,
          extraKeys: {
            'Tab': (cm) => {
              cm.replaceSelection('  ');
            },
            'Ctrl-Space': 'autocomplete'
          }
        });

        // Register change handler
        editor.current.on('change', (instance) => {
          const newValue = instance.getValue();
          setCurrentCode(newValue);
          onChange(newValue);
        });
      } catch (err) {
        console.error('Error initializing CodeMirror:', err);
      }
    }

    return () => {
      // Clean up
      if (editor.current) {
        // No explicit destroy method needed
        editor.current = null;
      }
    };
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update content when initialCode prop changes
  useEffect(() => {
    if (editor.current && initialCode !== currentCode) {
      editor.current.setValue(initialCode);
      setCurrentCode(initialCode);
    }
  }, [initialCode, currentCode]);

  // Update mode when language prop changes
  useEffect(() => {
    if (editor.current && language !== currentLanguage) {
      editor.current.setOption('mode', getModeForLanguage(language));
      setCurrentLanguage(language);
    }
  }, [language, currentLanguage]);

  // Update theme when darkMode changes
  useEffect(() => {
    if (editor.current) {
      editor.current.setOption('theme', darkMode ? 'material' : 'eclipse');
    }
  }, [darkMode]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Auto-indent selected code with Tab
      if (e.key === 'Tab' && editor.current && editor.current.somethingSelected()) {
        e.preventDefault();
        editor.current.indentSelection('smart');
      }
      
      // Run code with Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        // We would trigger code execution here if we had that capability
      }
      
      // Comment/uncomment with Ctrl+/ or Cmd+/
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        if (editor.current) {
          editor.current.toggleComment();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="w-full h-full">
      <div ref={editorRef} className="w-full h-full" />
    </div>
  );
};

export default CodeEditor;
