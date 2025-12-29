import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { Console } from './components/Console';
import { Modal } from './components/ui/Modal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { Button } from './components/ui/Button';
import { CodeState, CodeTab, LogEntry, Space, User, EditorTheme } from './types';
import { generateSrcDoc, getJsLineOffset } from './utils/codeRunner';
import { THEMES } from './utils/editorThemes';
import { Plus, Edit2, Trash2, Eraser, Archive, FileJson, Heart, Cloud, CloudOff, AlertTriangle, FileCode, FolderPlus, Download, FileType } from 'lucide-react';
import { monitorarEstadoAuth, fazerLogout } from './auth';
import { carregarEspacosRemotos, salvarEspacoRemoto, deletarEspacoRemoto, salvarMuitosEspacos } from './db';

// Declare external libraries loaded via CDN
declare var JSZip: any;
declare var saveAs: any;

const INITIAL_CODE: CodeState = {
  html: `<div class="container">
  <div class="glass-card">
    <h1>Netherz</h1>
    <p>Code with style.</p>
    <button id="btn">Pulse Me</button>
  </div>
</div>`,
  css: `body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  background: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop') no-repeat center center/cover;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 3rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 45px rgba(0,0,0,0.2);
  text-align: center;
  color: white;
  max-width: 400px;
  width: 100%;
}

h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  font-weight: 800;
  letter-spacing: -2px;
  background: linear-gradient(to right, #fff, #a5b4fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: rgba(255,255,255,0.7);
  margin-bottom: 2rem;
}

button {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 0.8rem 2rem;
  color: white;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

button:hover {
  background: rgba(255,255,255,0.25);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}`,
  js: `console.log("Welcome to Netherz v2.0");

const btn = document.getElementById('btn');
let pulsing = false;

btn.addEventListener('click', () => {
  if (pulsing) return;
  
  pulsing = true;
  btn.innerText = "Pulsing...";
  console.info("Animation triggered");
  
  let scale = 1;
  const interval = setInterval(() => {
     scale = scale === 1 ? 1.1 : 1;
     btn.style.transform = \`scale(\${scale})\`;
  }, 200);
  
  setTimeout(() => {
     clearInterval(interval);
     btn.style.transform = 'scale(1)';
     btn.innerText = "Pulse Me";
     pulsing = false;
     console.log("Animation complete");
  }, 2000);
});`
};

// --- Storage Helpers ---
const getStorageKeys = (userId?: string) => {
  const suffix = userId ? `_${userId}` : '_guest';
  return {
    spaces: `netherz_spaces${suffix}`,
    activeSpace: `netherz_active_space${suffix}`
  };
};

// Explicit safe styling for inputs to ensure contrast in both modes
const SAFE_INPUT_CLASS = "w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 focus:border-nether-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-nether-500/20 dark:bg-gray-800 dark:text-white dark:border-gray-600 transition-all font-medium";

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = monitorarEstadoAuth(async (authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);
        setIsAuthModalOpen(false);
        
        // --- LOGIC TO LOAD SPACES FROM DB ---
        setIsLoadingSpaces(true);
        try {
          const remoteSpaces = await carregarEspacosRemotos(authenticatedUser.id);
          
          if (remoteSpaces.length > 0) {
            // If user has data in cloud, use it (Cloud Source of Truth)
            setSpaces(remoteSpaces);
            // Also update local storage cache
            const { spaces: spacesKey } = getStorageKeys(authenticatedUser.id);
            localStorage.setItem(spacesKey, JSON.stringify(remoteSpaces));
            
            // Set active space safely
            if (!remoteSpaces.find(s => s.id === activeSpaceId)) {
               const first = remoteSpaces[0];
               setActiveSpaceId(first.id);
               setCode(first.code);
               setTimeout(() => setSrcDoc(generateSrcDoc(first.code)), 100);
            }
          } else {
            // New user or no cloud data: Sync current local/guest data to cloud
            // This is "Migration" logic
            const currentSpaces = spacesRef.current;
            await salvarMuitosEspacos(authenticatedUser.id, currentSpaces);
            console.log("Migrated local spaces to cloud");
          }
        } catch (e) {
          console.error("Failed to sync spaces", e);
        } finally {
          setIsLoadingSpaces(false);
        }

      } else {
        setUser(null);
        setIsProfileModalOpen(false);
        // Switch back to guest storage handled by context effect below
      }
    });

    return () => unsubscribe();
  }, []);

  // Theme State
  const [isDark, setIsDark] = useState(true);
  const [editorTheme, setEditorTheme] = useState<EditorTheme>(THEMES.netherz);
  
  // Layout State
  const [layout, setLayout] = useState<'stacked' | 'split'>('split');
  
  // Spaces State
  const [spaces, setSpaces] = useState<Space[]>(() => {
    const { spaces: key } = getStorageKeys(user?.id);
    const savedSpaces = localStorage.getItem(key);
    
    // Migration check for old guest data
    if (!user && !savedSpaces) {
       const oldData = localStorage.getItem('netherz_spaces');
       if (oldData) return JSON.parse(oldData);
    }

    if (savedSpaces) {
      try {
        return JSON.parse(savedSpaces);
      } catch { }
    }
    return [{
      id: 'default',
      name: 'Playground',
      code: INITIAL_CODE,
      lastModified: Date.now()
    }];
  });

  const [activeSpaceId, setActiveSpaceId] = useState<string>(() => {
     const { activeSpace: key } = getStorageKeys(user?.id);
     const saved = localStorage.getItem(key);
     
     // Migration check
     if (!user && !saved) {
        return localStorage.getItem('netherz_active_space') || spaces[0].id;
     }

     return saved || spaces[0].id;
  });

  // Derived state for the current editor
  const [code, setCode] = useState<CodeState>(() => {
    const space = spaces.find(s => s.id === activeSpaceId) || spaces[0];
    return space.code;
  });

  const [activeTab, setActiveTab] = useState<CodeTab>('html');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  
  // Modal States
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadName, setDownloadName] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameSpaceName, setRenameSpaceName] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Refs
  const codeRef = useRef(code);
  const spacesRef = useRef(spaces);
  const activeSpaceIdRef = useRef(activeSpaceId);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    spacesRef.current = spaces;
  }, [spaces]);

  useEffect(() => {
    activeSpaceIdRef.current = activeSpaceId;
  }, [activeSpaceId]);
  
  // Output State
  const [srcDoc, setSrcDoc] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Initialize Theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Layout handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setLayout('stacked');
      } else {
        setLayout('split');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Iframe Messaging
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source === 'netherz-iframe') {
        const newLog: LogEntry = {
          id: Math.random().toString(36).substr(2, 9),
          type: event.data.type,
          message: event.data.message,
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setLogs(prev => [...prev, newLog]);

        if (event.data.type === 'error') {
          const offset = getJsLineOffset(codeRef.current);
          const message = event.data.message;
          let line: number | null = null;
          
          const matchOnError = message.match(/\((\d+):\d+\)$/);
          if (matchOnError) {
            line = parseInt(matchOnError[1]) - offset;
          } else {
            const matches = [...message.matchAll(/:(\d+):\d+/g)];
            if (matches.length > 0) {
              const lastMatch = matches[matches.length - 1];
              line = parseInt(lastMatch[1]) - offset;
            }
          }

          if (line !== null && line > 0) {
            setErrorLine(line);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initial Run
  useEffect(() => {
    const doc = generateSrcDoc(code);
    setSrcDoc(doc);
  }, []);

  // Sync current code to active space in spaces array
  useEffect(() => {
    setSpaces(prevSpaces => prevSpaces.map(space => 
      space.id === activeSpaceId 
        ? { ...space, code, lastModified: Date.now() } 
        : space
    ));
  }, [code, activeSpaceId]);

  // Context Switch Effect: Load spaces when user changes (only if not loaded by auth listener already)
  useEffect(() => {
    // This runs when User state flips. 
    // If logging IN, the auth listener handles fetching.
    // If logging OUT, this handles reverting to guest storage.
    
    if (!user) {
        const { spaces: spacesKey, activeSpace: activeKey } = getStorageKeys(undefined);
        const savedSpacesStr = localStorage.getItem(spacesKey);
        const savedActiveId = localStorage.getItem(activeKey);

        let nextSpaces: Space[] = [];

        if (savedSpacesStr) {
            try { nextSpaces = JSON.parse(savedSpacesStr); } catch {}
        }
        
        // Fallback to legacy
        if (nextSpaces.length === 0) {
            const legacy = localStorage.getItem('netherz_spaces');
            if (legacy) { try { nextSpaces = JSON.parse(legacy); } catch {} }
        }
        
        if (nextSpaces.length === 0) {
            nextSpaces = [{
                id: 'default',
                name: 'Playground',
                code: INITIAL_CODE,
                lastModified: Date.now()
            }];
        }

        setSpaces(nextSpaces);
        
        let nextActiveId = nextSpaces[0].id;
        if (savedActiveId && nextSpaces.find(s => s.id === savedActiveId)) {
            nextActiveId = savedActiveId;
        }

        setActiveSpaceId(nextActiveId);
        const activeSpace = nextSpaces.find(s => s.id === nextActiveId) || nextSpaces[0];
        setCode(activeSpace.code);
        setLogs([]);
        setTimeout(() => setSrcDoc(generateSrcDoc(activeSpace.code)), 100);
    }

  }, [user]);

  // Persistence Interval (Local & Cloud)
  useEffect(() => {
    const interval = setInterval(async () => {
      // 1. Save to Local Storage (Always)
      const { spaces: spacesKey, activeSpace: activeKey } = getStorageKeys(user?.id);
      localStorage.setItem(spacesKey, JSON.stringify(spacesRef.current));
      localStorage.setItem(activeKey, activeSpaceIdRef.current);
      setLastSaved(new Date());

      // 2. Save Active Space to Cloud (If User)
      // Note: We only save the active one to reduce writes, inactive ones shouldn't change
      if (user) {
        const currentSpace = spacesRef.current.find(s => s.id === activeSpaceIdRef.current);
        if (currentSpace) {
            setIsCloudSyncing(true);
            try {
                // In a real app we might debounce or check dirty flags, 
                // but for this request we ensure it's saved.
                await salvarEspacoRemoto(user.id, currentSpace);
            } catch (e) {
                console.error("Cloud save failed", e);
            } finally {
                setIsCloudSyncing(false);
            }
        }
      }
    }, 2500); // Slightly longer interval to be nice to Firestore

    return () => clearInterval(interval);
  }, [user]);

  // AUTH HANDLERS
  const handleLogout = async () => {
    try {
      await fazerLogout();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRun = useCallback(() => {
    setLogs([]); 
    setLogs(prev => [
      ...prev, 
      { id: 'sys-' + Date.now(), type: 'info', message: '--- Re-running Code ---', timestamp: new Date().toLocaleTimeString() }
    ]);
    setErrorLine(null); 
    const doc = generateSrcDoc(code);
    setSrcDoc(doc);
  }, [code]);

  const handleCodeChange = (value: string, tab: CodeTab) => {
    setCode(prev => ({ ...prev, [tab]: value }));
    if (tab === 'js') setErrorLine(null);
  };

  const handleClearLog = () => setLogs([]);

  const handleOpenClearModal = () => setIsClearModalOpen(true);

  const confirmClearCode = () => {
    setCode(prev => ({ ...prev, [activeTab]: '' }));
    setIsClearModalOpen(false);
  };

  // --- SPACE MANAGEMENT ---

  const handleSwitchSpace = (id: string) => {
    // Save previous active space to cloud before switching to be safe
    if (user) {
        const prevSpace = spaces.find(s => s.id === activeSpaceId);
        if (prevSpace) salvarEspacoRemoto(user.id, { ...prevSpace, code: code });
    }

    setSpaces(prevSpaces => prevSpaces.map(s => 
      s.id === activeSpaceId ? { ...s, code: code } : s
    ));

    const targetSpace = spaces.find(s => s.id === id);
    if (targetSpace) {
      setActiveSpaceId(id);
      setCode(targetSpace.code);
      setLogs([]);
      setTimeout(() => {
        const doc = generateSrcDoc(targetSpace.code);
        setSrcDoc(doc);
      }, 50); 
    }
  };

  const handleOpenCreateModal = () => {
    setNewSpaceName("New Project");
    setIsCreateModalOpen(true);
  };

  const confirmCreateSpace = async () => {
    const name = newSpaceName.trim() || "Untitled Project";
    
    const newSpace: Space = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      code: { html: '', css: '', js: '' }, 
      lastModified: Date.now()
    };
    
    setSpaces(prevSpaces => {
      const updatedList = prevSpaces.map(s => 
        s.id === activeSpaceId ? { ...s, code: code } : s
      );
      return [...updatedList, newSpace];
    });

    setActiveSpaceId(newSpace.id);
    setCode(newSpace.code);
    setLogs([]);
    setSrcDoc(''); 
    
    if (user) {
        await salvarEspacoRemoto(user.id, newSpace);
    }
    
    setIsCreateModalOpen(false);
  };

  const handleOpenRenameModal = () => {
    const current = spaces.find(s => s.id === activeSpaceId);
    if (current) {
        setRenameSpaceName(current.name);
        setIsRenameModalOpen(true);
    }
  };

  const confirmRenameSpace = () => {
     if (!renameSpaceName.trim()) return;
     
     const updatedSpaces = spaces.map(s => s.id === activeSpaceId ? { ...s, name: renameSpaceName.trim() } : s);
     setSpaces(updatedSpaces);
     
     if (user) {
         const updated = updatedSpaces.find(s => s.id === activeSpaceId);
         if (updated) salvarEspacoRemoto(user.id, updated);
     }

     setIsRenameModalOpen(false);
  };

  const handleOpenDeleteModal = () => {
     if (spaces.length <= 1) {
        window.alert("You cannot delete the only remaining space.");
        return;
     }
     setIsDeleteModalOpen(true);
  };

  const confirmDeleteSpace = async () => {
    const idToDelete = activeSpaceId;
    const remainingSpaces = spaces.filter(s => s.id !== idToDelete);
    setSpaces(remainingSpaces);
    
    // Switch to the first available one
    const fallbackSpace = remainingSpaces[0];
    if (fallbackSpace) {
      setActiveSpaceId(fallbackSpace.id);
      setCode(fallbackSpace.code);
      setLogs([]);
      setTimeout(() => {
         const doc = generateSrcDoc(fallbackSpace.code);
         setSrcDoc(doc);
      }, 50);
    }
    
    if (user) {
        await deletarEspacoRemoto(user.id, idToDelete);
    }

    setIsDeleteModalOpen(false);
  };

  const handleImportSpace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const fileName = file.name;
      const baseName = fileName.split('.')[0];
      
      let newCode = { ...INITIAL_CODE };

      if (fileName.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed.html === 'string') {
             newCode = parsed;
          } else {
             alert('Invalid JSON structure.'); return;
          }
        } catch (e) { alert('Invalid JSON file.'); return; }
      } else {
         // Logic for other files simplified for brevity, assumes text import
         newCode.html = `<!-- Imported ${fileName} -->`;
      }

      const newSpace: Space = {
        id: Math.random().toString(36).substr(2, 9),
        name: baseName || "Imported Project",
        code: newCode,
        lastModified: Date.now()
      };

      setSpaces(prev => {
         const updated = prev.map(s => s.id === activeSpaceId ? { ...s, code: code } : s);
         return [...updated, newSpace];
      });

      setActiveSpaceId(newSpace.id);
      setCode(newSpace.code);
      setTimeout(() => setSrcDoc(generateSrcDoc(newCode)), 50);
      
      if (user) {
        await salvarEspacoRemoto(user.id, newSpace);
      }
      
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleEditorFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     const reader = new FileReader();
     reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content !== 'string') return;
        // ... (Existing import logic remains same)
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.js')) {
            setCode(prev => ({ ...prev, js: content }));
            setActiveTab('js');
        } else if (fileName.endsWith('.css')) {
            setCode(prev => ({ ...prev, css: content }));
            setActiveTab('css');
        } else {
            setCode(prev => ({ ...prev, html: content }));
            setActiveTab('html');
        }
        e.target.value = '';
     };
     reader.readAsText(file);
  };

  // --- DOWNLOAD LOGIC ---
  const openDownloadModal = () => {
    const currentSpace = spaces.find(s => s.id === activeSpaceId);
    setDownloadName(currentSpace ? currentSpace.name : 'project');
    setIsDownloadModalOpen(true);
  };

  const performDownloadJson = () => {
    const finalName = downloadName.trim() || 'project';
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(code, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `${finalName}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setIsDownloadModalOpen(false);
  };

  const handleDownloadSingleHtml = () => {
     const finalName = downloadName.trim() || 'project';
     const { html, css, js } = code;
     
     // Check if user has written a full HTML structure
     const isFullDoc = html.toLowerCase().includes('<html');
     
     let finalContent = html;
     
     if (!isFullDoc) {
        // Wrap fragment in standard template
        finalContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${finalName}</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>
${js}
  </script>
</body>
</html>`;
     } else {
        // Attempt to inject CSS into head
        if (css.trim()) {
           if (finalContent.includes('</head>')) {
              finalContent = finalContent.replace('</head>', `<style>${css}</style>\n</head>`);
           } else {
              // Fallback if no head tag found but html exists
              finalContent = `<style>${css}</style>\n` + finalContent;
           }
        }
        
        // Attempt to inject JS before body close
        if (js.trim()) {
           if (finalContent.includes('</body>')) {
              finalContent = finalContent.replace('</body>', `<script>${js}</script>\n</body>`);
           } else {
              // Fallback
               finalContent = finalContent + `\n<script>${js}</script>`;
           }
        }
     }
     
     try {
       const blob = new Blob([finalContent], { type: 'text/html;charset=utf-8' });
       saveAs(blob, `${finalName}.html`);
       setIsDownloadModalOpen(false);
     } catch (e) {
       console.error("Download failed", e);
       alert("Failed to create file.");
     }
  };

  const exportarProjeto = () => {
     try {
        const zip = new JSZip();
        const finalName = downloadName.trim() || 'project';
        let htmlContent = code.html;
        if (!htmlContent.toLowerCase().includes('<html>')) {
            htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${finalName}</title><link rel="stylesheet" href="style.css"></head><body>${htmlContent}<script src="script.js"></script></body></html>`;
        }
        zip.file("index.html", htmlContent);
        zip.file("style.css", code.css);
        zip.file("script.js", code.js);
        zip.generateAsync({type:"blob"}).then(function(content: Blob) {
            saveAs(content, `${finalName}.zip`);
        });
        setIsDownloadModalOpen(false);
     } catch (e) {
        alert("Could not create zip file.");
     }
  };

  const handleThemeChange = (themeId: string) => {
    if (THEMES[themeId]) setEditorTheme(THEMES[themeId]);
  };

  return (
    <div className="relative flex flex-col min-h-screen w-full font-sans bg-gray-100 dark:bg-gray-950 transition-colors duration-500 overflow-x-hidden">
      
      {/* Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-400/30 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 animate-blob"></div>
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/30 dark:bg-indigo-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 animate-blob animation-delay-2000"></div>
         <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-pink-400/30 dark:bg-fuchsia-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full w-full">
        <Header 
          isDark={isDark} 
          toggleTheme={() => setIsDark(!isDark)}
          layout={layout}
          toggleLayout={() => setLayout(prev => prev === 'stacked' ? 'split' : 'stacked')}
          spaces={spaces}
          activeSpaceId={activeSpaceId}
          onSwitchSpace={handleSwitchSpace}
          onCreateSpace={handleOpenCreateModal}
          onRenameClick={handleOpenRenameModal}
          onDeleteClick={handleOpenDeleteModal}
          onImportSpace={handleImportSpace}
          user={user}
          onLoginClick={() => setIsAuthModalOpen(true)}
          onProfileClick={() => setIsProfileModalOpen(true)}
          currentThemeId={editorTheme.id}
          onThemeChange={handleThemeChange}
        />

        <main className={`flex-1 flex flex-col lg:flex-row gap-6 xl:gap-8 p-4 md:p-6 lg:p-8 xl:p-10 w-full max-w-[100vw]`}>
          <section className={`transition-all duration-500 ease-in-out flex flex-col ${
            layout === 'split' 
              ? 'flex-1 lg:w-1/2 lg:h-[calc(100vh-8.5rem)]' 
              : 'w-full h-[85vh] min-h-[600px] shrink-0'
          }`}>
            <Editor 
              code={code} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              onChange={handleCodeChange}
              onRun={handleRun}
              onClear={handleOpenClearModal}
              onDownload={openDownloadModal}
              onUpload={handleEditorFileImport}
              lastSaved={lastSaved}
              errorLine={errorLine}
              theme={editorTheme}
            />
          </section>

          <section className={`flex flex-col gap-6 xl:gap-8 transition-all duration-500 ease-in-out ${
            layout === 'split' 
              ? 'lg:w-1/2 lg:h-[calc(100vh-8.5rem)]' 
              : 'w-full min-h-[100vh] shrink-0'
          }`}>
            <div className="flex-1 min-h-[350px]">
              <Preview srcDoc={srcDoc} />
            </div>
            <div className="h-64 md:h-80 min-h-[250px]">
              <Console logs={logs} onClear={handleClearLog} />
            </div>
          </section>
        </main>
        
        <footer className="py-2 px-4 border-t border-white/10 bg-white/30 dark:bg-black/30 backdrop-blur-md shrink-0 flex justify-between items-center w-full">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
             {user ? (
                isCloudSyncing ? 
                <span className="flex items-center gap-1 text-nether-500 animate-pulse"><Cloud className="w-3 h-3" /> Syncing...</span> : 
                <span className="flex items-center gap-1"><Cloud className="w-3 h-3" /> Saved to Cloud</span>
             ) : (
                <span className="flex items-center gap-1 opacity-60"><CloudOff className="w-3 h-3" /> Local Mode</span>
             )}
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
             Developed with <Heart className="w-3 h-3 text-red-500 animate-pulse fill-red-500" /> by <span className="font-bold text-nether-600 dark:text-nether-400">Duck Team</span>
          </p>
        </footer>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={() => {}} />
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={user} 
        onLogout={handleLogout}
        projectCount={spaces.length}
      />
      
      {/* Modals with Enhanced UI */}
      
      <Modal 
        isOpen={isDownloadModalOpen} 
        onClose={() => setIsDownloadModalOpen(false)} 
        title="Download Project"
        description="Choose a format to save your code locally."
        icon={<Download className="w-6 h-6" />}
      >
        <div className="space-y-6">
             <div className="space-y-2">
               <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Filename</label>
               <input 
                  type="text" 
                  value={downloadName} 
                  onChange={(e) => setDownloadName(e.target.value)} 
                  className={SAFE_INPUT_CLASS} 
                  placeholder="my-awesome-project" 
                  autoFocus
               />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <button 
                  onClick={handleDownloadSingleHtml} 
                  className="group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-300"
                 >
                    <FileCode className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    <div className="text-center">
                      <span className="block text-sm font-bold text-gray-900 dark:text-white">HTML File</span>
                      <span className="text-[10px] text-gray-500 leading-tight block mt-0.5">Single file bundle</span>
                    </div>
                 </button>

                 <button 
                  onClick={exportarProjeto} 
                  className="group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-nether-500 dark:hover:border-nether-500 hover:bg-nether-50 dark:hover:bg-nether-500/10 transition-all duration-300"
                 >
                    <Archive className="w-8 h-8 text-gray-400 group-hover:text-nether-500 transition-colors" />
                    <div className="text-center">
                      <span className="block text-sm font-bold text-gray-900 dark:text-white">ZIP Package</span>
                      <span className="text-[10px] text-gray-500 leading-tight block mt-0.5">Full project folder</span>
                    </div>
                 </button>

                 <button 
                  onClick={performDownloadJson} 
                  className="group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all duration-300"
                 >
                    <FileJson className="w-8 h-8 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                    <div className="text-center">
                      <span className="block text-sm font-bold text-gray-900 dark:text-white">JSON</span>
                      <span className="text-[10px] text-gray-500 leading-tight block mt-0.5">Backup data</span>
                    </div>
                 </button>
             </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Create New Space" 
        description="Start a fresh playground for your next idea."
        icon={<FolderPlus className="w-6 h-6" />}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmCreateSpace}>Create Project</Button>
          </>
        }
      >
        <div className="space-y-4">
            <div className="space-y-2">
               <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Project Name</label>
               <input 
                  type="text" 
                  value={newSpaceName} 
                  onChange={(e) => setNewSpaceName(e.target.value)} 
                  className={SAFE_INPUT_CLASS} 
                  placeholder="e.g. Portfolio v2" 
                  autoFocus 
                  onKeyDown={(e) => e.key === 'Enter' && confirmCreateSpace()} 
              />
            </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isRenameModalOpen} 
        onClose={() => setIsRenameModalOpen(false)} 
        title="Rename Space" 
        description="Give your project a better name."
        icon={<Edit2 className="w-6 h-6" />}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmRenameSpace}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
            <input 
                type="text" 
                value={renameSpaceName} 
                onChange={(e) => setRenameSpaceName(e.target.value)} 
                className={SAFE_INPUT_CLASS} 
                autoFocus 
                onKeyDown={(e) => e.key === 'Enter' && confirmRenameSpace()} 
            />
        </div>
      </Modal>

      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Delete Space" 
        description="This action cannot be undone."
        icon={<AlertTriangle className="w-6 h-6" />}
        variant="danger"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmDeleteSpace} variant="danger" icon={<Trash2 className="w-4 h-4"/>}>Delete Project</Button>
          </>
        }
      >
         <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20 text-center">
            <p className="text-red-800 dark:text-red-200 font-medium">
              Are you sure you want to delete this space? All code and history will be permanently lost.
            </p>
         </div>
      </Modal>

      <Modal 
        isOpen={isClearModalOpen} 
        onClose={() => setIsClearModalOpen(false)} 
        title="Clear Code" 
        description="Reset this file to empty."
        icon={<Eraser className="w-6 h-6" />}
        variant="danger"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmClearCode} variant="danger">Clear Code</Button>
          </>
        }
      >
         <div className="text-gray-600 dark:text-gray-300">
           You are about to clear all code in the <span className="font-bold font-mono text-nether-600 dark:text-nether-400 uppercase">{activeTab}</span> tab.
         </div>
      </Modal>
    </div>
  );
}