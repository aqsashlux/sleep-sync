const { app, BrowserWindow, shell } = require('electron')
const { fork } = require('child_process')
const path = require('path')

let serverProcess = null

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true
  })

  // Manejar apertura de ventanas externas y popups de OAuth
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Permitir popups de Google OAuth como ventanas modales
    if (url.startsWith('https://accounts.google.com')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 600,
          parent: mainWindow,
          modal: true,
          autoHideMenuBar: true,
        },
      }
    }

    // Abrir cualquier otra URL externa en el navegador del sistema
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // En produccion, carga los archivos del build
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    // En desarrollo, carga el servidor de Vite
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
  // Iniciar el servidor backend automaticamente en modo empaquetado
  if (app.isPackaged) {
    const serverPath = path.join(process.resourcesPath, 'app', 'server.js')
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, NODE_ENV: 'production' },
    })
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
