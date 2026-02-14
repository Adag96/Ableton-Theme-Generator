const electron = require('electron');
console.log('Electron:', electron);
console.log('Electron type:', typeof electron);
console.log('Electron.app:', electron.app);
console.log('Has app:', 'app' in electron);
console.log('Keys:', Object.keys(electron));
