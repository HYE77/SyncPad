import { app, shell, BrowserWindow } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createTray } from './tray'
import { checkForUpdates } from './updater'

// OAuth 콜백이 외부 브라우저에서 앱으로 돌아오는 경로 (renderer의 redirectTo와 같아야 한다).
const PROTOCOL = 'syncpad'
const CALLBACK_PREFIX = `${PROTOCOL}://auth/callback`

let mainWindow: BrowserWindow | null = null
// 앱이 꺼진 상태에서 syncpad:// 링크로 실행되면 받아 줄 renderer가 아직 없다. 담아 두고 로드 후 보낸다.
let pendingAuthUrl: string | null = null

function createWindow(): void {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    // 기본값은 흰색이라 크기 조절 중 렌더러가 다시 그리기 전에 흰 바탕이 비친다. --color-term-bg와 맞춘다.
    backgroundColor: '#090e12',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow = window
  window.on('closed', () => {
    mainWindow = null
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  window.webContents.on('did-finish-load', flushAuthUrl)

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 트레이 팝업이 숨은 창으로 살아 있어서 창 개수로는 판단할 수 없다.
function showMainWindow(): void {
  if (!mainWindow) return createWindow()
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

// 아무 웹페이지나 syncpad:// 링크를 열 수 있다. 우리 콜백 모양이 아니면 renderer로 넘기지 않는다.
// (PKCE verifier가 없으면 교환 자체가 실패하지만, 애초에 건네지 않는 편이 낫다.)
function handleAuthUrl(url: string): void {
  if (!url.startsWith(CALLBACK_PREFIX)) return
  pendingAuthUrl = url
  showMainWindow()
  flushAuthUrl()
}

// 창이 아직 로딩 중이면 did-finish-load가 다시 부른다.
function flushAuthUrl(): void {
  if (!pendingAuthUrl || !mainWindow || mainWindow.webContents.isLoading()) return
  mainWindow.webContents.send('auth:callback', pendingAuthUrl)
  pendingAuthUrl = null
}

// Windows/Linux는 syncpad:// 링크가 '두 번째 인스턴스의 argv'로 온다. lock이 없으면 콜백을 못 받는다.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const url = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`))
    if (url) handleAuthUrl(url)
    else showMainWindow()
  })

  // macOS는 실행 중이든 아니든 이 이벤트로 온다.
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleAuthUrl(url)
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.hye77.syncpad')

    // dev 실행은 electron 바이너리라 등록할 실행 경로를 직접 알려줘야 한다 (Windows만 해당).
    if (is.dev && process.platform === 'win32') {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [resolve(process.argv[1])])
    } else {
      app.setAsDefaultProtocolClient(PROTOCOL)
    }

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    createWindow()
    createTray(showMainWindow)
    // dev 실행은 app-update.yml이 없어 확인할 대상이 없다.
    if (!is.dev) checkForUpdates()

    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', showMainWindow)
  })
}

// 트레이 팝업이 항상 열려 있으니 이 이벤트는 사실상 오지 않는다.
// 본 창을 닫아도 트레이에 남고, 종료는 트레이 메뉴의 '종료'로 한다.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
