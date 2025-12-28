import React, { useRef, useState, useEffect } from 'react';
import { CodeTab, CodeState, EditorTheme } from '../types';
import { Trash2, Play, Download, AlertCircle, Upload } from 'lucide-react';
import { Button } from './ui/Button';
import { highlightCode } from '../utils/editorThemes';

interface EditorProps {
  code: CodeState;
  activeTab: CodeTab;
  setActiveTab: (tab: CodeTab) => void;
  onChange: (value: string, tab: CodeTab) => void;
  onRun: () => void;
  onClear: () => void;
  onDownload: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  lastSaved?: Date | null;
  errorLine?: number | null;
  theme: EditorTheme;
}

const DICTIONARIES = {
  html: ['div', 'span', 'p', 'a', 'img', 'ul', 'li', 'button', 'input', 'form', 'label', 'h1', 'h2', 'h3', 'section', 'header', 'footer', 'nav', 'main', 'style', 'script', 'link', 'meta', 'title', 'body', 'head', 'html', 'class', 'id', 'src', 'href', 'type', 'placeholder', 'value', 'alt', 'width', 'height'],
  css: ['color', 'background', 'background-color', 'margin', 'padding', 'border', 'border-radius', 'width', 'height', 'font-size', 'font-family', 'font-weight', 'text-align', 'display', 'flex', 'grid', 'position', 'absolute', 'relative', 'top', 'left', 'right', 'bottom', 'z-index', 'opacity', 'box-shadow', 'overflow', 'cursor', 'transition', 'transform', 'justify-content', 'align-items', 'gap', 'white-space'],
  js: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'true', 'false', 'null', 'undefined', 'console', 'log', 'error', 'info', 'document', 'window', 'getElementById', 'querySelector', 'querySelectorAll', 'addEventListener', 'setTimeout', 'setInterval', 'map', 'filter', 'reduce', 'forEach', 'push', 'pop', 'length', 'toString', 'JSON', 'parse', 'stringify']
};

const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
  const div = document.createElement('div');
  const style = div.style;
  const computed = window.getComputedStyle(element);

  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';

  ['direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
   'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
   'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
   'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
   'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
   'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing']
   .forEach(prop => { 
     // @ts-ignore
     style[prop] = computed[prop]; 
   });

  div.textContent = element.value.substring(0, position);
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);
  
  document.body.appendChild(div);
  
  const coordinates = {
    top: span.offsetTop + parseInt(computed['borderTopWidth']),
    left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
    height: parseInt(computed['lineHeight'])
  };
  
  document.body.removeChild(div);
  return coordinates;
};

export const Editor: React.FC<EditorProps> = ({
  code,
  activeTab,
  setActiveTab,
  onChange,
  onRun,
  onClear,
  onDownload,
  onUpload,
  lastSaved,
  errorLine,
  theme
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [currentWordStart, setCurrentWordStart] = useState(0);

  const tabs: { id: CodeTab; label: string; color: string }[] = [
    { id: 'html', label: 'HTML', color: 'text-orange-500' },
    { id: 'css', label: 'CSS', color: 'text-blue-500' },
    { id: 'js', label: 'JS', color: 'text-yellow-400' },
  ];

  const handleScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;
      
      if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = top;
      if (preRef.current) {
         preRef.current.scrollTop = top;
         preRef.current.scrollLeft = left;
      }
    }
    if(showSuggestions) setShowSuggestions(false);
  };

  const updateSuggestions = (value: string, cursorPosition: number) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const match = textBeforeCursor.match(/[\w-]+$/);
    
    if (match) {
      const word = match[0];
      if (word.length < 1) {
        setShowSuggestions(false);
        return;
      }

      const filtered = DICTIONARIES[activeTab].filter(item => 
        item.toLowerCase().startsWith(word.toLowerCase()) && item !== word
      ).slice(0, 10);

      if (filtered.length > 0) {
        setSuggestions(filtered);
        setSuggestionIndex(0);
        setCurrentWordStart(cursorPosition - word.length);
        
        if (textareaRef.current) {
          const { top, left, height } = getCaretCoordinates(textareaRef.current, cursorPosition);
          const adjustedTop = top - textareaRef.current.scrollTop;
          setCoords({ top: adjustedTop + height, left });
          setShowSuggestions(true);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(suggestions[suggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
    
    // Indentation
    if (e.key === 'Tab' && !showSuggestions) {
       e.preventDefault();
       const start = e.currentTarget.selectionStart;
       const end = e.currentTarget.selectionEnd;
       const value = code[activeTab];
       const newValue = value.substring(0, start) + "  " + value.substring(end);
       
       onChange(newValue, activeTab);
       
       // Need to manually set cursor position after render
       setTimeout(() => {
          if (textareaRef.current) {
             textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
          }
       }, 0);
    }
  };

  const insertSuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;
    
    const value = code[activeTab];
    const before = value.substring(0, currentWordStart);
    const after = value.substring(textareaRef.current.selectionEnd);
    
    const newValue = before + suggestion + after;
    onChange(newValue, activeTab);
    
    setShowSuggestions(false);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = currentWordStart + suggestion.length;
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart;
    onChange(newValue, activeTab);
    updateSuggestions(newValue, newCursorPos);
  };

  const handleTriggerUpload = () => {
    hiddenFileInputRef.current?.click();
  };

  const lineCount = code[activeTab].split('\n').length;
  const currentCode = code[activeTab];
  const highlightedCode = highlightCode(currentCode, activeTab, theme);

  // Dynamic caret color for Netherz to adapt to light/dark mode
  const getCaretColor = () => {
     if (theme.id === 'netherz') {
        return document.documentElement.classList.contains('dark') ? '#a78bfa' : '#7c3aed';
     }
     return theme.caretColor;
  }

  return (
    <div className={`flex flex-col h-full glass-panel rounded-3xl overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-nether-500/10 ${theme.background}`}>
      {/* Toolbar */}
      <div className={`flex items-center justify-between p-3 border-b border-white/10 ${theme.id === 'netherz' ? 'bg-white/20 dark:bg-black/20' : 'bg-black/10'}`}>
        <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowSuggestions(false); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-white/10 shadow-lg ring-1 ring-black/5 scale-105'
                  : 'hover:bg-white/30 dark:hover:bg-white/5'
              } ${activeTab === tab.id ? theme.foreground : 'text-gray-500 dark:text-gray-400'}`}
            >
              <span className={`flex items-center gap-1.5`}>
                 <span className={`w-1.5 h-1.5 rounded-full ${activeTab === tab.id ? 'bg-current animate-pulse' : 'bg-transparent'}`}></span>
                 {tab.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
            <input 
              type="file" 
              ref={hiddenFileInputRef}
              style={{ display: 'none' }}
              onChange={onUpload} 
              accept=".json,.html,.htm,.css,.js,.txt,.md"
            />
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleTriggerUpload} 
              title="Import Code File"
              className={`hover:bg-white/20 rounded-lg w-8 h-8 !p-0 ${theme.foreground}`}
            >
               <Upload className="w-4 h-4" />
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDownload} 
              title="Download Project" 
              className={`hover:bg-white/20 rounded-lg w-8 h-8 !p-0 ${theme.foreground}`}
            >
                <Download className="w-4 h-4" />
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClear} 
              title="Clear Current Tab" 
              className="group hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-colors rounded-lg w-8 h-8 !p-0"
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
      </div>

      {/* Code Area Container */}
      <div className="relative flex-1 flex group overflow-hidden">
        
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className={`hidden sm:flex flex-col h-full py-6 pr-4 pl-3 text-right ${theme.lineNumbers} font-mono text-xs md:text-sm border-r border-white/10 select-none overflow-hidden min-w-[3.5rem] bg-black/5`}
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }).map((_, i) => {
            const lineNum = i + 1;
            const isError = activeTab === 'js' && lineNum === errorLine;
            return (
               <div 
                 key={lineNum} 
                 className={`leading-relaxed transition-colors duration-300 ${isError ? 'bg-red-500/20 text-red-500 font-bold px-1 -mx-1 rounded' : ''}`}
               >
                 {lineNum}
               </div>
            );
          })}
        </div>

        <div className="relative flex-1 w-full h-full overflow-hidden">
            {/* Layer 1: Highlighted Code (Bottom) */}
            <pre
               ref={preRef}
               className={`absolute inset-0 w-full h-full p-6 m-0 font-mono text-sm md:text-base leading-relaxed whitespace-pre pointer-events-none z-0 overflow-hidden ${theme.foreground}`}
               dangerouslySetInnerHTML={{ __html: highlightedCode + '<br>' }}
            />

            {/* Layer 2: Transparent Input (Top) */}
            <textarea
              ref={textareaRef}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              value={code[activeTab]}
              onChange={handleInput}
              onClick={() => setShowSuggestions(false)}
              className={`absolute inset-0 w-full h-full p-6 bg-transparent text-transparent font-mono text-sm md:text-base resize-none focus:outline-none leading-relaxed placeholder-gray-400/50 whitespace-pre overflow-auto z-10 ${theme.caret}`}
              placeholder={`Write your ${activeTab.toUpperCase()} code here...`}
              spellCheck={false}
              style={{
                 color: 'transparent',
                 caretColor: getCaretColor()
              }}
            />
        </div>
        
        {/* Autocomplete Popup */}
        {showSuggestions && (
          <ul 
            className="absolute z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[180px] max-h-[220px] overflow-y-auto animate-fade-in"
            style={{ 
              top: coords.top, 
              left: coords.left + 56
            }}
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                className={`px-4 py-2 text-xs font-mono cursor-pointer transition-colors border-l-2 ${
                  index === suggestionIndex 
                    ? 'bg-nether-500/20 text-nether-700 dark:text-nether-300 border-nether-500' 
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
                onClick={() => insertSuggestion(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
        
        {/* Floating Run Button */}
        <div className="absolute bottom-8 right-8 z-20">
          <Button 
            onClick={onRun} 
            className="rounded-2xl w-14 h-14 !p-0 shadow-xl shadow-nether-600/30 hover:shadow-nether-600/50 hover:scale-110 hover:-translate-y-1 active:scale-95 border-2 border-white/20 transition-all duration-300 bg-gradient-to-br from-nether-500 to-indigo-600"
          >
            <Play className="w-6 h-6 fill-current ml-1 text-white" />
          </Button>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className={`px-4 py-2 border-t border-white/10 text-[10px] flex justify-between font-mono font-medium ${theme.id === 'netherz' ? 'bg-white/30 dark:bg-black/30' : 'bg-black/10'} ${theme.foreground} opacity-80`}>
         <span className="flex items-center gap-2">
           {errorLine && activeTab === 'js' && (
             <span className="text-red-500 flex items-center gap-1 font-bold animate-pulse bg-red-500/10 px-2 rounded-full">
               <AlertCircle className="w-3 h-3" /> Error on line {errorLine}
             </span>
           )}
           {code[activeTab].length} chars • {lineCount} lines
         </span>
         <span className="opacity-70">
           {lastSaved ? `Autosaved: ${lastSaved.toLocaleTimeString()}` : 'Unsaved'} • UTF-8
         </span>
      </div>
    </div>
  );
};