export const THEMES = {
  netherz: {
    id: 'netherz',
    colors: {
      keyword: 'text-purple-400 font-bold',
      string: 'text-green-400',
      function: 'text-blue-400',
      number: 'text-orange-400',
      comment: 'text-gray-500 italic',
      tag: 'text-red-400',
      attribute: 'text-yellow-400',
      operator: 'text-gray-300'
    }
  }
};

const escapeHtml = (unsafe) => {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const highlightCode = (code, language) => {
  if (!code) return '';
  
  let highlighted = escapeHtml(code);
  const c = THEMES.netherz.colors; // Using default theme for now

  const wrap = (str, className) => `<span class="${className}">${str}</span>`;

  if (language === 'html') {
    highlighted = highlighted.replace(/(&lt;!--[\s\S]*?--&gt;)/g, wrap('$1', c.comment));
    highlighted = highlighted.replace(/(&lt;\/?[a-z0-9-]+)(\s|&gt;|\/)/gi, `${wrap('$1', c.tag)}$2`);
    highlighted = highlighted.replace(/(\s)([a-z0-9-]+)(=)/gi, `$1${wrap('$2', c.attribute)}$3`);
    highlighted = highlighted.replace(/(&quot;.*?&quot;)/g, wrap('$1', c.string));
  } 
  else if (language === 'css') {
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, wrap('$1', c.comment));
    highlighted = highlighted.replace(/(^|}|;)(\s*)([.#a-z0-9:, \n-]+)({)/gim, `$1$2${wrap('$3', c.function)}$4`);
    highlighted = highlighted.replace(/([a-z-]+)(:)/gi, `${wrap('$1', c.attribute)}$2`);
    highlighted = highlighted.replace(/(:)(\s*)([^;]+)/g, (match, p1, p2, p3) => {
        const val = p3.replace(/([0-9]+(px|rem|%|em|s|deg)?)/g, wrap('$1', c.number))
                      .replace(/(#[a-f0-9]{3,6})/gi, wrap('$1', c.string));
        return `${p1}${p2}${val}`;
    });
  } 
  else if (language === 'js') {
    highlighted = highlighted.replace(/(\/\/.*$)/gm, wrap('$1', c.comment));
    highlighted = highlighted.replace(/(&quot;.*?&quot;|&#039;.*?&#039;|`.*?`)/g, wrap('$1', c.string));
    const keywords = '\\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|true|false|null|undefined|async|await|import|export|from|class|new|this|try|catch|finally)\\b';
    highlighted = highlighted.replace(new RegExp(keywords, 'g'), wrap('$1', c.keyword));
    highlighted = highlighted.replace(/([a-z0-9_]+)(\()/gi, `${wrap('$1', c.function)}$2`);
    highlighted = highlighted.replace(/\b(\d+)\b/g, wrap('$1', c.number));
    highlighted = highlighted.replace(/(=|\+|-|\*|\/|%|&gt;|&lt;|!|&amp;|\|)/g, wrap('$1', c.operator));
  }

  return highlighted;
};