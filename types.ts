export type CodeTab = 'html' | 'css' | 'js';

export interface LogEntry {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: string;
}

export interface CodeState {
  html: string;
  css: string;
  js: string;
}

export interface Space {
  id: string;
  name: string;
  code: CodeState;
  lastModified: number;
}

export interface ThemeConfig {
  isDark: boolean;
  toggleTheme: () => void;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  password?: string; // In a real app, never store plain passwords on client
}

export interface EditorTheme {
  id: string;
  name: string;
  background: string; // Tailwind class or hex
  foreground: string; // Text color
  lineNumbers: string; // Line number color
  selection: string; // Selection color (css value)
  caret: string; // Tailwind Caret class (kept for reference/fallback)
  caretColor: string; // Explicit CSS color for caret
  colors: {
    keyword: string;
    string: string;
    function: string;
    number: string;
    comment: string;
    tag: string;
    attribute: string;
    operator: string;
  };
}