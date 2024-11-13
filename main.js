const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const dbScript = require('./dbScript');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
}


app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle("call", async (event, funcName, params) => {
  try {
    if (typeof dbScript[funcName] === "function") {
      const resp = await dbScript[funcName].apply(null, params);
      return { success: true, data: resp };      
    } else {
      throw new Error("Function not found");
    }
  } catch (error) {
    console.error("Error in function call:", error);
    console.log('variables:', params)
    return { success: false, error: error };
  }
});