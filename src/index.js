import electron, {
    app,
    BrowserWindow,
} from 'electron';

import {
    enableLiveReload,
} from 'electron-compile';

const EventEmitter = require('events').EventEmitter;
const path = require('path');


// 增加监听器上限
const ee = new EventEmitter();
ee.setMaxListeners(100);


if (require('electron-squirrel-startup')) {
  app.quit();
}


// 保持主窗口，否则会被自动回收
let mainWindow;
const isDevMode = process.execPath.match(/[\\/]electron/);
if (isDevMode) {
  enableLiveReload({
    strategy: 'react-hmr',
  });
}
const host = isDevMode ? 'http://localhost:3000' : 'http://cli.10knet.com';

// 打开主窗口，载入桥接脚本
const initMain = () => {
  const workArea = electron.screen.getPrimaryDisplay().workArea;
  mainWindow = new BrowserWindow({
    title: '10knet-main',
    x: workArea.x,
    y: workArea.y,
    center: false,
    width: workArea.width,
    minWidth: 360,
    height: workArea.height,
    minHeight: 480,
    minWidth: 720,
        // alwaysOnTop: true,
        // frame:false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload/mainPreload.js'),
    },
  });

    // 载入页面，测试端口为本地3000
  const home = `${host}?pageName=MainHomePage`;
  mainWindow.loadURL(home);

    // 打开开发工具
  if (isDevMode) {
    mainWindow.webContents.openDevTools();
  }

    // 窗口被关闭时候运行
  mainWindow.on('closed', () => {
        // 如果有多个窗口都应关闭
    mainWindow = null;
  });
};


// 支持渲染进程ipc调用main process主进程命令
const ipcMain = electron.ipcMain;
ipcMain.on('run', (event, cmd) => {
  try {
    eval(cmd);
    event.returnValue = true;
  } catch (err) {
    event.returnValue = err.message;
  }
});

// 支持窗口之间通信
ipcMain.on('send', (event, arg) => {
  arg.from = event;
  arg.ts = new Date().getTime();
  mainWindow.webContents.send('msg', arg);
  event.returnValue = true;
});

// 应用就绪后运行
app.on('ready', () => {
  initMain();
});

// 当所有窗口关闭时退出
app.on('window-all-closed', () => {
    // OS X中Cmd + Q执行的时候
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
    // 在OSX中点击docker图标的时候弹出
  if (mainWindow === null) {
    initMain();
  }
});
