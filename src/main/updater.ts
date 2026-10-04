import { Notification, shell } from 'electron'
import { autoUpdater } from 'electron-updater'

const RELEASES_URL = 'https://github.com/HYE77/SyncPad/releases/latest'

// GitHub Releases의 latest.yml / latest-mac.yml을 보고 새 버전을 찾는다 (#89).
export function checkForUpdates(): void {
  // 리스너가 없으면 오프라인 같은 흔한 실패에도 'error' emit이 예외로 터진다.
  autoUpdater.on('error', (error) => console.error('[updater]', error.message))

  if (process.platform === 'darwin') {
    // Squirrel.Mac은 새 앱 서명이 현재 앱의 requirement를 만족해야 설치한다.
    // ad-hoc 서명은 cdhash에 묶여 버전마다 달라지니 적용이 실패한다. 알림만 띄우고 직접 받게 한다.
    // ponytail: Developer ID 서명을 도입하면 이 분기를 지우고 Windows와 같은 경로로 합친다.
    autoUpdater.autoDownload = false
    autoUpdater.on('update-available', ({ version }) => {
      const notification = new Notification({
        title: 'SyncPad 업데이트',
        body: `새 버전 ${version}이 있습니다. 클릭해서 내려받으세요.`
      })
      notification.on('click', () => shell.openExternal(RELEASES_URL))
      notification.show()
    })
    autoUpdater.checkForUpdates().catch(() => {})
    return
  }

  // 백그라운드로 받아 두고, 다음에 앱을 종료할 때 설치한다.
  autoUpdater.checkForUpdatesAndNotify().catch(() => {})
}
