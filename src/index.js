const path = require('path');
const url = require('url');
const { app, Menu, BrowserWindow } = require('electron');
const squirrel = require('./squirrel-windows.js');
const DEVTOOLS_PORT = 43849;

function createEmptyWindow() {
  const windowProps = {
    show: false,
    webPreferences: {
      backgroundThrottling: false,
      defaultEncoding: 'utf-8',
      enableRemoteModule: true,
      experimentalFeatures: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: false
    }
  };

  const window = new BrowserWindow(windowProps);
  window.loadURL(url.format({
    protocol: 'file',
    pathname: path.resolve(__dirname, '../static/empty.html')
  }));

  return window;
}

function createAppWindow() {
  const windowProps = {
    show: false,
    minWidth: 400,
    minHeight: 300,
    webPreferences: {
      webviewTag: true,
      backgroundThrottling: false,
      defaultEncoding: 'utf-8',
      enableRemoteModule: true,
      experimentalFeatures: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: false
    }
  };

  const window = new BrowserWindow(windowProps);
  window.loadURL(url.format({
    protocol: 'file',
    pathname: path.resolve(__dirname, '../static/app.html'),
    search: `?port=${DEVTOOLS_PORT}`
  }));

  return window;
}

(function init() {
  // handle if there are any squirrel update commands
  squirrel.handleSquirrelCommands();

  // quit if required
  if(squirrel.shouldQuit()) return app.quit();

  // quit if another instance is running
  if(!app.requestSingleInstanceLock()) return app.quit();

  // disable security warnings
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

  // set remote debugging port to start inspector for all windows
  app.commandLine.appendSwitch('remote-debugging-port', DEVTOOLS_PORT);

  // start app
  app.on('ready', ()=> {
    global.emptyWindow = createEmptyWindow();
    global.appWindow = createAppWindow();

    // quit when app window is closed
    global.appWindow.on('close', ()=> app.quit());

    // remove application menu on windows
    if(process.platform === 'win32') Menu.setApplicationMenu(null);
  });

  // focus on second instance
  app.on('second-instance', ()=> {
    global.appWindow.show();
    global.appWindow.focus();
    global.appWindow.restore();
  });
}());
