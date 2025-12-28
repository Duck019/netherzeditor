import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal, Ban, Clock, AlertTriangle, AlertCircle, Info, FileText } from 'lucide-react';
import { Button } from './ui/Button';

interface ConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, onClear }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogStyle = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': 
        return {
          container: 'bg-red-500/10 border-l-2 border-red-500 text-red-200 dark:text-red-100 hover:bg-red-500/15',
          icon: <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5" />,
          timestamp: 'text-red-300/50'
        };
      case 'warn': 
        return {
          container: 'bg-amber-500/10 border-l-2 border-amber-500 text-amber-200 dark:text-amber-100 hover:bg-amber-500/15',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5" />,
          timestamp: 'text-amber-300/50'
        };
      case 'info': 
        return {
          container: 'bg-blue-500/10 border-l-2 border-blue-500 text-blue-200 dark:text-blue-100 hover:bg-blue-500/15',
          icon: <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5" />,
          timestamp: 'text-blue-300/50'
        };
      default: 
        return {
          container: 'bg-white/5 border-l-2 border-gray-500/50 text-gray-300 hover:bg-white/10',
          icon: <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5" />,
          timestamp: 'text-gray-500'
        };
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-blue-500/10">
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/20 dark:bg-black/20">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 px-2">
          <Terminal className="w-4 h-4 text-nether-500" />
          Console
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full border border-white/5 min-w-[20px] text-center">
            {logs.length}
          </span>
        </h2>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
          <Ban className="w-3.5 h-3.5 mr-1.5" />
          Clear
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2 bg-black/90 backdrop-blur-xl">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
             <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
               <Terminal className="w-6 h-6 opacity-40" />
             </div>
             <p className="opacity-60">System ready. Waiting for logs...</p>
          </div>
        ) : (
          logs.map((log) => {
            const style = getLogStyle(log.type);
            return (
              <div key={log.id} className={`p-3 rounded-r-lg flex gap-3 transition-colors duration-200 animate-fade-in group ${style.container}`}>
                 {/* Metadata Column */}
                 <div className="flex flex-col items-end gap-1 shrink-0 min-w-[60px] border-r border-white/10 pr-3">
                    <span className={`text-[10px] font-medium flex items-center gap-1 opacity-70 ${style.timestamp}`}>
                      {log.timestamp}
                    </span>
                    <div className="opacity-90 group-hover:scale-110 transition-transform duration-200">
                      {style.icon}
                    </div>
                 </div>
                 
                 {/* Message Column */}
                 <pre className="whitespace-pre-wrap flex-1 font-mono leading-relaxed break-all selection:bg-white/20">
                    {log.message}
                 </pre>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};