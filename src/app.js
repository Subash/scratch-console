const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const DEVTOOLS_PORT = new URLSearchParams(window.location.search).get('port');

async function showWindow() {
  ipcRenderer.send('webview-ready');
}

async function getWebSocketDebuggerUrl() {
  const res = await fetch(`http://127.0.0.1:${DEVTOOLS_PORT}/json/list`);
  const list = await res.json();
  const page = list.find(item=> item.url.endsWith('empty.html'));
  return page.webSocketDebuggerUrl;
}

async function loadWebView() {
  const webSocketDebuggerUrl = await getWebSocketDebuggerUrl();
  const webview = document.querySelector('webview');
  const url = new URL(webSocketDebuggerUrl);
  webview.setAttribute('src', `devtools://devtools/bundled/devtools_app.html?ws=${url.host}${url.pathname}`);
  const script = await fs.promises.readFile(path.resolve(__dirname, '../src/devtools.js'), 'utf-8');

  return await new Promise((resolve, reject)=> {
    webview.addEventListener('did-finish-load', ()=> {
      webview.executeJavaScript(script).then(resolve).catch(reject);
    });
  });
}

loadWebView()
  .then(showWindow)
  .catch((err)=> {
    showWindow();
    alert(err.message);
  });
