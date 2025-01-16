const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const dbScript = require('./dbScript'); // Assuming this has your DB functions

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Ensure preload.js is correctly set up
      nodeIntegration: false, // For security reasons
      contextIsolation: true, // Secure context
    }
  });

  win.loadFile('index.html'); // Assuming you have an index.html
};

// Register the 'call' event handler to listen for function calls from renderer process
ipcMain.handle('call', async (event, funcName, params) => {
  console.log(`Received function name: ${funcName}`);
  console.log(`Received parameters:`, params);

  // Call respective functions based on `funcName`
  if (funcName === 'login') {
    // Handle login functionality
    return await handleLogin(params.username, params.password);
  } else {
    console.error(`Unknown function: ${funcName}`);
    return { error: `Unknown function: ${funcName}` };
  }
});

// Handle the login functionality
async function handleLogin(username, password) {
  try {
    // Assuming dbScript has a login function that checks credentials
    const result = await dbScript.login(username, password);
    
    if (result) {
      return { success: true, message: 'Login successful' };
    } else {
      return { success: false, message: 'Invalid username or password' };
    }
  } catch (error) {
    console.error('Login failed:', error.message || error);
    return { success: false, message: error.message || error };
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
