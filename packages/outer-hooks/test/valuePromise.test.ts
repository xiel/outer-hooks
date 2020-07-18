import { act, HookRoot } from '../src'

const usePropReturningHook = <P>(props: P) => props

describe('HookRoot | valuePromise', () => {
  it('should return a value that can be awaited', async () => {
    const hookRoot = HookRoot(usePropReturningHook, { a: 1, b: 1 })

    expect(await hookRoot.state.valuePromise()).toEqual({ a: 1, b: 1 })

    hookRoot.render({ a: 2, b: 2 }).update({ b: 3 })

    expect(await hookRoot.state.valuePromise()).toEqual({ a: 2, b: 3 })
  })

  it('should still return the value of the initial render after flush', async () => {
    const hookRoot = act(() => HookRoot(usePropReturningHook, { a: 1, b: 1 }))

    expect(await hookRoot.state.valuePromise()).toEqual({ a: 1, b: 1 })

    hookRoot.render({ a: 2, b: 2 }).update({ b: 3 })

    expect(hookRoot.state.value).toEqual({ a: 1, b: 1 })
    expect(await hookRoot.state.valuePromise()).toEqual({ a: 2, b: 3 })
    expect(hookRoot.state.value).toEqual({ a: 2, b: 3 })
  })

  it('should always render batched (props that are immediately overwritten will never be rendered)', async () => {
    const props = { a: 1, b: 1 }
    const useJestHook = jest.fn(usePropReturningHook)
    const hookRoot = HookRoot(useJestHook, props)

    expect(await hookRoot.state.valuePromise()).toEqual(props)
    expect(useJestHook).toHaveBeenLastCalledWith(props)
    expect(useJestHook).toHaveBeenCalledTimes(1)

    // these will all be batched into one render
    hookRoot
      .render({ a: Math.random() * 10, b: Math.random() * 2 })
      .render({ a: 2, b: 2 })
      .update({ b: 3 })

    expect(await hookRoot.state.valuePromise()).toEqual({ a: 2, b: 3 })
    expect(useJestHook).toHaveBeenCalledTimes(2)
    expect(useJestHook).toHaveBeenLastCalledWith({ a: 2, b: 3 })
  })
})
