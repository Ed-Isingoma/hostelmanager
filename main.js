const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const dbScript = require('./dbScript'); // Assuming this has your DB functions

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Ensure preload.js is correctly set up
      nodeIntegration: false, // Should be false for security reasons
      contextIsolation: true, // Secure context
    }
  });

  win.loadFile('index.html');
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handle login (or any other specific functions)
ipcMain.handle("login", async (event, username, password) => {
  try {
    // Check if dbScript has a function called 'login'
    if (typeof dbScript.login === "function") {
      const resp = await dbScript.login(username, password); // Assume login is a function in dbScript
      return { success: true, data: resp };
    } else {
      console.error("Login function not found in dbScript.");
      return { success: false, error: "Login function not found" };
    }
  } catch (error) {
    console.error("Login failed:", error.message || error);
    return { success: false, error: error.message };
  }
});

