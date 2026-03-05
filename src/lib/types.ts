export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
}

export interface CodeBlockProps {
  code: string;
  language: string;
}

export interface MathBlockProps {
  latex: string;
  isInline?: boolean;
}

export interface MermaidBlockProps {
  code: string;
}
