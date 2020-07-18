import { HookRoot, useMemo } from '../src'

describe('useMemo', () => {
  it('should return a value that can be awaited', async () => {
    const valueFactory = jest.fn((a) => ({
      aMemoProp: a,
    }))
    const hookRoot = HookRoot(
      ({ a }) => {
        return useMemo(() => valueFactory(a), [a])
      },
      { a: 1 }
    )

    expect(await hookRoot.state.value).toEqual({ aMemoProp: 1 })
    expect(valueFactory).toHaveBeenCalledTimes(1)

    hookRoot.update({ a: 1 })
    hookRoot.render({ a: 1 })

    expect(await hookRoot.state.value).toEqual({ aMemoProp: 1 })
    expect(valueFactory).toHaveBeenCalledTimes(1)

    hookRoot.render({ a: 2 })

    expect(await hookRoot.state.value).toEqual({ aMemoProp: 2 })
    expect(valueFactory).toHaveBeenCalledTimes(2)
  })
})
