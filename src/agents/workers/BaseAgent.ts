import { v4 as uuidv4 } from 'uuid';
import { AgentMessage } from '../types';

// Base class for all agent workers
export abstract class BaseAgent {
  protected abstract handleMessage(message: AgentMessage): Promise<AgentMessage>;
  
  constructor() {
    // Set up message listener in the web worker context
    self.onmessage = async (event) => {
      try {
        const message = event.data as AgentMessage;
        
        if (!message || !message.type) {
          throw new Error('Invalid message format');
        }
        
        // Process the message through the handler
        const response = await this.handleMessage(message);
        
        // Send the response back to the main thread
        self.postMessage(response);
      } catch (error) {
        console.error('Error in agent worker:', error);
        
        // Send error response
        self.postMessage({
          id: (event.data?.id as string) || uuidv4(),
          type: 'error',
          payload: {
            error: error instanceof Error ? error.message : 'Unknown error',
            originalMessage: event.data
          }
        });
      }
    };
  }
  
  // Helper method to create response messages
  protected createResponse(originalMessage: AgentMessage, type: string, payload: any): AgentMessage {
    return {
      id: originalMessage.id,
      type,
      payload
    };
  }
  
  // Helper method to persist data to IndexedDB
  protected async persistToIndexedDB(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AgentDatabase', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Ensure data has an ID
        const dataWithId = { ...data, id: data.id || uuidv4() };
        
        const storeRequest = store.put(dataWithId);
        
        storeRequest.onsuccess = () => {
          resolve();
        };
        
        storeRequest.onerror = () => {
          reject(new Error(`Failed to store data in ${storeName}`));
        };
      };
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
    });
  }
  
  // Helper method to retrieve data from IndexedDB
  protected async retrieveFromIndexedDB(storeName: string, id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AgentDatabase', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result);
        };
        
        getRequest.onerror = () => {
          reject(new Error(`Failed to retrieve data from ${storeName}`));
        };
      };
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
    });
  }
  
  // Helper method to retrieve all data from IndexedDB
  protected async retrieveAllFromIndexedDB(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AgentDatabase', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result);
        };
        
        getAllRequest.onerror = () => {
          reject(new Error(`Failed to retrieve all data from ${storeName}`));
        };
      };
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
    });
  }
  
  // Helper method to delete data from IndexedDB
  protected async deleteFromIndexedDB(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AgentDatabase', 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = () => {
          resolve();
        };
        
        deleteRequest.onerror = () => {
          reject(new Error(`Failed to delete data from ${storeName}`));
        };
      };
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
    });
  }
} 