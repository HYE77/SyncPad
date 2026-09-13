type Rect = { x: number; y: number; width: number; height: number }

const clamp = (v: number, lo: number, hi: number): number =>
  Math.round(Math.min(Math.max(v, lo), hi))

// 트레이 아이콘 중앙에 맞추되 작업영역 밖으로 나가지 않게 민다.
// 트레이가 화면 위쪽(macOS 메뉴바)이면 아래로, 아래쪽(Windows 작업표시줄)이면 위로 붙인다.
export function popupPosition(
  tray: Rect,
  workArea: Rect,
  popup: { width: number; height: number }
): { x: number; y: number } {
  const below = tray.y + tray.height / 2 < workArea.y + workArea.height / 2
  return {
    x: clamp(
      tray.x + tray.width / 2 - popup.width / 2,
      workArea.x,
      workArea.x + workArea.width - popup.width
    ),
    y: clamp(
      below ? tray.y + tray.height : tray.y - popup.height,
      workArea.y,
      workArea.y + workArea.height - popup.height
    )
  }
}
