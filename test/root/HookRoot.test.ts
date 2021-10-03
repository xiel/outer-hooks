import { act, HookRoot } from '../../src'
import { nextMicrotask } from '../utils/testHelpers'

const usePropReturningHook = <P>(props: P) => props
const useNameHook = ({ name }: { name: string }) => {
  return name
}

describe('HookRoot Interface', () => {
  it('basic interface with named hook', () => {
    const useNamedHook = () => 'hook value'
    const hookRoot = act(() => HookRoot(useNamedHook))

    expect(hookRoot).toMatchInlineSnapshot(`
      Object {
        "currentValue": "hook value",
        "destroy": [Function],
        "displayName": "HookRoot(useNamedHook)",
        "effects": Promise {},
        "isDestroyed": false,
        "isSuspended": false,
        "render": [Function],
        "subscribe": [Function],
        "unsubscribe": [Function],
        "update": [Function],
        "value": Promise {},
      }
    `)
  })

  it('display name for anonymous hook', () => {
    const hookRoot = HookRoot(() => {}, {})
    expect(hookRoot.displayName).toBe('HookRoot(useAnonymousHook)')
  })

  it('should render sync', () => {
    const hookRoot = HookRoot(useNameHook, { name: 'Peter' })
    expect(hookRoot.currentValue).toMatchInlineSnapshot(`"Peter"`)
    expect(hookRoot.value).toMatchInlineSnapshot(`Promise {}`)
  })

  it('can create a hook without props', () => {
    expect(act(() => HookRoot(() => 42)).currentValue).toEqual(42)
  })

  it('can create a hook with optional props', () => {
    const defaultValue = { name: 'No Name' }
    const useOptionalNameHook = ({ name }: { name: string } = defaultValue) => {
      return name
    }

    expect(act(() => HookRoot(useOptionalNameHook)).currentValue).toBe(
      'No Name'
    )
    expect(
      act(() => HookRoot(useOptionalNameHook, { name: 'Max' })).currentValue
    ).toBe('Max')
  })

  it('can create a hook inline with props', () => {
    const hookRoot = act(() => HookRoot(({ n }: { n: number }) => n, { n: 42 }))
    expect(hookRoot.currentValue).toEqual(42)
  })

  describe('sync renders using act', () => {
    let initialProps = { letter: 'a' }

    const hookRoot = act(() => HookRoot(usePropReturningHook, initialProps))

    it('should update value synchronous with act', () => {
      expect(hookRoot.currentValue).toEqual(initialProps)

      act(() => hookRoot.update({ letter: 'b' }))
      expect(hookRoot.currentValue).toEqual({ letter: 'b' })

      act(() => hookRoot.render({ letter: 'c' }))
      expect(hookRoot.currentValue).toEqual({ letter: 'c' })
    })

    it('should not update synchronous without act', () => {
      hookRoot.update({ letter: 'this will not be applied sync' })
      expect(hookRoot.currentValue).toEqual({ letter: 'c' })
    })
  })

  describe('currentValue is updated after microtask (without act)', () => {
    it('should update value only after next microtask execution', async () => {
      const hookRoot = HookRoot((p) => p, { test: 'fake timers' })

      // first render is sync
      expect(hookRoot.currentValue).toEqual({ test: 'fake timers' })

      hookRoot.update({ test: 'second render' })

      // should still return previous value, because updates are batched
      expect(hookRoot.currentValue).toEqual({ test: 'fake timers' })
      await nextMicrotask()
      expect(hookRoot.currentValue).toEqual({ test: 'second render' })
    })
  })
})

describe('act', () => {
  test('throw if act is used in production', () => {
    const prevEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    expect(() => act(() => HookRoot(() => 42))).toThrow()
    process.env.NODE_ENV = prevEnv
  })
})