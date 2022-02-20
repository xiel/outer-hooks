import { act, runHook } from '../../src'

const usePropReturningHook = <P>(props: P) => props

describe('runHook | async value', () => {
  it('should return a value that can be awaited', async () => {
    const hookRoot = runHook(usePropReturningHook, { a: 1, b: 1 })

    expect(await hookRoot.value).toEqual({ a: 1, b: 1 })

    hookRoot.render({ a: 2, b: 2 }).update({ b: 3 })

    expect(await hookRoot.value).toEqual({ a: 2, b: 3 })
  })

  it('should still return the value of the initial render after flush', async () => {
    const hookRoot = act(() => runHook(usePropReturningHook, { a: 1, b: 1 }))

    expect(await hookRoot.value).toEqual({ a: 1, b: 1 })

    hookRoot.render({ a: 2, b: 2 }).update({ b: 3 })

    expect(hookRoot.currentValue).toEqual({ a: 1, b: 1 })
    expect(await hookRoot.value).toEqual({ a: 2, b: 3 })
    expect(hookRoot.currentValue).toEqual({ a: 2, b: 3 })
  })

  it('should always render batched (props that are immediately overwritten will never be rendered)', async () => {
    const props = { a: 1, b: 1 }
    const useJestHook = jest.fn(usePropReturningHook)
    const hookRoot = runHook(useJestHook, props)

    expect(await hookRoot.value).toEqual(props)
    expect(useJestHook).toHaveBeenLastCalledWith(props)
    expect(useJestHook).toHaveBeenCalledTimes(1)

    // these will all be batched into one render
    hookRoot
      .render({ a: Math.random() * 10, b: Math.random() * 2 })
      .render({ a: 2, b: 2 })
      .update({ b: 3 })

    expect(await hookRoot.value).toEqual({ a: 2, b: 3 })
    expect(useJestHook).toHaveBeenCalledTimes(2)
    expect(useJestHook).toHaveBeenLastCalledWith({ a: 2, b: 3 })

    expect(await hookRoot.update({ a: 0 }).value).toEqual({ a: 0, b: 3 })
    expect(useJestHook).toHaveBeenCalledTimes(3)
  })
})
