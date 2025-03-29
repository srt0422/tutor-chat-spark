
import { supabaseClient } from './supabaseClient';

// Data structures and principles covered in the assessment
export const codingTopics = [
  {
    id: 'arrays',
    name: 'Arrays & Basic Data Structures',
    description: 'Working with arrays and simple data structures',
    levels: [1, 2, 3, 4]
  },
  {
    id: 'hash-tables',
    name: 'Hash Tables & Dictionaries',
    description: 'Using hash tables for efficient lookups and data organization',
    levels: [1, 2, 3, 4]
  },
  {
    id: 'linked-lists',
    name: 'Linked Lists',
    description: 'Working with linked lists and node-based structures',
    levels: [2, 3, 4]
  },
  {
    id: 'trees',
    name: 'Trees & Hierarchical Structures',
    description: 'Implementing and traversing tree data structures',
    levels: [2, 3, 4]
  },
  {
    id: 'graphs',
    name: 'Graphs & Network Structures',
    description: 'Working with graph algorithms and representations',
    levels: [3, 4]
  },
  {
    id: 'sorting',
    name: 'Sorting Algorithms',
    description: 'Implementing various sorting algorithms',
    levels: [1, 2, 3, 4]
  },
  {
    id: 'searching',
    name: 'Searching Algorithms',
    description: 'Implementing various searching algorithms',
    levels: [1, 2, 3, 4]
  },
  {
    id: 'oop',
    name: 'Object-Oriented Programming',
    description: 'Applying OOP principles like encapsulation and inheritance',
    levels: [2, 3, 4]
  },
  {
    id: 'functional',
    name: 'Functional Programming',
    description: 'Using functional programming techniques',
    levels: [2, 3, 4]
  },
  {
    id: 'recursion',
    name: 'Recursion',
    description: 'Solving problems with recursive algorithms',
    levels: [2, 3, 4]
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    description: 'Optimizing algorithms with dynamic programming',
    levels: [3, 4]
  },
  {
    id: 'file-operations',
    name: 'File Operations',
    description: 'Implementing file system operations',
    levels: [1, 2, 3, 4]
  }
];

export interface TutorSession {
  topic: string;
  level: number;
  mode: 'guided' | 'unguided';
  messageHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

// Initial messages for different problem modes
export const getInitialPrompt = (topic: string, level: number, mode: 'guided' | 'unguided'): string => {
  const topicInfo = codingTopics.find(t => t.id === topic);
  
  if (!topicInfo) {
    return `Let's work on a coding problem. What would you like to start with?`;
  }
  
  const levelDescriptions = [
    "Basic implementation with simple methods",
    "Data structures and data processing functions",
    "Refactoring, extension, and maintaining existing code",
    "Enhanced functionality with backward compatibility"
  ];
  
  const levelDesc = levelDescriptions[level - 1] || levelDescriptions[0];
  
  if (mode === 'guided') {
    return `Let's work on a Level ${level} guided problem focusing on ${topicInfo.name}. 
    
This will be a step-by-step tutorial where I'll guide you through each part. I'll wait for you to implement each step before moving to the next one.

Problem Context: ${topicInfo.description}
Level ${level} Focus: ${levelDesc}

Are you ready to begin?`;
  } else {
    return `Let's work on a Level ${level} unguided problem focusing on ${topicInfo.name}.
    
For this exercise, I'll present the problem, and you'll work through it independently. I'll be here if you have questions, but I won't provide unsolicited guidance.

Problem Context: ${topicInfo.description}
Level ${level} Focus: ${levelDesc}

Are you ready to begin?`;
  }
};

// Helper function to get a problem example based on topic and level
export const getProblemExample = (topic: string, level: number): string => {
  // This could be expanded with many more examples
  const examples: Record<string, Record<number, string>> = {
    'arrays': {
      1: "Create a function that calculates the sum and average of an array of numbers.",
      2: "Implement a function that merges two sorted arrays into a single sorted array.",
      3: "Refactor an array-based data processing module to handle different data types.",
      4: "Extend an array library with backward-compatible time-complexity optimizations."
    },
    'file-operations': {
      1: "Implement basic FILE_UPLOAD and FILE_GET functions that track file metadata.",
      2: "Create a FILE_SEARCH function that finds files by prefix and sorts results.",
      3: "Refactor file operations into a class with timestamped snapshots.",
      4: "Implement a ROLLBACK system that can restore the file system to previous states."
    },
    // Add more problem examples as needed
  };
  
  // Get the example for the specified topic and level, or provide a generic one
  return examples[topic]?.[level] || 
    `Implement a ${level === 1 ? 'basic' : level === 2 ? 'intermediate' : level === 3 ? 'advanced' : 'expert'} solution for a problem related to ${topic}.`;
};

// Create a new tutoring session
export const createTutorSession = (topic: string, level: number, mode: 'guided' | 'unguided'): TutorSession => {
  return {
    topic,
    level,
    mode,
    messageHistory: [
      {
        role: 'assistant',
        content: getInitialPrompt(topic, level, mode)
      }
    ]
  };
};

// Send a message to the AI tutor via Supabase Edge Function
export const sendTutorMessage = async (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  problemType: string,
  level: number,
  problemMode: 'guided' | 'unguided'
): Promise<string> => {
  try {
    const { data, error } = await supabaseClient.functions.invoke('ai-chat', {
      body: {
        messages,
        problemType,
        level,
        problemMode
      }
    });

    if (error) {
      console.error('Error calling AI tutor:', error);
      throw new Error(`Failed to get tutor response: ${error.message}`);
    }

    // Extract message content from OpenRouter response format
    if (data?.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }

    throw new Error('Invalid response from tutor AI');
  } catch (error) {
    console.error('Error in sendTutorMessage:', error);
    return "Sorry, I encountered a problem connecting to my knowledge base. Please try again in a moment.";
  }
};
