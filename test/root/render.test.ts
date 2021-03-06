import { act, runHook } from '../../src'

const usePropReturningHook = <P>(props: P) => props

describe('runHook | render & update', () => {
  describe('render', () => {
    it('should replace all props', () => {
      const hookRoot = act(() => runHook(usePropReturningHook, { a: 1, b: 1 }))
      expect(hookRoot.currentValue).toEqual({ a: 1, b: 1 })

      act(() => hookRoot.render({ a: 0, b: 0 }))
      expect(hookRoot.currentValue).toEqual({ a: 0, b: 0 })

      // re-render with a subset of the props (which is a type error)
      // @ts-expect-error
      act(() => hookRoot.render({ a: 2 }))
      expect(hookRoot.currentValue).toEqual({ a: 2 })
    })
  })

  describe('update', () => {
    it('should merge with previous props', () => {
      const hookRoot = act(() => runHook(usePropReturningHook, { a: 1, b: 1 }))
      expect(hookRoot.currentValue).toEqual({ a: 1, b: 1 })

      act(() => hookRoot.update({ a: 0, b: 0 }))
      expect(hookRoot.currentValue).toEqual({ a: 0, b: 0 })

      // re-render with a subset of the props
      act(() => hookRoot.update({ a: 2 }))
      expect(hookRoot.currentValue).toEqual({ a: 2, b: 0 })

      act(() => hookRoot.update())
      expect(hookRoot.currentValue).toEqual({ a: 2, b: 0 })
    })

    it('can be called empty', () => {
      const hookRoot = act(() => runHook(usePropReturningHook, { a: 1, b: 1 }))
      expect(hookRoot.currentValue).toEqual({ a: 1, b: 1 })
      act(() => hookRoot.update())
      expect(hookRoot.currentValue).toEqual({ a: 1, b: 1 })
    })
  })
})
