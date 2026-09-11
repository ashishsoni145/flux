/**
 * FluxIDE Engine — Official Website & Download Portal
 *
 * Implements Section 53 (Website) and Section 54 (Download Center).
 * Serves routes:
 *   /portal, /download, /docs, /pricing, /changelog, /extensions
 */

export function getWebsiteHtml(route = "download", port = 48100): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FluxIDE — The AI Software Engineering Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #0a0d14;
      --bg-surface: #10141f;
      --bg-card: rgba(19, 24, 38, 0.75);
      --bg-card-hover: rgba(28, 36, 56, 0.9);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-glow: rgba(0, 229, 255, 0.3);
      --accent-cyan: #00e5ff;
      --accent-purple: #7928ca;
      --accent-green: #10b981;
      --accent-amber: #f59e0b;
      --accent-gradient: linear-gradient(135deg, #00e5ff 0%, #7928ca 100%);
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
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }

    /* Ambient glow */
    .ambient-glow {
      position: fixed;
      top: -200px;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 500px;
      background: radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, rgba(121, 40, 202, 0.08) 50%, transparent 70%);
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
    }

    header {
      position: sticky;
      top: 0;
      background: rgba(10, 13, 20, 0.8);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 36px;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 800;
      font-size: 1.3rem;
      text-decoration: none;
      color: var(--text-main);
    }

    .brand-badge {
      background: var(--accent-gradient);
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #fff;
      box-shadow: 0 0 16px rgba(0, 229, 255, 0.4);
    }

    .brand-title span {
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    nav.nav-links {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .nav-link {
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
      cursor: pointer;
      transition: color 0.15s;
    }

    .nav-link:hover, .nav-link.active {
      color: #fff;
    }

    .cta-btn {
      background: var(--accent-gradient);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 8px 18px;
      font-family: var(--font-ui);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 4px 14px rgba(0, 229, 255, 0.25);
    }

    .cta-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0, 229, 255, 0.4);
    }

    main.content {
      flex: 1;
      max-width: 1200px;
      margin: 0 auto;
      padding: 48px 24px;
      width: 100%;
      z-index: 1;
    }

    .section-pane {
      display: none;
      flex-direction: column;
      gap: 40px;
      animation: fadeIn 0.2s ease-in-out;
    }

    .section-pane.active {
      display: flex;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Hero */
    .hero {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 32px 0;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 229, 255, 0.1);
      border: 1px solid rgba(0, 229, 255, 0.25);
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 0.85rem;
      color: var(--accent-cyan);
      font-family: var(--font-mono);
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }

    .hero-title span {
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: var(--text-muted);
      max-width: 760px;
      line-height: 1.6;
    }

    /* Download Box */
    .download-card {
      background: var(--bg-card);
      border: 1px solid var(--border-glow);
      border-radius: 16px;
      padding: 36px;
      backdrop-filter: blur(16px);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      margin: 0 auto;
      max-width: 680px;
      width: 100%;
    }

    .detected-os {
      font-size: 1.1rem;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-download-primary {
      background: var(--accent-gradient);
      color: #fff;
      font-size: 1.15rem;
      font-weight: 700;
      padding: 16px 36px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 24px rgba(0, 229, 255, 0.35);
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn-download-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(0, 229, 255, 0.5);
    }

    .download-matrix {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      width: 100%;
      margin-top: 20px;
    }

    .os-option {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-decoration: none;
      color: var(--text-main);
      transition: all 0.15s;
    }

    .os-option:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: var(--accent-cyan);
    }

    .os-name { font-weight: 600; font-size: 0.95rem; }
    .os-file { font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-muted); }

    /* Pricing Cards */
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      width: 100%;
    }

    .pricing-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      position: relative;
    }

    .pricing-card.featured {
      border-color: var(--accent-cyan);
      box-shadow: 0 0 32px rgba(0, 229, 255, 0.15);
    }

    .plan-badge {
      position: absolute;
      top: -12px;
      right: 24px;
      background: var(--accent-gradient);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .plan-price {
      font-size: 2.5rem;
      font-weight: 900;
      font-family: var(--font-mono);
    }

    .plan-features {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-size: 0.95rem;
      color: var(--text-muted);
    }

    .plan-features li {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .plan-features li::before {
      content: "✓";
      color: var(--accent-green);
      font-weight: 800;
    }

    /* Core Loop Steps */
    .loop-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin: 24px 0;
    }

    .loop-step {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 16px 12px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .loop-step-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(0, 229, 255, 0.15);
      color: var(--accent-cyan);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }

    .loop-step-title {
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    footer {
      border-top: 1px solid var(--border-subtle);
      padding: 24px 36px;
      font-size: 0.85rem;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-surface);
      z-index: 10;
    }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>

  <header>
    <a href="/portal" class="brand">
      <div class="brand-badge">⚡</div>
      <div class="brand-title">Flux<span>IDE</span></div>
    </a>
    <nav class="nav-links">
      <span class="nav-link active" onclick="showRoute('download')">Downloads</span>
      <span class="nav-link" onclick="showRoute('docs')">Documentation</span>
      <span class="nav-link" onclick="showRoute('pricing')">Pricing</span>
      <span class="nav-link" onclick="showRoute('changelog')">Changelog</span>
      <span class="nav-link" onclick="showRoute('extensions')">Extensions</span>
      <a href="/desktop" class="cta-btn">Open Desktop IDE ↗</a>
    </nav>
  </header>

  <main class="content">
    <!-- 1. Download Route (Section 54) -->
    <div id="pane-download" class="section-pane active">
      <div class="hero">
        <div class="hero-badge">RELEASE v0.1.0 — PRODUCTION READY</div>
        <h1 class="hero-title">Plan. Execute. Verify. <span>Prove.</span></h1>
        <p class="hero-subtitle">
          An AI-native software engineering development platform based on VS Code OSS.
          It doesn't just write code — it autonomously plans, executes, verifies, reviews, and proves the work.
        </p>
      </div>

      <div class="download-card">
        <div class="detected-os" id="detectedOs">
          💻 Detected System: <strong>Windows x64</strong>
        </div>
        <a href="/FluxIDE.exe" class="btn-download-primary" id="primaryDownloadBtn" download>
          ⚡ Download FluxIDE for Windows (x64)
        </a>
        <div style="font-size:0.85rem; color:var(--text-muted);">
          Also includes one-click portable runner: <code>FluxIDE-Desktop.bat</code>
        </div>

        <div style="width:100%; border-top:1px solid var(--border-subtle); padding-top:20px; margin-top:8px;">
          <div style="font-size:0.9rem; font-weight:600; text-align:left; margin-bottom:12px; color:var(--text-muted);">
            Other Platform Builds:
          </div>
          <div class="download-matrix">
            <a href="/FluxIDE.exe" class="os-option">
              <span class="os-name">🪟 Windows x64</span>
              <span class="os-file">FluxIDE-Setup.exe / .bat</span>
            </a>
            <div class="os-option">
              <span class="os-name">🍎 macOS Apple Silicon</span>
              <span class="os-file">FluxIDE-arm64.dmg</span>
            </div>
            <div class="os-option">
              <span class="os-name">🍎 macOS Intel</span>
              <span class="os-file">FluxIDE-x64.dmg</span>
            </div>
            <div class="os-option">
              <span class="os-name">🐧 Linux x64</span>
              <span class="os-file">fluxide_0.1.0_amd64.deb</span>
            </div>
            <div class="os-option">
              <span class="os-name">⌨️ Standalone CLI</span>
              <span class="os-file">npm install -g @fluxide/cli</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Documentation Route (Section 53 & Section 1) -->
    <div id="pane-docs" class="section-pane">
      <div class="hero" style="padding-bottom:10px;">
        <h2 class="hero-title" style="font-size:2.5rem;">The Autonomous <span>Engineering Loop</span></h2>
        <p class="hero-subtitle">
          FluxIDE executes tasks through an 8-stage verification pipeline to guarantee safety, quality, and evidence.
        </p>
      </div>

      <div class="loop-grid">
        <div class="loop-step"><div class="loop-step-num">1</div><div class="loop-step-title">UNDERSTAND</div></div>
        <div class="loop-step"><div class="loop-step-num">2</div><div class="loop-step-title">PLAN</div></div>
        <div class="loop-step"><div class="loop-step-num">3</div><div class="loop-step-title">IMPLEMENT</div></div>
        <div class="loop-step"><div class="loop-step-num">4</div><div class="loop-step-title">RUN</div></div>
        <div class="loop-step"><div class="loop-step-num">5</div><div class="loop-step-title">VERIFY</div></div>
        <div class="loop-step"><div class="loop-step-num">6</div><div class="loop-step-title">REVIEW</div></div>
        <div class="loop-step"><div class="loop-step-num">7</div><div class="loop-step-title">FIX</div></div>
        <div class="loop-step"><div class="loop-step-num">8</div><div class="loop-step-title">PROVE</div></div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:12px; padding:24px;">
          <h3 style="color:var(--accent-cyan); margin-bottom:8px;">1. Proof of Work (PoW)</h3>
          <p style="color:var(--text-muted); font-size:0.95rem; line-height:1.6;">
            Every agent task produces an evidence-based completion report with files modified, tests executed,
            confidence scores, and remaining risks — never just "Done."
          </p>
        </div>
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:12px; padding:24px;">
          <h3 style="color:var(--accent-purple); margin-bottom:8px;">2. AI Checkpoints & Rollback</h3>
          <p style="color:var(--text-muted); font-size:0.95rem; line-height:1.6;">
            Lightweight git-stash snapshots before any code modification allow zero-friction preview, acceptance,
            or instant one-click rollback of all agent changes.
          </p>
        </div>
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:12px; padding:24px;">
          <h3 style="color:var(--accent-green); margin-bottom:8px;">3. Project Brain & Graphify</h3>
          <p style="color:var(--text-muted); font-size:0.95rem; line-height:1.6;">
            Living AST knowledge graph indexing symbols, functions, calls, dependencies, and architecture relationships
            for sub-second precision context assembly.
          </p>
        </div>
      </div>
    </div>

    <!-- 3. Pricing Route (Section 7, 8, 9) -->
    <div id="pane-pricing" class="section-pane">
      <div class="hero" style="padding-bottom:10px;">
        <h2 class="hero-title" style="font-size:2.5rem;">Transparent <span>AI Credits</span></h2>
        <p class="hero-subtitle">
          Use the built-in free AI tier out of the box, or bring your own API keys via the encrypted vault.
        </p>
      </div>

      <div class="pricing-grid">
        <div class="pricing-card">
          <h3>FluxIDE Free</h3>
          <div class="plan-price">$0<span style="font-size:1rem; color:var(--text-muted);">/mo</span></div>
          <p style="color:var(--text-muted); font-size:0.9rem;">Ideal for individuals and students getting started.</p>
          <ul class="plan-features">
            <li>100,000 monthly credits</li>
            <li>Free AI routing (Ollama local + fast models)</li>
            <li>Standard agent loop & planning</li>
            <li>Project Brain AST indexing</li>
            <li>Zero API key setup required</li>
          </ul>
        </div>

        <div class="pricing-card featured">
          <div class="plan-badge">POPULAR</div>
          <h3 style="color:var(--accent-cyan);">FluxIDE Pro</h3>
          <div class="plan-price">$20<span style="font-size:1rem; color:var(--text-muted);">/mo</span></div>
          <p style="color:var(--text-muted); font-size:0.9rem;">For professional software engineers and full-time coders.</p>
          <ul class="plan-features">
            <li>10,000,000 monthly credits</li>
            <li>Claude 3.7 Sonnet & GPT-4o access</li>
            <li>Engineering Council multi-agent debates</li>
            <li>Full SAST security scanning</li>
            <li>Automated self-healing diagnostics</li>
            <li>Unlimited local BYOK usage</li>
          </ul>
        </div>

        <div class="pricing-card">
          <h3>FluxIDE Max</h3>
          <div class="plan-price">$50<span style="font-size:1rem; color:var(--text-muted);">/mo</span></div>
          <p style="color:var(--text-muted); font-size:0.9rem;">For team leads and mission-critical architectural workloads.</p>
          <ul class="plan-features">
            <li>30,000,000 monthly credits</li>
            <li>Long-running autonomous agent workloads</li>
            <li>Highest priority inference routing</li>
            <li>Deep research & visual debugging</li>
            <li>Unlimited checkpoints & rollback</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 4. Changelog Route -->
    <div id="pane-changelog" class="section-pane">
      <div class="hero" style="padding-bottom:10px;">
        <h2 class="hero-title" style="font-size:2.5rem;">Release <span>Changelog</span></h2>
      </div>
      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:12px; padding:32px; display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <h3 style="font-size:1.2rem; color:var(--accent-cyan);">v0.1.0 — Initial Master Release</h3>
          <span style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-muted);">Current Active Build</span>
        </div>
        <ul style="list-style:disc; margin-left:24px; display:flex; flex-direction:column; gap:8px; color:var(--text-muted); font-size:0.95rem;">
          <li>Full 5-package monorepo architecture (@fluxide/protocol, model-gateway, engine, cli, desktop).</li>
          <li>Monaco-powered dark glassmorphism Desktop IDE with Activity Bar, Sidebar, and AI Dock.</li>
          <li>Universal Tool Runtime with 24+ built-in engineering, terminal, git, and browser agent tools.</li>
          <li>Self-healing verification loop with automatic TypeScript TS-error diagnosis and repair suggestions.</li>
          <li>Project Brain AST knowledge graph ingestion with Graphify integration (839 nodes, 1547 edges).</li>
          <li>BYOK Encrypted Vault with AES-256-GCM hardware-backed key protection.</li>
        </ul>
      </div>
    </div>

    <!-- 5. Extensions Route -->
    <div id="pane-extensions" class="section-pane">
      <div class="hero" style="padding-bottom:10px;">
        <h2 class="hero-title" style="font-size:2.5rem;">MCP & Extension <span>Directory</span></h2>
        <p class="hero-subtitle">Model Context Protocol (MCP) servers and external engineering tools.</p>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:12px; padding:24px;">
          <h4>🐙 GitHub MCP Server</h4>
          <p style="color:var(--text-muted); font-size:0.88rem; margin:8px 0 16px;">Issues, pull requests, commits, and actions integration.</p>
          <span style="color:var(--accent-green); font-size:0.8rem; font-family:var(--font-mono);">Installed & Active</span>
        </div>
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:12px; padding:24px;">
          <h4>🐘 PostgreSQL MCP Server</h4>
          <p style="color:var(--text-muted); font-size:0.88rem; margin:8px 0 16px;">Direct schema inspection and safe query execution gateway.</p>
          <span style="color:var(--accent-green); font-size:0.8rem; font-family:var(--font-mono);">Installed & Active</span>
        </div>
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:12px; padding:24px;">
          <h4>🌐 Web Search & Fetch MCP</h4>
          <p style="color:var(--text-muted); font-size:0.88rem; margin:8px 0 16px;">Live web search and documentation retrieval tool.</p>
          <span style="color:var(--accent-green); font-size:0.8rem; font-family:var(--font-mono);">Installed & Active</span>
        </div>
      </div>
    </div>
  </main>

  <footer>
    <div>⚡ FluxIDE Platform — Autonomous AI Software Engineering</div>
    <div style="font-family:var(--font-mono); font-size:0.75rem;">fluxd core daemon: active on port ${port}</div>
  </footer>

  <script>
    // Live OS & Arch detection (Section 54)
    function detectPlatform() {
      const ua = navigator.userAgent;
      const osEl = document.getElementById("detectedOs");
      const btn = document.getElementById("primaryDownloadBtn");
      if (!osEl || !btn) return;

      if (ua.includes("Win")) {
        osEl.innerHTML = "💻 Detected System: <strong>Windows x64</strong>";
        btn.textContent = "⚡ Download FluxIDE for Windows (x64)";
        btn.href = "/FluxIDE.exe";
      } else if (ua.includes("Mac")) {
        const isArm = ua.includes("ARM") || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
        osEl.innerHTML = "💻 Detected System: <strong>macOS " + (isArm ? "Apple Silicon" : "Intel") + "</strong>";
        btn.textContent = "⚡ Download FluxIDE for macOS";
        btn.href = "#";
      } else if (ua.includes("Linux")) {
        osEl.innerHTML = "💻 Detected System: <strong>Linux x64</strong>";
        btn.textContent = "⚡ Download FluxIDE (.deb / AppImage)";
        btn.href = "#";
      }
    }

    function showRoute(route) {
      document.querySelectorAll(".section-pane").forEach(p => p.classList.remove("active"));
      document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));

      const targetPane = document.getElementById("pane-" + route);
      if (targetPane) targetPane.classList.add("active");

      const navLinks = document.querySelectorAll(".nav-link");
      navLinks.forEach(l => {
        if (l.textContent.toLowerCase().includes(route)) l.classList.add("active");
      });
      window.history.pushState(null, "", "/" + route);
    }

    detectPlatform();
    const currentPath = window.location.pathname.replace(/^\\//, "");
    if (["download", "docs", "pricing", "changelog", "extensions"].includes(currentPath)) {
      showRoute(currentPath);
    }
  </script>
</body>
</html>`;
}
