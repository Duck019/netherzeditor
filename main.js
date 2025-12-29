import { highlightCode } from './editorThemes.js';
import { generateSrcDoc } from './codeRunner.js';
import { monitorarEstadoAuth, criarConta, fazerLogin, fazerLogout } from './auth.js';
import { carregarEspacosRemotos, salvarEspacoRemoto, deletarEspacoRemoto, salvarMuitosEspacos } from './db.js';

// --- INITIAL DATA ---
const INITIAL_CODE = {
  html: `<div class="container">\n  <h1>Netherz</h1>\n  <button id="btn">Click Me</button>\n</div>`,
  css: `body {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  font-family: sans-serif;\n  background: #f0f0f0;\n}\nh1 { color: #7c3aed; }`,
  js: `console.log("Welcome!");\ndocument.getElementById('btn').onclick = () => {\n  console.log("Clicked!");\n  alert("Hello World");\n};`
};

// --- STATE ---
const state = {
  user: null,
  spaces: [],
  activeSpaceId: 'default',
  activeTab: 'html',
  isAuthLoginMode: true
};

// --- DOM ELEMENTS ---
const el = {
  codeInput: document.getElementById('code-input'),
  codeHighlight: document.getElementById('code-highlight'),
  lineNumbers: document.getElementById('line-numbers'),
  previewFrame: document.getElementById('preview-frame'),
  consoleOutput: document.getElementById('console-output'),
  spaceSelect: document.getElementById('space-select'),
  tabs: document.querySelectorAll('.tab-btn'),
  statusChars: document.getElementById('status-chars'),
  statusSaved: document.getElementById('status-saved'),
  // Auth
  authModal: document.getElementById('auth-modal'),
  authTitle: document.getElementById('auth-title'),
  authEmail: document.getElementById('auth-email'),
  authPass: document.getElementById('auth-password'),
  authNameGroup: document.getElementById('auth-name-group'),
  authName: document.getElementById('auth-name'),
  authSubmitBtn: document.getElementById('btn-submit-auth'),
  authToggleBtn: document.getElementById('btn-toggle-auth-mode'),
  authSection: document.getElementById('auth-section'),
  userSection: document.getElementById('user-section'),
  userName: document.getElementById('user-name'),
  userAvatar: document.getElementById('user-avatar'),
};

// --- APP INITIALIZATION ---
function init() {
  // Initialize Icons
  if (window.lucide) window.lucide.createIcons();
  
  // Load Local Data (Guest)
  loadLocalSpaces();

  // Listeners
  setupEventListeners();
  
  // Auth Monitor
  monitorarEstadoAuth(async (user) => {
    state.user = user;
    updateAuthUI();
    
    if (user) {
      const remoteSpaces = await carregarEspacosRemotos(user.id);
      if (remoteSpaces.length > 0) {
        state.spaces = remoteSpaces;
        state.activeSpaceId = remoteSpaces[0].id;
      } else {
        // Migration: Save current local spaces to cloud
        await salvarMuitosEspacos(user.id, state.spaces);
      }
    } else {
      // Revert to local
      loadLocalSpaces();
    }
    renderSpaces();
    renderEditor();
  });
}

// --- CORE FUNCTIONS ---

function getActiveSpace() {
  return state.spaces.find(s => s.id === state.activeSpaceId) || state.spaces[0];
}

function loadLocalSpaces() {
  const saved = localStorage.getItem('netherz_spaces_guest');
  if (saved) {
    state.spaces = JSON.parse(saved);
    state.activeSpaceId = localStorage.getItem('netherz_active_id_guest') || state.spaces[0].id;
  } else {
    state.spaces = [{ id: 'default', name: 'Playground', code: { ...INITIAL_CODE }, lastModified: Date.now() }];
    state.activeSpaceId = 'default';
  }
}

function save() {
  const space = getActiveSpace();
  space.lastModified = Date.now();

  // Local Storage
  if (!state.user) {
    localStorage.setItem('netherz_spaces_guest', JSON.stringify(state.spaces));
    localStorage.setItem('netherz_active_id_guest', state.activeSpaceId);
  } else {
    // Cloud Save (Debounced in real app, direct here)
    salvarEspacoRemoto(state.user.id, space);
  }
  
  el.statusSaved.innerText = `Saved: ${new Date().toLocaleTimeString()}`;
}

// --- UI RENDERING ---

function renderSpaces() {
  el.spaceSelect.innerHTML = '';
  state.spaces.forEach(space => {
    const opt = document.createElement('option');
    opt.value = space.id;
    opt.innerText = space.name;
    opt.className = "bg-gray-900 text-white"; // Styling for dropdown options
    if (space.id === state.activeSpaceId) opt.selected = true;
    el.spaceSelect.appendChild(opt);
  });
}

function renderEditor() {
  const space = getActiveSpace();
  const code = space.code[state.activeTab];
  
  el.codeInput.value = code;
  updateHighlight(code);
  updateLineNumbers(code);
  el.statusChars.innerText = `${code.length} chars`;
  
  // Highlight Active Tab
  el.tabs.forEach(btn => {
    if (btn.dataset.tab === state.activeTab) {
      btn.classList.add('bg-white', 'dark:bg-white/10', 'shadow-lg', 'scale-105');
      btn.classList.remove('hover:bg-white/5');
    } else {
      btn.classList.remove('bg-white', 'dark:bg-white/10', 'shadow-lg', 'scale-105');
      btn.classList.add('hover:bg-white/5');
    }
  });
}

function updateHighlight(code) {
  el.codeHighlight.innerHTML = highlightCode(code, state.activeTab) + '<br>';
}

function updateLineNumbers(code) {
  const lines = code.split('\n').length;
  el.lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => `<div>${i + 1}</div>`).join('');
}

function runCode() {
  const space = getActiveSpace();
  const srcDoc = generateSrcDoc(space.code);
  el.consoleOutput.innerHTML = ''; // Clear console
  el.previewFrame.srcdoc = srcDoc;
}

// --- EVENT LISTENERS ---

function setupEventListeners() {
  // Tabs
  el.tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.tab;
      renderEditor();
    });
  });

  // Editor Input
  el.codeInput.addEventListener('input', (e) => {
    const val = e.target.value;
    const space = getActiveSpace();
    space.code[state.activeTab] = val;
    
    updateHighlight(val);
    updateLineNumbers(val);
    el.statusChars.innerText = `${val.length} chars`;
    save(); // Trigger save
  });

  // Editor Scroll Sync
  el.codeInput.addEventListener('scroll', () => {
    el.codeHighlight.scrollTop = el.codeInput.scrollTop;
    el.codeHighlight.scrollLeft = el.codeInput.scrollLeft;
    el.lineNumbers.scrollTop = el.codeInput.scrollTop;
  });

  // Editor Tab Key
  el.codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = el.codeInput.selectionStart;
      const end = el.codeInput.selectionEnd;
      const val = el.codeInput.value;
      el.codeInput.value = val.substring(0, start) + "  " + val.substring(end);
      el.codeInput.selectionStart = el.codeInput.selectionEnd = start + 2;
      // Trigger input event manually to update highlight
      el.codeInput.dispatchEvent(new Event('input'));
    }
  });

  // Run Button
  document.getElementById('btn-run').addEventListener('click', runCode);
  document.getElementById('btn-refresh').addEventListener('click', runCode);

  // Space Management
  el.spaceSelect.addEventListener('change', (e) => {
    state.activeSpaceId = e.target.value;
    renderEditor();
    runCode();
  });

  document.getElementById('btn-new-space').addEventListener('click', async () => {
    const name = prompt("Project Name:", "New Project");
    if (!name) return;
    const newSpace = { 
      id: Math.random().toString(36).substr(2, 9), 
      name, 
      code: { html: '', css: '', js: '' }, 
      lastModified: Date.now() 
    };
    state.spaces.push(newSpace);
    state.activeSpaceId = newSpace.id;
    save();
    renderSpaces();
    renderEditor();
  });

  document.getElementById('btn-delete-space').addEventListener('click', async () => {
    if (state.spaces.length <= 1) return alert("Cannot delete last space");
    if (!confirm("Delete this project?")) return;
    
    const idToDelete = state.activeSpaceId;
    state.spaces = state.spaces.filter(s => s.id !== idToDelete);
    state.activeSpaceId = state.spaces[0].id;
    
    if (state.user) await deletarEspacoRemoto(state.user.id, idToDelete);
    else save(); // Local save

    renderSpaces();
    renderEditor();
  });

  // Console Logic (Message from Iframe)
  window.addEventListener('message', (event) => {
    if (event.data.source === 'netherz-iframe') {
      const { type, message } = event.data;
      const div = document.createElement('div');
      div.className = `p-1 border-b border-white/5 font-mono break-all ${type === 'error' ? 'text-red-400' : 'text-gray-300'}`;
      div.innerText = `> ${message}`;
      el.consoleOutput.appendChild(div);
      el.consoleOutput.scrollTop = el.consoleOutput.scrollHeight;
    }
  });

  document.getElementById('btn-clear-console').addEventListener('click', () => {
    el.consoleOutput.innerHTML = '';
  });

  // Auth Modals
  document.getElementById('btn-login-modal').addEventListener('click', () => {
    el.authModal.classList.remove('hidden');
  });
  document.getElementById('btn-close-auth').addEventListener('click', () => {
    el.authModal.classList.add('hidden');
  });

  el.authToggleBtn.addEventListener('click', () => {
    state.isAuthLoginMode = !state.isAuthLoginMode;
    el.authTitle.innerText = state.isAuthLoginMode ? 'Login' : 'Create Account';
    el.authSubmitBtn.innerText = state.isAuthLoginMode ? 'Sign In' : 'Sign Up';
    el.authNameGroup.className = state.isAuthLoginMode ? 'hidden' : 'block';
    el.authToggleBtn.innerText = state.isAuthLoginMode ? 'Create an account instead' : 'Already have an account?';
  });

  el.authSubmitBtn.addEventListener('click', async () => {
    const email = el.authEmail.value;
    const pass = el.authPass.value;
    const name = el.authName.value;

    try {
      if (state.isAuthLoginMode) {
        await fazerLogin(email, pass);
      } else {
        await criarConta(email, pass, name);
      }
      el.authModal.classList.add('hidden');
    } catch (e) {
      alert(e.message);
    }
  });

  document.getElementById('btn-profile').addEventListener('click', async () => {
    if(confirm("Logout?")) {
      await fazerLogout();
    }
  });
}

function updateAuthUI() {
  if (state.user) {
    el.authSection.classList.add('hidden');
    el.userSection.classList.remove('hidden');
    el.userName.innerText = state.user.name;
    el.userAvatar.src = state.user.avatar;
  } else {
    el.authSection.classList.remove('hidden');
    el.userSection.classList.add('hidden');
  }
}

// Start
init();
