---
name: window.open noopener gotcha
description: Using "noopener" in window.open() prevents getting a window reference, breaking postMessage to the opened window.
---

When opening a cross-origin window to send postMessage, do NOT use `noopener`:

```js
// WRONG — win is null, postMessage never fires
const win = window.open(url, "_blank", "noopener,noreferrer");

// CORRECT — win is a real window reference
const win = window.open(url, "_blank");
```

**Why:** `noopener` is a security feature that severs the opener reference. As a side effect, the browser also nullifies the returned window reference, making it impossible to call `win.postMessage(...)`.

**How to apply:** Any time NadlanConnect needs to open a cross-origin window AND send postMessage to it (e.g., the simzip simulator integration), omit `noopener` from the window features string. Also use `"*"` as targetOrigin so it works in dev and prod environments.
