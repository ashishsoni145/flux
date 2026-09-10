/**
 * FluxIDE Engine — Web Control Center Dashboard
 *
 * Provides a futuristic, high-aesthetic browser control center running
 * directly on top of fluxd.
 */

export function getDashboardHtml(port = 48100): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FluxIDE — AI Software Engineering Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #0a0d14;
      --bg-surface: #111622;
      --bg-card: rgba(22, 29, 44, 0.7);
      --bg-card-hover: rgba(30, 41, 62, 0.85);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-glow: rgba(0, 229, 255, 0.25);
      --accent-cyan: #00e5ff;
      --accent-purple: #7928ca;
      --accent-gradient: linear-gradient(135deg, #00e5ff 0%, #7928ca 100%);
      --accent-green: #10b981;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --font-ui: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-base);
      color: var(--text-main);
      font-family: var(--font-ui);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Top Navigation Bar */
    header {
      background: rgba(17, 22, 34, 0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      height: 58px;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 50;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }

    .brand-badge {
      background: var(--accent-gradient);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #fff;
      font-size: 1rem;
      box-shadow: 0 0 16px rgba(0, 229, 255, 0.4);
    }

    .brand-title span {
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--accent-green);
      padding: 4px 12px;
      border-radius: 9999px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--accent-green);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--accent-green);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    /* Main Workspace Layout */
    .app-container {
      display: flex;
      flex: 1;
      height: calc(100vh - 58px);
    }

    /* Sidebar Navigation */
    nav.sidebar {
      width: 240px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      padding: 16px 12px;
      gap: 6px;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      color: var(--text-muted);
      font-weight: 500;
      font-size: 0.95rem;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
    }

    .nav-btn:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-btn.active {
      color: #fff;
      background: rgba(0, 229, 255, 0.12);
      border-left: 3px solid var(--accent-cyan);
    }

    /* Tab Content Area */
    main.content-area {
      flex: 1;
      background: var(--bg-base);
      overflow-y: auto;
      padding: 24px;
      position: relative;
    }

    .view-pane {
      display: none;
      flex-direction: column;
      height: 100%;
      gap: 20px;
    }

    .view-pane.active {
      display: flex;
    }

    /* Card System */
    .card {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 20px;
      transition: border-color 0.2s;
    }

    .card:hover {
      border-color: var(--border-glow);
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Chat Pane */
    .chat-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      overflow: hidden;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .chat-msg {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .chat-msg.user {
      align-self: flex-end;
      background: var(--accent-gradient);
      color: #fff;
    }

    .chat-msg.assistant {
      align-self: flex-start;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
    }

    .chat-input-bar {
      border-top: 1px solid var(--border-subtle);
      padding: 14px 18px;
      background: rgba(17, 22, 34, 0.95);
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .mode-select {
      background: #0f172a;
      color: var(--accent-cyan);
      border: 1px solid var(--border-subtle);
      padding: 8px 12px;
      border-radius: 8px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      cursor: pointer;
    }

    .chat-input {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 10px 14px;
      color: #fff;
      font-family: var(--font-ui);
      font-size: 0.95rem;
      outline: none;
    }

    .chat-input:focus {
      border-color: var(--accent-cyan);
      box-shadow: 0 0 12px rgba(0, 229, 255, 0.2);
    }

    .send-btn {
      background: var(--accent-cyan);
      color: #0a0d14;
      font-weight: 700;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .send-btn:hover { opacity: 0.9; }

    /* Task Grid / Kanban */
    .task-columns {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      flex: 1;
    }

    .task-col {
      background: rgba(17, 22, 34, 0.5);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .task-col-header {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
    }

    .task-item {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .task-item-title { font-weight: 600; font-size: 0.95rem; }
    .task-item-agent {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--accent-cyan);
      background: rgba(0, 229, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      align-self: flex-start;
    }

    /* Grid cards for Metrics */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 800;
      font-family: var(--font-mono);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-badge">⚡</div>
      <div class="brand-title">Flux<span>IDE</span></div>
    </div>
    <div style="display: flex; align-items: center; gap: 16px;">
      <div class="status-pill">
        <div class="status-dot"></div>
        <span>fluxd connected (port ${port})</span>
      </div>
    </div>
  </header>

  <div class="app-container">
    <nav class="sidebar">
      <button class="nav-btn active" onclick="switchTab('chat')">💬 Agent Chat</button>
      <button class="nav-btn" onclick="switchTab('tasks')">📊 Task Graph</button>
      <button class="nav-btn" onclick="switchTab('brain')">🧠 Project Brain</button>
      <button class="nav-btn" onclick="switchTab('memory')">💾 Memory Vault</button>
      <button class="nav-btn" onclick="switchTab('health')">🛡️ Health & Security</button>
      <button class="nav-btn" onclick="switchTab('settings')">⚙️ Vault & Tools</button>
    </nav>

    <main class="content-area">
      <!-- 1. Chat Tab -->
      <div id="tab-chat" class="view-pane active">
        <div class="chat-container">
          <div id="chatMessages" class="chat-messages">
            <div class="chat-msg assistant">
              👋 <strong>Welcome to FluxIDE</strong> — AI Software Engineering Platform.<br/>
              How can I assist your engineering workflow today?
            </div>
          </div>
          <div class="chat-input-bar">
            <select id="modeSelect" class="mode-select">
              <option value="agent">AGENT MODE</option>
              <option value="plan">PLAN MODE</option>
              <option value="ask">ASK MODE</option>
              <option value="debug">DEBUG MODE</option>
              <option value="review">REVIEW MODE</option>
            </select>
            <input type="text" id="promptInput" class="chat-input" placeholder="Express engineering intent (e.g. 'Refactor task engine to support parallel file locks')..." onkeydown="if(event.key==='Enter') sendPrompt()" />
            <button class="send-btn" onclick="sendPrompt()">Run ↵</button>
          </div>
        </div>
      </div>

      <!-- 2. Tasks Tab -->
      <div id="tab-tasks" class="view-pane">
        <div class="card">
          <div class="card-title">Directed Acyclic Graph (DAG) Task Board</div>
          <div class="task-columns">
            <div class="task-col">
              <div class="task-col-header">Ready <span id="readyCount">0</span></div>
              <div id="readyList">
                <div class="task-item">
                  <div class="task-item-title">Analyze Architecture & File Mutex</div>
                  <div class="task-item-agent">@architect</div>
                </div>
              </div>
            </div>
            <div class="task-col">
              <div class="task-col-header">Running <span id="runningCount">0</span></div>
              <div id="runningList"></div>
            </div>
            <div class="task-col">
              <div class="task-col-header">Completed <span id="completedCount">1</span></div>
              <div id="completedList">
                <div class="task-item">
                  <div class="task-item-title">Verify Portable USB Environment</div>
                  <div class="task-item-agent">@devops_engineer</div>
                </div>
              </div>
            </div>
            <div class="task-col">
              <div class="task-col-header">Failed <span id="failedCount">0</span></div>
              <div id="failedList"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Brain Tab -->
      <div id="tab-brain" class="view-pane">
        <div class="card">
          <div class="card-title">Project Brain & Knowledge Graph</div>
          <p style="color: var(--text-muted); margin-bottom: 16px;">Synchronized with local AST indexer and graphify-out.</p>
          <div class="metric-grid">
            <div class="metric-card">
              <div style="color: var(--text-muted); font-size: 0.85rem;">TOTAL GRAPH NODES</div>
              <div class="metric-value" style="color: var(--accent-cyan);">510+</div>
            </div>
            <div class="metric-card">
              <div style="color: var(--text-muted); font-size: 0.85rem;">RELATIONSHIP EDGES</div>
              <div class="metric-value" style="color: var(--accent-purple);">990+</div>
            </div>
            <div class="metric-card">
              <div style="color: var(--text-muted); font-size: 0.85rem;">CODE COMMUNITIES</div>
              <div class="metric-value" style="color: var(--accent-green);">22</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Memory Tab -->
      <div id="tab-memory" class="view-pane">
        <div class="card">
          <div class="card-title">3-Tier Memory Hierarchy</div>
          <p style="color: var(--text-muted); margin-bottom: 16px;">Inspectable and editable persistent memories (.flux/memory/).</p>
          <div class="metric-grid">
            <div class="metric-card">
              <div style="color: var(--text-muted); font-size: 0.85rem;">USER MEMORIES</div>
              <div class="metric-value">Active</div>
            </div>
            <div class="metric-card">
              <div style="color: var(--text-muted); font-size: 0.85rem;">PROJECT MEMORIES</div>
              <div class="metric-value" style="color: var(--accent-cyan);">Enabled</div>
            </div>
            <div class="metric-card">
              <div style="color: var(--text-muted); font-size: 0.85rem;">TASK MEMORIES</div>
              <div class="metric-value" style="color: var(--accent-green);">Live</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Health Tab -->
      <div id="tab-health" class="view-pane">
        <div class="card">
          <div class="card-title">Evidence-Based Project Health & Security</div>
          <div class="metric-grid">
            <div class="metric-card">
              <div style="color: var(--text-muted); font-size: 0.85rem;">OVERALL HEALTH</div>
              <div class="metric-value" style="color: var(--accent-green);">94/100</div>
            </div>
            <div class="metric-card">
              <div style="color: var(--text-muted); font-size: 0.85rem;">SECRET LEAKS</div>
              <div class="metric-value" style="color: var(--accent-green);">0</div>
            </div>
            <div class="metric-card">
              <div style="color: var(--text-muted); font-size: 0.85rem;">TEST RUNNER</div>
              <div class="metric-value" style="color: var(--accent-cyan);">Vitest</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Settings Tab -->
      <div id="tab-settings" class="view-pane">
        <div class="card">
          <div class="card-title">BYOK Encrypted Vault & Model Gateway</div>
          <p style="color: var(--text-muted); margin-bottom: 16px;">Configured with AES-256-GCM encryption on USB (.flux/vault.enc).</p>
          <div class="metric-grid">
            <div class="metric-card">
              <div style="color: var(--text-muted); font-size: 0.85rem;">VAULT STATUS</div>
              <div class="metric-value" style="color: var(--accent-cyan);">Initialized</div>
            </div>
            <div class="metric-card">
              <div style="color: var(--text-muted); font-size: 0.85rem;">REGISTERED TOOLS</div>
              <div class="metric-value">14+ Tools</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    let ws;
    function connectWs() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || '127.0.0.1';
      const wsUrl = protocol + '//' + host + ':${port}';
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to fluxd');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleMessage(msg);
        } catch (e) {
          console.error(e);
        }
      };

      ws.onclose = () => {
        setTimeout(connectWs, 2000);
      };
    }

    function handleMessage(msg) {
      if (msg.type === 'stream:chunk' && msg.payload.type === 'text_delta') {
        const msgs = document.getElementById('chatMessages');
        let last = msgs.lastElementChild;
        if (!last || !last.classList.contains('assistant-streaming')) {
          last = document.createElement('div');
          last.className = 'chat-msg assistant assistant-streaming';
          msgs.appendChild(last);
        }
        last.textContent += msg.payload.text;
        msgs.scrollTop = msgs.scrollHeight;
      } else if (msg.type === 'stream:chunk' && msg.payload.type === 'done') {
        const last = document.querySelector('.assistant-streaming');
        if (last) last.classList.remove('assistant-streaming');
      }
    }

    function sendPrompt() {
      const input = document.getElementById('promptInput');
      const text = input.value.trim();
      if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

      const msgs = document.getElementById('chatMessages');
      const userMsg = document.createElement('div');
      userMsg.className = 'chat-msg user';
      userMsg.textContent = text;
      msgs.appendChild(userMsg);
      input.value = '';

      const mode = document.getElementById('modeSelect').value;
      ws.send(JSON.stringify({
        id: 'msg_' + Date.now(),
        type: 'user:prompt',
        payload: {
          content: text,
          mode: mode
        },
        timestamp: new Date().toISOString()
      }));
    }

    function switchTab(tabName) {
      document.querySelectorAll('.view-pane').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

      const target = document.getElementById('tab-' + tabName);
      if (target) target.classList.add('active');

      const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.textContent.toLowerCase().includes(tabName));
      if (btn) btn.classList.add('active');
    }

    window.onload = connectWs;
  </script>
</body>
</html>`;
}
