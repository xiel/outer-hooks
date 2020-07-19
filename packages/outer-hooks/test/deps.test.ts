import { areDepsEqual, depsRequireUpdate } from '../src/core/areDepsEqual'

describe('dependecy array', () => {
  test('array identity can be different (empty)', () => {
    expect(areDepsEqual([], [])).toBeTruthy()
  })

  test('array identity can be different (with value)', () => {
    const someObj = { a: '1' }
    expect(areDepsEqual(['a'], ['a'])).toBeTruthy()
    expect(areDepsEqual([1], [1])).toBeTruthy()
    expect(areDepsEqual([someObj], [someObj])).toBeTruthy()
  })

  test('deps of different length', () => {
    expect(areDepsEqual(['a'], ['a', 'b'])).toBeFalsy()
    expect(areDepsEqual(['a', 'b'], ['a'])).toBeFalsy()
  })

  test('missing deps array (always consider as different)', () => {
    // @ts-expect-error
    expect(areDepsEqual(undefined, [])).toBeFalsy()
    // @ts-expect-error
    expect(areDepsEqual(undefined, undefined)).toBeFalsy()
    // @ts-expect-error
    expect(areDepsEqual(false, false)).toBeFalsy()
  })

  test('value types', () => {
    expect(areDepsEqual([NaN], [NaN])).toBeTruthy()
  })
})

describe('depsRequireUpdate', () => {
  test('array identity can be different (with value)', () => {
    const someObj = { a: '1' }
    expect(depsRequireUpdate(['a'], ['a'])).toBeFalsy()
    expect(depsRequireUpdate([1], [1])).toBeFalsy()
    expect(depsRequireUpdate([someObj], [someObj])).toBeFalsy()
  })

  test('missing deps array (always consider as different)', () => {
    expect(depsRequireUpdate(undefined, [])).toBeTruthy()
    expect(depsRequireUpdate(undefined, undefined)).toBeTruthy()
  })
})
