const CONSOLE_INTERCEPTOR = `
    <script>
      (function() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalInfo = console.info;

        function safeStringify(obj) {
          const cache = new Set();
          return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (cache.has(value)) return '[Circular]';
              cache.add(value);
            }
            return value;
          }, 2);
        }

        function formatArgs(args) {
          return args.map(arg => {
            if (typeof arg === 'object') {
              try { return safeStringify(arg); } catch (e) { return '[Object]'; }
            }
            return String(arg);
          }).join(' ');
        }

        function sendToParent(type, args) {
          window.parent.postMessage({
            source: 'netherz-iframe',
            type: type,
            message: formatArgs(args)
          }, '*');
        }

        console.log = (...args) => { originalLog.apply(console, args); sendToParent('log', args); };
        console.error = (...args) => { originalError.apply(console, args); sendToParent('error', args); };
        console.info = (...args) => { originalInfo.apply(console, args); sendToParent('info', args); };

        window.onerror = function(message, source, lineno, colno) {
          sendToParent('error', [message + ' (' + lineno + ':' + colno + ')']);
        };
      })();
    </script>
`;

export const generateSrcDoc = (code) => {
  const { html, css, js } = code;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; background-color: #fff; color: #000; margin: 0; padding: 0; }
          ${css}
        </style>
        ${CONSOLE_INTERCEPTOR}
      </head>
      <body>
        ${html}
        <script>
          try {
            ${js}
          } catch (e) {
            console.error(e);
          }
        </script>
      </body>
    </html>
  `;
};