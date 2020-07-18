import { act, HookRoot } from '../src'

const usePropReturningHook = <P>(props: P) => {
  return props
}

describe('HookRoot', () => {
  describe('basic interface with named hook', () => {
    const useNamedHook = () => 'hook value'
    const hookRoot = act(() => HookRoot(useNamedHook, {}))

    expect(hookRoot).toMatchInlineSnapshot(`
      Object {
        "destroy": [Function],
        "displayName": "HookRoot(useNamedHook)",
        "state": Object {
          "isDestroyed": false,
          "isSuspended": false,
          "value": "hook value",
        },
        "update": [Function],
        "updatePartial": [Function],
      }
    `)
  })

  describe('display name for anonymous hook', () => {
    const hookRoot = HookRoot(() => {}, {})
    expect(hookRoot.displayName).toBe('HookRoot(useAnonymousHook)')
  })

  describe('initially undefined value (without act render)', () => {
    const hookRoot = HookRoot(usePropReturningHook, { someProp: 'some string' })
    expect(hookRoot.state.value).toBe(undefined)
  })

  describe('sync renders using act', () => {
    let initialProps = { letter: 'a' }

    const hookRoot = act(() => HookRoot(usePropReturningHook, initialProps))

    it('should update value synchronous with act', function() {
      expect(hookRoot.state.value).toEqual(initialProps)

      act(() => hookRoot.updatePartial({ letter: 'b' }))
      expect(hookRoot.state.value).toEqual({ letter: 'b' })

      act(() => hookRoot.update({ letter: 'c' }))
      expect(hookRoot.state.value).toEqual({ letter: 'c' })
    })

    it('should not update synchronous without act', function() {
      hookRoot.updatePartial({ letter: 'this will not be applied sync' })
      expect(hookRoot.state.value).toEqual({ letter: 'c' })
    })
  })
})
