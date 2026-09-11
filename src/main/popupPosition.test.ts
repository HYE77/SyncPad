import { expect, test } from 'vitest'
import { popupPosition } from './popupPosition'

const popup = { width: 360, height: 420 }

// macOS: 메뉴바가 위에 있으니 아이콘 아래로 내려온다.
test('트레이가 위쪽이면 아이콘 아래에 붙는다', () => {
  const at = popupPosition(
    { x: 800, y: 0, width: 24, height: 24 },
    { x: 0, y: 25, width: 1440, height: 875 },
    popup
  )
  expect(at).toEqual({ x: 632, y: 25 })
})

// Windows: 작업표시줄이 아래에 있으니 아이콘 위로 올라온다.
test('트레이가 아래쪽이면 아이콘 위에 붙는다', () => {
  const at = popupPosition(
    { x: 1800, y: 1040, width: 24, height: 40 },
    { x: 0, y: 0, width: 1920, height: 1040 },
    popup
  )
  expect(at).toEqual({ x: 1560, y: 620 })
})

// 오른쪽 끝 트레이를 중앙 정렬하면 화면을 넘어간다.
test('작업영역을 넘지 않게 민다', () => {
  const at = popupPosition(
    { x: 1900, y: 1040, width: 24, height: 40 },
    { x: 0, y: 0, width: 1920, height: 1040 },
    popup
  )
  expect(at.x).toBe(1560)
})
