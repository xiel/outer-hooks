import { act, HookRoot } from '../src'
import { nextRenderWithFakeTimers } from './testHelpers'

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
        "destroy": [Function],
        "displayName": "HookRoot(useNamedHook)",
        "render": [Function],
        "state": Object {
          "currentValue": "hook value",
          "isDestroyed": false,
          "isSuspended": false,
          "value": Promise {},
        },
        "update": [Function],
      }
    `)
  })

  it('display name for anonymous hook', () => {
    const hookRoot = HookRoot(() => {}, {})
    expect(hookRoot.displayName).toBe('HookRoot(useAnonymousHook)')
  })

  it('initially undefined value (without act render)', () => {
    const hookRoot = HookRoot(useNameHook, { name: 'Peter' })
    expect(hookRoot.state.currentValue).toBe(undefined)
  })

  it('can create a hook without props', () => {
    expect(act(() => HookRoot(() => 42)).state.currentValue).toEqual(42)
  })

  it('can create a hook with optional props', () => {
    const defaultValue = { name: 'No Name' }
    const useOptionalNameHook = ({ name }: { name: string } = defaultValue) => {
      return name
    }

    expect(act(() => HookRoot(useOptionalNameHook)).state.currentValue).toBe(
      'No Name'
    )
    expect(
      act(() => HookRoot(useOptionalNameHook, { name: 'Max' })).state
        .currentValue
    ).toBe('Max')
  })

  it('can create a hook inline with props', () => {
    const hookRoot = act(() => HookRoot(({ n }: { n: number }) => n, { n: 42 }))
    expect(hookRoot.state.currentValue).toEqual(42)
  })

  describe('sync renders using act', () => {
    let initialProps = { letter: 'a' }

    const hookRoot = act(() => HookRoot(usePropReturningHook, initialProps))

    it('should update value synchronous with act', () => {
      expect(hookRoot.state.currentValue).toEqual(initialProps)

      act(() => hookRoot.update({ letter: 'b' }))
      expect(hookRoot.state.currentValue).toEqual({ letter: 'b' })

      act(() => hookRoot.render({ letter: 'c' }))
      expect(hookRoot.state.currentValue).toEqual({ letter: 'c' })
    })

    it('should not update synchronous without act', () => {
      hookRoot.update({ letter: 'this will not be applied sync' })
      expect(hookRoot.state.currentValue).toEqual({ letter: 'c' })
    })
  })

  describe('updated values after tick, without act, using fake timers', () => {
    it('should update value after advancing timers', async () => {
      jest.useFakeTimers()

      const hookRoot = HookRoot((p) => p, { test: 'fake timers' })
      expect(hookRoot.state.currentValue).toEqual(undefined)

      await nextRenderWithFakeTimers()
      expect(hookRoot.state.currentValue).toEqual({ test: 'fake timers' })

      hookRoot.update({ test: 'second render' })
      await nextRenderWithFakeTimers()
      expect(hookRoot.state.currentValue).toEqual({ test: 'second render' })

      jest.useRealTimers()
    })
  })
})

describe('act', () => {
  test('warn if act is used in production', () => {
    const prevEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    expect(() => act(() => HookRoot(() => 42))).toThrow()
    process.env.NODE_ENV = prevEnv
  })
})
