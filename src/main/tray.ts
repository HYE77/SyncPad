import { BrowserWindow, Menu, Tray, nativeImage, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import iconPath from '../../resources/trayIconTemplate.png?asset'
import { popupPosition } from './popupPosition'

const POPUP = { width: 320, height: 420 }

// GC되면 아이콘이 메뉴바에서 사라진다. 모듈 밖으로 내보내 참조를 붙잡아 둔다.
export let tray: Tray | null = null

function createPopup(): BrowserWindow {
  const popup = new BrowserWindow({
    ...POPUP,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    fullscreenable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 본 창과 같은 renderer를 쓰고 해시로 화면만 갈라 쓴다. 빌드 엔트리를 늘리지 않는다.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    popup.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#quick`)
  } else {
    popup.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'quick' })
  }

  // 팝업에는 닫기 버튼이 없다. Esc로 닫는다.
  popup.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'Escape') popup.hide()
  })

  return popup
}

export function createTray(showMainWindow: () => void): void {
  const icon = nativeImage.createFromPath(iconPath)
  // 템플릿 이미지는 macOS가 메뉴바 명암에 맞춰 칠해준다. Windows/Linux는 무시한다.
  icon.setTemplateImage(true)
  const trayIcon = new Tray(icon)
  tray = trayIcon
  trayIcon.setToolTip('SyncPad')

  const popup = createPopup()
  let hiddenAt = 0
  popup.on('blur', () => {
    popup.hide()
    hiddenAt = Date.now()
  })

  trayIcon.on('click', () => {
    if (popup.isVisible()) return popup.hide()
    // 열린 팝업 상태에서 트레이를 누르면 blur가 먼저 와서 이미 닫혀 있다. 다시 열면 토글이 안 된다.
    // ponytail: 250ms 시간차 판별. 클릭 좌표로 구분해야 할 만큼 문제가 되면 그때 바꾼다.
    if (Date.now() - hiddenAt < 250) return
    const bounds = trayIcon.getBounds()
    popup.setBounds({
      ...POPUP,
      ...popupPosition(bounds, screen.getDisplayMatching(bounds).workArea, POPUP)
    })
    popup.show()
  })

  // macOS는 setContextMenu를 걸면 좌클릭에도 메뉴가 떠서 팝업을 못 연다. 우클릭에만 직접 띄운다.
  const menu = Menu.buildFromTemplate([
    { label: 'SyncPad 열기', click: showMainWindow },
    { type: 'separator' },
    { label: '종료', role: 'quit' }
  ])
  trayIcon.on('right-click', () => trayIcon.popUpContextMenu(menu))
}
