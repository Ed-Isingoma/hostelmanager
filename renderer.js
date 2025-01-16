// showWelcomeMessage()
const { ipcRenderer } = require('electron');

// Send the 'call' event to the main process
ipcRenderer.send('call', 'someArgument');





