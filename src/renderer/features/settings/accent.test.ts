import { expect, test } from 'vitest'
import { ACCENTS, resolveAccent } from './accent'

test('저장된 후보색을 그대로 쓴다', () => {
  expect(resolveAccent('#5ec9d6')).toBe('#5ec9d6')
})

test('저장값이 없거나 후보에 없으면 기본색으로 돌아간다', () => {
  expect(resolveAccent(null)).toBe(ACCENTS[0].hex)
  expect(resolveAccent('#ff0000')).toBe(ACCENTS[0].hex)
})
