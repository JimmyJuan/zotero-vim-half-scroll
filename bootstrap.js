let pluginID = "vim-half-scroll@local";
let scanTimer = null;
let targetHandlers = new WeakMap();
let targets = new Set();
let keysets = new WeakMap();
let lastHandledAt = 0;
const DEBUG = false;

function log(message) {
  if (!DEBUG) {
    return;
  }
  Zotero.debug(`[vim-half-scroll] ${message}`);
}

function startup({ id }) {
  pluginID = id || pluginID;
  try {
    log("startup");
    Zotero.Reader?.registerEventListener?.("renderToolbar", onReaderToolbar, pluginID);
    installKeysInKnownWindows();
    scanReaders();
    scanTimer = setInterval(scanReaders, 1000);
  }
  catch (e) {
    log(`startup error: ${e}`);
    Zotero.logError(e);
  }
}

function shutdown(data, reason) {
  if (reason === APP_SHUTDOWN) {
    return;
  }

  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }

  Zotero.Reader?.unregisterEventListener?.("renderToolbar", onReaderToolbar);

  for (let target of [...targets]) {
    detachTarget(target);
  }

  uninstallKeysFromKnownWindows();
}

function install() {}
function uninstall() {}
function onMainWindowLoad() {
  installKeysInKnownWindows();
  scanReaders();
}
function onMainWindowUnload() {
  uninstallKeysFromKnownWindows();
}

function onReaderToolbar(event) {
  log("renderToolbar");
  attachReader(event.reader);
}

function scanReaders() {
  try {
    for (let reader of Zotero.Reader?._readers || []) {
      attachReader(reader);
    }
  }
  catch (e) {
    Zotero.logError(e);
  }
}

function attachReader(reader) {
  if (!reader?._internalReader) {
    return;
  }

  installKeys(reader._window);
  attachTarget(reader._window, reader);
  attachTarget(reader._window?.document, reader);
  attachTarget(reader._iframeWindow, reader);
  attachTarget(reader._iframeWindow?.document, reader);
  attachTarget(reader._internalReader._primaryView?._iframeWindow, reader);
  attachTarget(reader._internalReader._primaryView?._iframeWindow?.document, reader);
  attachTarget(reader._internalReader._secondaryView?._iframeWindow, reader);
  attachTarget(reader._internalReader._secondaryView?._iframeWindow?.document, reader);
}

function installKeysInKnownWindows() {
  let enumerator = Services.wm.getEnumerator(null);
  while (enumerator.hasMoreElements()) {
    let win = enumerator.getNext();
    installKeys(win);
  }
}

function uninstallKeysFromKnownWindows() {
  let enumerator = Services.wm.getEnumerator(null);
  while (enumerator.hasMoreElements()) {
    let win = enumerator.getNext();
    uninstallKeys(win);
  }
}

function installKeys(win) {
  try {
    if (!win?.document || keysets.has(win)) {
      return;
    }

    let type = win.document.documentElement?.getAttribute("windowtype");
    if (type !== "navigator:browser" && type !== "zotero:reader") {
      return;
    }

    let parent = win.document.getElementById("mainKeyset");
    let wrapper = null;
    if (!parent) {
      wrapper = win.document.createXULElement("keyset");
      wrapper.id = "vim-half-scroll-keyset";
      win.document.documentElement.appendChild(wrapper);
      parent = wrapper;
    }

    let down = makeKey(win, "vim-half-scroll-key-down", "d", 1);
    let up = makeKey(win, "vim-half-scroll-key-up", "u", -1);

    parent.appendChild(down);
    parent.appendChild(up);
    keysets.set(win, wrapper || [down, up]);
    log(`installed keys in ${type}; parent=${parent.id || parent.nodeName}`);
  }
  catch (e) {
    log(`installKeys error: ${e}`);
    Zotero.logError(e);
  }
}

function uninstallKeys(win) {
  let installed = keysets.get(win);
  if (!installed) {
    return;
  }
  if (Array.isArray(installed)) {
    for (let el of installed) {
      el.remove();
    }
  }
  else {
    installed.remove();
  }
  keysets.delete(win);
}

function makeKey(win, id, key, direction) {
  let el = win.document.createXULElement("key");
  el.id = id;
  el.setAttribute("key", key);
  el.setAttribute("modifiers", "accel");
  el.addEventListener("command", event => {
    log(`key command ${key}`);
    let reader = getActiveReader(win);
    if (reader && !isChromeEditableFocused(win) && scrollHalfPage(reader, null, direction)) {
      log(`${key === "d" ? "down" : "up"} via keyset`);
      event.preventDefault();
      event.stopPropagation();
    }
  });
  return el;
}

function getActiveReader(win) {
  if (win?.reader) {
    return win.reader;
  }
  let selectedID = win?.Zotero_Tabs?.selectedID;
  if (!selectedID || win?.Zotero_Tabs?.selectedType !== "reader") {
    return null;
  }
  return Zotero.Reader?.getByTabID?.(selectedID) || null;
}

function attachTarget(target, reader) {
  if (!target || targetHandlers.has(target)) {
    return;
  }

  let handler = event => onKeyEvent(event, reader);
  target.addEventListener("keydown", handler, true);
  target.addEventListener("keypress", handler, true);
  targetHandlers.set(target, handler);
  targets.add(target);
  log(`attached ${describeTarget(target)}`);
}

function detachTarget(target) {
  let handler = targetHandlers.get(target);
  if (!handler) {
    return;
  }

  try {
    target.removeEventListener("keydown", handler, true);
    target.removeEventListener("keypress", handler, true);
  }
  catch (_) {}

  targetHandlers.delete(target);
  targets.delete(target);
}

function onKeyEvent(event, reader) {
  let key = event.key?.toLowerCase();

  if (!event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
    return;
  }
  if (key !== "d" && key !== "u") {
    return;
  }
  log(`candidate ${event.type}: key=${event.key} target=${describeTarget(event.target)}`);
  if (isEditable(event.target)) {
    log("candidate ignored: editable target");
    return;
  }

  // The same physical shortcut may surface as keydown and keypress.
  if (event.timeStamp - lastHandledAt < 50) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  lastHandledAt = event.timeStamp;

  let direction = key === "d" ? 1 : -1;

  if (scrollHalfPage(reader, event.view, direction)) {
    log(`${key === "d" ? "down" : "up"} via ${event.type} on ${describeTarget(event.currentTarget)}`);
    event.preventDefault();
    event.stopPropagation();
  }
}

function isEditable(target) {
  if (!target || target.nodeType !== 1) {
    return false;
  }

  return !!target.closest(
    "input, textarea, select, [contenteditable='true'], [contenteditable=''], [role='textbox'], .textAnnotation"
  );
}

function isChromeEditableFocused(win) {
  let target = win.document.activeElement;
  if (!target || target.nodeType !== 1) {
    return false;
  }
  return !!target.closest(
    "input, textarea, select, [contenteditable='true'], [contenteditable=''], [role='textbox']"
  );
}

function scrollHalfPage(reader, eventWindow, direction) {
  let internalReader = reader?._internalReader;
  let views = [];

  if (internalReader?._primaryView) {
    views.push(internalReader._primaryView);
  }
  if (internalReader?._secondaryView) {
    views.push(internalReader._secondaryView);
  }

  if (eventWindow) {
    views.sort((a, b) => {
      if (a?._iframeWindow === eventWindow) {
        return -1;
      }
      if (b?._iframeWindow === eventWindow) {
        return 1;
      }
      return 0;
    });
  }

  let diagnostics = [];
  for (let view of views) {
    let container = getViewerContainer(view);
    if (!container) {
      diagnostics.push("missing-container");
      continue;
    }

    let delta = Math.round(container.clientHeight * 0.5) || 400;
    let before = container.scrollTop;
    let max = Math.max(0, container.scrollHeight - container.clientHeight);
    let target = Math.min(max, Math.max(0, before + direction * delta));

    diagnostics.push(`top=${before} max=${max} target=${target} h=${container.clientHeight}`);

    if (target === before) {
      continue;
    }

    container.scrollTop = target;
    container.dispatchEvent(new container.ownerGlobal.Event("scroll", { bubbles: true }));
    log(`scroll ${direction > 0 ? "down" : "up"} delta=${delta} before=${before} target=${target} after=${container.scrollTop} max=${max}`);
    return true;
  }

  log(`scroll failed: no movable view; ${diagnostics.join("; ")}`);
  return false;
}

function getViewerContainer(view) {
  let win = view?._iframeWindow;
  let doc = win?.document;
  return doc?.getElementById("viewerContainer")
    || win?.PDFViewerApplication?.pdfViewer?.container
    || null;
}

function describeTarget(target) {
  try {
    if (!target) {
      return "null";
    }
    if (target.document) {
      return target.document.URL || "window";
    }
    if (target.URL) {
      return target.URL;
    }
    return target.nodeName || String(target);
  }
  catch (_) {
    return "unknown";
  }
}
