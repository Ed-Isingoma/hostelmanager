const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const dbScript = require('./dbScript'); // Assuming dbScript contains your database functions

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Ensure preload.js is correctly set up
      nodeIntegration: false, // For security reasons
      contextIsolation: true, // Isolate renderer and main process
    },
  });

  mainWindow.loadFile('index.html'); // Load the login page
};

// Event listener for `call` requests from the renderer process
ipcMain.handle('call', async (event, funcName, params) => {
  console.log(`Function: ${funcName}`);
  console.log(`Parameters:`, params);

  try {
    if (funcName === 'login') {
      return await handleLogin(params[0], params[1]); // Pass username and password
    } else if (funcName === 'createAccount') {
      return await handleCreateAccount(params[0], params[1]); // Pass username and password
    } else {
      throw new Error(`Unknown function: ${funcName}`);
    }
  } catch (error) {
    console.error('Error handling call:', error.message || error);
    return { success: false, error: error.message || error };
  }
});

// Login handler
async function handleLogin(username, password) {
  try {
    const user = await dbScript.login(username, password); // Assume dbScript.login validates credentials
    if (user) {
      return { success: true, data: user };
    } else {
      return { success: false, message: 'Invalid username or password' };
    }
  } catch (error) {
    console.error('Login failed:', error.message || error);
    return { success: false, message: error.message || error };
  }
}

// Account creation handler
async function handleCreateAccount(username, password) {
  try {
    const result = await dbScript.createAccount(username, password); // dbScript.createAccount handles account creation
    if (result) {
      return { success: true, message: 'Account created successfully' };
    } else {
      return { success: false, message: 'Account creation failed' };
    }
  } catch (error) {
    console.error('Account creation failed:', error.message || error);
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
