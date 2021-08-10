async function getTabbedPane() {
  let tabbedPane;
  while(!tabbedPane) {
    tabbedPane = document.querySelector('[slot="insertion-point-main"].tabbed-pane');
    await new Promise(resolve=> setTimeout(resolve, 50));
  }
  return tabbedPane;
}

function hideTabs(tabbedPane) {
  const style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.appendChild(document.createTextNode(`
    .tabbed-pane-header-tab:not(#tab-console):not(#tab-network) {
      display: none !important;
    }

    .tabbed-pane-header-tab {
      border-bottom: 2px solid transparent;
      transition: all .2s;
    }

    .tabbed-pane-header-tab.selected {
      border-bottom: 2px solid #1a73e8;
    }

    .tabbed-pane-header-tabs-drop-down-container {
      display: none !important;
    }
  `));

  tabbedPane.shadowRoot.appendChild(style);
}

function hideTabIndicator(tabbedPane) {
  const indicator = tabbedPane.shadowRoot.querySelector('.tabbed-pane-tab-slider');
  indicator.style.display = 'none';
}

function hideElementSelector(tabbedPane) {
  const selector = tabbedPane.shadowRoot.querySelector('.tabbed-pane-left-toolbar');
  selector.style.display = 'none';
}

function hideSettings(tabbedPane) {
  const settings = tabbedPane.shadowRoot.querySelector('.tabbed-pane-right-toolbar');
  settings.style.display = 'none';
}

function focusConsole(tabbedPane) {
  const consoleTab = tabbedPane.shadowRoot.querySelector('#tab-console');

  // tabs get focused on mousedown instead of click
  consoleTab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  consoleTab.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
}

(async ()=> {
  const tabbedPane = await getTabbedPane();
  focusConsole(tabbedPane);
  hideTabs(tabbedPane);
  hideTabIndicator(tabbedPane);
  hideElementSelector(tabbedPane);
  hideSettings(tabbedPane);
})();
