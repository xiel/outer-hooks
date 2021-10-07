import { HookRoot, useMemo } from '../../src'

describe('useMemo', () => {
  it('should be called when deps change', async () => {
    const valueFactory = jest.fn((a: number) => ({
      aMemoProp: a.toString(),
    }))

    const hookRoot = HookRoot(
      ({ a }) => {
        return useMemo(() => valueFactory(a), [a])
      },
      { a: 1 }
    )

    expect(await hookRoot.value).toEqual({
      aMemoProp: '1',
    })
    expect(valueFactory).toHaveBeenCalledTimes(1)

    hookRoot.update({ a: 1 })
    hookRoot.render({ a: 1 })

    expect(await hookRoot.value).toEqual({
      aMemoProp: '1',
    })
    expect(valueFactory).toHaveBeenCalledTimes(1)

    hookRoot.render({ a: 2 })
    hookRoot.render({ a: 2 })

    expect(await hookRoot.value).toEqual({
      aMemoProp: '2',
    })
    expect(valueFactory).toHaveBeenCalledTimes(2)
  })

  it('must not mix up values', async () => {
    const memTest1 = HookRoot(
      ({ out }) => {
        const mem1 = useMemo(() => 'a', [])
        const mem2 = useMemo(() => 'b', [])
        const mem3 = useMemo(() => 'c', [])

        return { [out]: mem1 + mem2 + mem3 }
      },
      { out: 'outputProp' }
    )
    const memTest2 = HookRoot(
      ({ out }) => {
        const mem1 = useMemo(() => 'd', [])
        const mem2 = useMemo(() => 'e', [])
        const mem3 = useMemo(() => 'f', [])

        return { [out]: mem1 + mem2 + mem3 }
      },
      { out: 'outputProp' }
    )

    expect(await memTest1.value).toEqual({ outputProp: 'abc' })
    expect(await memTest2.value).toEqual({ outputProp: 'def' })
    memTest1.update()
    memTest2.update()
    expect(await memTest1.value).toEqual({ outputProp: 'abc' })
    expect(await memTest2.value).toEqual({ outputProp: 'def' })
  })
})
