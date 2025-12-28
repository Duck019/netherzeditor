import { CodeState } from '../types';

// Script to intercept console methods and send them to parent window
// Includes a safeStringify to handle circular references which would otherwise crash the app
const CONSOLE_INTERCEPTOR = `
    <script>
      (function() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;

        // Safe stringify to handle circular references
        function safeStringify(obj) {
          const cache = new Set();
          return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (cache.has(value)) {
                // Circular reference found, discard key
                return '[Circular]';
              }
              // Store value in our collection
              cache.add(value);
            }
            return value;
          }, 2);
        }

        function formatArgs(args) {
          return args.map(arg => {
            if (arg instanceof Error) {
                return arg.stack || arg.message;
            }
            if (typeof arg === 'object') {
              try {
                return safeStringify(arg);
              } catch (e) {
                return '[Complex Object]';
              }
            }
            return String(arg);
          }).join(' ');
        }

        function sendToParent(type, args) {
          try {
            window.parent.postMessage({
              source: 'netherz-iframe',
              type: type,
              message: formatArgs(args)
            }, '*');
          } catch (e) {
            // Fallback for non-cloneable objects
            window.parent.postMessage({
              source: 'netherz-iframe',
              type: 'error',
              message: 'Log Error: Object could not be cloned.'
            }, '*');
          }
        }

        console.log = (...args) => {
          originalLog.apply(console, args);
          sendToParent('log', args);
        };

        console.error = (...args) => {
          originalError.apply(console, args);
          sendToParent('error', args);
        };

        console.warn = (...args) => {
          originalWarn.apply(console, args);
          sendToParent('warn', args);
        };

        console.info = (...args) => {
          originalInfo.apply(console, args);
          sendToParent('info', args);
        };

        window.onerror = function(message, source, lineno, colno, error) {
          sendToParent('error', [message + ' (' + lineno + ':' + colno + ')']);
          return false;
        };
        
        window.addEventListener('unhandledrejection', function(event) {
          sendToParent('error', ['Unhandled Promise Rejection: ' + event.reason]);
        });
      })();
    </script>
`;

const getPrefix = (css: string, html: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            color: #000000;
          }
          /* User CSS */
          ${css}
        </style>
        ${CONSOLE_INTERCEPTOR}
      </head>
      <body>
        <!-- User HTML -->
        ${html}
        
        <!-- User JS -->
        <script>
          try {
`;

export const getJsLineOffset = (code: CodeState): number => {
    const prefix = getPrefix(code.css, code.html);
    // Count newlines to get the line number where JS starts. 
    // If the prefix ends with a newline, the JS starts on the next line.
    return prefix.split('\n').length - 1;
};

export const generateSrcDoc = (code: CodeState): string => {
  const { html, css, js } = code;
  const prefix = getPrefix(css, html);

  return `${prefix}
            ${js}
          } catch (e) {
            console.error(e);
          }
        </script>
      </body>
    </html>
  `;
};