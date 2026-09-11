/**
 * FluxIDE Engine — Browser Agent & Visual Debugging Tools
 *
 * Provides the currently available safe web-inspection subset. It retrieves
 * documents and derives DOM/layout hints; it does not claim to drive a real
 * browser or capture pixels until a browser runtime is configured.
 */

export interface BrowserSessionState {
  currentUrl: string;
  statusCode: number;
  title: string;
  htmlContent: string;
  navigatedAt: string;
  viewport: { width: number; height: number };
}

let activeSession: BrowserSessionState | null = null;

/**
 * Navigate browser agent to a URL.
 */
export async function browserNavigate(input: {
  url: string;
  timeoutMs?: number;
}): Promise<string> {
  const { url, timeoutMs = 15000 } = input;

  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    throw new Error(`Invalid URL "${url}". Must start with http:// or https://`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "FluxIDE-BrowserAgent/0.1.0 (Desktop; VisualDebugger)",
        Accept: "text/html,application/xhtml+xml,application/json,*/*",
      },
    });

    clearTimeout(timer);
    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1]?.trim() ?? "Untitled" : "Untitled";

    activeSession = {
      currentUrl: url,
      statusCode: response.status,
      title,
      htmlContent: html,
      navigatedAt: new Date().toISOString(),
      viewport: { width: 1440, height: 900 },
    };

    return JSON.stringify(
      {
        status: "success",
        url,
        statusCode: response.status,
        title,
        contentLength: html.length,
        timestamp: activeSession.navigatedAt,
        summary: `Navigated to ${url} [Status ${response.status} "${response.statusText}"]: Title "${title}" (${html.length} bytes HTML)`,
      },
      null,
      2
    );
  } catch (error) {
    clearTimeout(timer);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Browser navigation failed for ${url}: ${message}`);
  }
}

/**
 * Inspect DOM structure and CSS styling of currently loaded page.
 */
export async function browserInspectDom(input: {
  selector?: string;
  depth?: number;
}): Promise<string> {
  if (!activeSession) {
    return JSON.stringify({
      error: "No active browser session. Call browser_navigate first.",
      elements: [],
    });
  }

  const { selector = "body", depth = 3 } = input;
  const html = activeSession.htmlContent;

  // Extract elements matching basic selector
  const elementRegex = /<([a-zA-Z0-9-]+)([^>]*)>([\s\S]*?)<\/\1>/gi;
  const matches: Array<{
    tag: string;
    id?: string;
    className?: string;
    attributes: Record<string, string>;
    textSnippet: string;
  }> = [];

  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = elementRegex.exec(html)) !== null && count < 25) {
    const tag = match[1]?.toLowerCase() ?? "";
    if (["script", "style", "head", "meta", "link"].includes(tag)) continue;

    const rawAttrs = match[2] ?? "";
    const innerText = (match[3] ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const idMatch = rawAttrs.match(/id=["']([^"']+)["']/i);
    const classMatch = rawAttrs.match(/class=["']([^"']+)["']/i);

    // If specific selector was requested, filter by it
    if (selector !== "body") {
      const cleanSelector = selector.replace(/^[#.]/, "");
      const matchesId = idMatch && idMatch[1] === cleanSelector;
      const matchesClass = classMatch && classMatch[1]?.includes(cleanSelector);
      const matchesTag = tag === selector.toLowerCase();
      if (!matchesId && !matchesClass && !matchesTag) continue;
    }

    matches.push({
      tag,
      id: idMatch ? idMatch[1] : undefined,
      className: classMatch ? classMatch[1] : undefined,
      attributes: {
        ...(idMatch ? { id: idMatch[1]! } : {}),
        ...(classMatch ? { class: classMatch[1]! } : {}),
      },
      textSnippet: innerText.slice(0, 120),
    });
    count++;
  }

  return JSON.stringify(
    {
      currentUrl: activeSession.currentUrl,
      title: activeSession.title,
      querySelector: selector,
      depth,
      totalMatchedElements: matches.length,
      elements: matches,
    },
    null,
    2
  );
}

/**
 * Return a document-derived layout analysis. This is deliberately not called
 * a screenshot because no browser renderer is present in the local daemon.
 */
export async function browserScreenshot(input: {
  fullPage?: boolean;
}): Promise<string> {
  if (!activeSession) {
    return JSON.stringify({
      error: "No active browser session. Call browser_navigate first.",
    });
  }

  const { fullPage = false } = input;

  // Extract layout containers, responsive elements, and visual hierarchy
  const html = activeSession.htmlContent;
  const layoutBlocks: Array<{
    name: string;
    type: string;
    estimatedBounds: { x: number; y: number; width: number; height: number };
    visible: boolean;
  }> = [];

  if (html.includes("<header") || html.includes("id=\"header\"") || html.includes("id=\"titlebar\"")) {
    layoutBlocks.push({
      name: "Header / Titlebar",
      type: "navigation",
      estimatedBounds: { x: 0, y: 0, width: activeSession.viewport.width, height: 48 },
      visible: true,
    });
  }

  if (html.includes("<nav") || html.includes("sidebar") || html.includes("activitybar")) {
    layoutBlocks.push({
      name: "Navigation Sidebar",
      type: "sidebar",
      estimatedBounds: { x: 0, y: 48, width: 280, height: 800 },
      visible: true,
    });
  }

  if (html.includes("<main") || html.includes("content") || html.includes("workbench")) {
    layoutBlocks.push({
      name: "Main Content / Workbench",
      type: "main",
      estimatedBounds: { x: 280, y: 48, width: activeSession.viewport.width - 280, height: 800 },
      visible: true,
    });
  }

  return JSON.stringify(
    {
      type: "document_layout_analysis",
      url: activeSession.currentUrl,
      title: activeSession.title,
      capturedAt: new Date().toISOString(),
      viewport: activeSession.viewport,
      fullPage,
      layoutHierarchy: layoutBlocks,
      status: "inspection_only",
      visualHealth: {
        hasTitle: Boolean(activeSession.title),
        domElementCount: (html.match(/<[a-zA-Z0-9-]+/g) ?? []).length,
        hasBrokenImages: html.includes("img src=\"\""),
        responsiveLayoutDetected: html.includes("viewport") || html.includes("@media"),
      },
    },
    null,
    2
  );
}

/**
 * Interaction requires a real browser runner (for example Playwright). The
 * daemon fails closed rather than recording an action it did not perform.
 */
export async function browserClick(input: {
  selector: string;
  description?: string;
}): Promise<string> {
  void input;
  throw new Error("Browser interaction is unavailable: configure a supported browser runner before using browser_click.");
}

/**
 * Typing requires a real browser runner and is unavailable in inspection-only mode.
 */
export async function browserType(input: {
  selector: string;
  text: string;
}): Promise<string> {
  void input;
  throw new Error("Browser interaction is unavailable: configure a supported browser runner before using browser_type.");
}
