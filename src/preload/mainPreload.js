const electron = require('electron');
global.$electron = electron;
global.$winName = 'main';
console.log('>[cli]mainPreload:electron is ready.');
