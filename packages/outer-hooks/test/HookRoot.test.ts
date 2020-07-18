import { act, HookRoot } from '../src'

const usePropReturningHook = (a: string) => {
  return a
}

describe('HookRoot', () => {
  describe('sync renders using act', () => {
    let initialProps = 'a'

    const hookRoot = act(() => HookRoot(usePropReturningHook, initialProps))

    it('should update value synchronous with act', function() {
      expect(hookRoot.state.value).toBe('a')

      act(() => hookRoot.update('b'))
      expect(hookRoot.state.value).toBe('b')

      act(() => hookRoot.update('c'))
      expect(hookRoot.state.value).toBe('c')
    })

    it('should not update synchronous without act', function() {
      hookRoot.update('d')
      expect(hookRoot.state.value).toBe('c')
    })
  })
})
