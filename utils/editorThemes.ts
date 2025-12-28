import { EditorTheme, CodeTab } from '../types';

export const THEMES: Record<string, EditorTheme> = {
  netherz: {
    id: 'netherz',
    name: 'Netherz Glass',
    // Increased opacity for better legibility on mobile against the animated background
    background: 'bg-white/70 dark:bg-black/60 backdrop-blur-xl', 
    foreground: 'text-gray-900 dark:text-gray-100',
    lineNumbers: 'text-gray-400 dark:text-gray-500',
    selection: 'rgba(139, 92, 246, 0.3)',
    caret: 'caret-nether-600 dark:caret-nether-400',
    caretColor: '#7c3aed', // Explicit purple for light mode, logic will handle dark in component if needed or use css var
    colors: {
      keyword: 'text-purple-700 dark:text-purple-400 font-bold',
      string: 'text-green-700 dark:text-green-400',
      function: 'text-blue-700 dark:text-blue-400',
      number: 'text-orange-700 dark:text-orange-400',
      comment: 'text-gray-500 italic',
      tag: 'text-red-700 dark:text-red-400',
      attribute: 'text-yellow-700 dark:text-yellow-400',
      operator: 'text-gray-700 dark:text-gray-300'
    }
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    background: 'bg-[#282a36]',
    foreground: 'text-[#f8f8f2]',
    lineNumbers: 'text-[#6272a4]',
    selection: '#44475a',
    caret: 'caret-[#f8f8f2]',
    caretColor: '#f8f8f2',
    colors: {
      keyword: 'text-[#ff79c6] font-bold',
      string: 'text-[#f1fa8c]',
      function: 'text-[#50fa7b]',
      number: 'text-[#bd93f9]',
      comment: 'text-[#6272a4] italic',
      tag: 'text-[#ff79c6]',
      attribute: 'text-[#50fa7b] italic',
      operator: 'text-[#ff79c6]'
    }
  },
  solarized: {
    id: 'solarized',
    name: 'Solarized Light',
    background: 'bg-[#fdf6e3]',
    foreground: 'text-[#657b83]',
    lineNumbers: 'text-[#93a1a1]',
    selection: '#eee8d5',
    caret: 'caret-[#586e75]',
    caretColor: '#586e75',
    colors: {
      keyword: 'text-[#859900] font-bold',
      string: 'text-[#2aa198]',
      function: 'text-[#268bd2]',
      number: 'text-[#d33682]',
      comment: 'text-[#93a1a1] italic',
      tag: 'text-[#268bd2]',
      attribute: 'text-[#93a1a1]',
      operator: 'text-[#859900]'
    }
  },
  monokai: {
    id: 'monokai',
    name: 'Monokai',
    background: 'bg-[#272822]',
    foreground: 'text-[#f8f8f2]',
    lineNumbers: 'text-[#75715e]',
    selection: '#49483e',
    caret: 'caret-[#f8f8f2]',
    caretColor: '#f8f8f2',
    colors: {
      keyword: 'text-[#f92672] font-bold',
      string: 'text-[#e6db74]',
      function: 'text-[#a6e22e]',
      number: 'text-[#ae81ff]',
      comment: 'text-[#75715e] italic',
      tag: 'text-[#f92672]',
      attribute: 'text-[#a6e22e]',
      operator: 'text-[#f92672]'
    }
  }
};

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const highlightCode = (code: string, language: CodeTab, theme: EditorTheme): string => {
  if (!code) return '';
  
  let highlighted = escapeHtml(code);
  const c = theme.colors;

  // Helper to wrap regex matches
  const wrap = (str: string, className: string) => `<span class="${className}">${str}</span>`;

  if (language === 'html') {
    // Comments
    highlighted = highlighted.replace(/(&lt;!--[\s\S]*?--&gt;)/g, wrap('$1', c.comment));
    // Tags (simplified)
    highlighted = highlighted.replace(/(&lt;\/?[a-z0-9-]+)(\s|&gt;|\/)/gi, `${wrap('$1', c.tag)}$2`);
    // Attributes
    highlighted = highlighted.replace(/(\s)([a-z0-9-]+)(=)/gi, `$1${wrap('$2', c.attribute)}$3`);
    // Strings in attributes
    highlighted = highlighted.replace(/(&quot;.*?&quot;)/g, wrap('$1', c.string));
  } 
  else if (language === 'css') {
    // Comments
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, wrap('$1', c.comment));
    // Selectors (start of line or after })
    highlighted = highlighted.replace(/(^|}|;)(\s*)([.#a-z0-9:, \n-]+)({)/gim, `$1$2${wrap('$3', c.function)}$4`);
    // Properties
    highlighted = highlighted.replace(/([a-z-]+)(:)/gi, `${wrap('$1', c.attribute)}$2`);
    // Values/Numbers
    highlighted = highlighted.replace(/(:)(\s*)([^;]+)/g, (match, p1, p2, p3) => {
        const val = p3.replace(/([0-9]+(px|rem|%|em|s|deg)?)/g, wrap('$1', c.number))
                      .replace(/(#[a-f0-9]{3,6})/gi, wrap('$1', c.string));
        return `${p1}${p2}${val}`;
    });
  } 
  else if (language === 'js') {
    // Comments
    highlighted = highlighted.replace(/(\/\/.*$)/gm, wrap('$1', c.comment));
    
    // Strings
    highlighted = highlighted.replace(/(&quot;.*?&quot;|&#039;.*?&#039;|`.*?`)/g, wrap('$1', c.string));
    
    // Keywords
    const keywords = '\\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|true|false|null|undefined|async|await|import|export|from|class|new|this|try|catch|finally)\\b';
    highlighted = highlighted.replace(new RegExp(keywords, 'g'), wrap('$1', c.keyword));
    
    // Functions call
    highlighted = highlighted.replace(/([a-z0-9_]+)(\()/gi, `${wrap('$1', c.function)}$2`);
    
    // Numbers
    highlighted = highlighted.replace(/\b(\d+)\b/g, wrap('$1', c.number));
    
    // Operators
    highlighted = highlighted.replace(/(=|\+|-|\*|\/|%|&gt;|&lt;|!|&amp;|\|)/g, wrap('$1', c.operator));
  }

  return highlighted;
};