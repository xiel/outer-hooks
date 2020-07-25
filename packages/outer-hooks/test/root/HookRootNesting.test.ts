import {
  HookRoot,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from '../../src'

describe('HookRoot Nesting', () => {
  it('should be possible to nest HookRoots', async () => {
    const cleanUp = (l: string) => `${l} -> cleanup`
    let log: string[] = []

    let nestedHookRenderId = -1
    const useNestedHook = () => {
      nestedHookRenderId++

      const [count, countSet] = useState(0)

      const someRef = useRef('nested')
      useLayoutEffect(() => {
        someRef.current += ' I'
      })

      useLayoutEffect(() => {
        const label = `useNestedHook | useLayoutEffect (r${nestedHookRenderId})`
        log.push(label)
        return () => log.push(cleanUp(label))
      })

      if (count < 2) {
        countSet(count + 1)
      }

      const anotherRef = useRef('nested 2')
      useLayoutEffect(() => {
        anotherRef.current += ' I'
      })

      return {
        count,
        someRef,
        anotherRef,
        nestedHookRenderId,
      }
    }

    let renderId = -1
    const useHook = () => {
      renderId++

      const [count, setCount] = useState(0)

      const someRef = useRef('not nested')
      useLayoutEffect(() => {
        someRef.current += ' I'
      })

      // create a HookRoot in a HookRoot
      const nestedHook = useMemo(() => HookRoot(useNestedHook), [])
      useLayoutEffect(() => nestedHook.destroy, [nestedHook])

      const anotherRef = useRef('not nested')
      useLayoutEffect(() => {
        anotherRef.current += ' I'
      })

      useLayoutEffect(() => {
        const label = `useHook | useLayoutEffect (r${renderId})`
        log.push(label)
        return () => log.push(cleanUp(label))
      })

      useLayoutEffect(() => {
        if (count !== 1) {
          setCount(1)
        }
      }, [count])

      return {
        count,
        renderId,
        someRef,
        anotherRef,
        nestedHook,
      }
    }

    const hootRoot = HookRoot(useHook)
    await hootRoot.state.effects
    const { nestedHook, ...value } = await hootRoot.state.value

    // assert that no hook values are getting messed up
    expect(hootRoot.state.isDestroyed).toBe(false)

    expect(value).toMatchInlineSnapshot(`
      Object {
        "anotherRef": Object {
          "current": "not nested I I",
        },
        "count": 1,
        "renderId": 1,
        "someRef": Object {
          "current": "not nested I I",
        },
      }
    `)

    expect(nestedHook.state.isDestroyed).toBe(false)
    expect(await nestedHook.state.value).toMatchInlineSnapshot(`
      Object {
        "anotherRef": Object {
          "current": "nested 2 I I I",
        },
        "count": 2,
        "nestedHookRenderId": 2,
        "someRef": Object {
          "current": "nested I I I",
        },
      }
    `)

    expect(log).toMatchInlineSnapshot(`
      Array [
        "useNestedHook | useLayoutEffect (r0)",
        "useNestedHook | useLayoutEffect (r0) -> cleanup",
        "useNestedHook | useLayoutEffect (r1)",
        "useNestedHook | useLayoutEffect (r1) -> cleanup",
        "useNestedHook | useLayoutEffect (r2)",
        "useHook | useLayoutEffect (r0)",
        "useHook | useLayoutEffect (r0) -> cleanup",
        "useHook | useLayoutEffect (r1)",
      ]
    `)
  })

  it('should be able to call/render hook roots conditionally', async () => {
    const sideEffect = jest.fn()
    const hookRoot = HookRoot(() => {
      const [count, countSet] = useState(0)

      if (count === 0) {
        HookRoot(() => {
          const [message] = useState(() => 'hello')
          useEffect(() => sideEffect(message))
        })
      }

      const [count2, count2Set] = useState(0)

      if (count === 0) {
        countSet((c) => c + 1)
        count2Set((c) => c + 1)
      }

      return {
        count,
        count2,
      }
    })

    await hookRoot.state.effects
    await hookRoot.state.value
    expect(hookRoot.state.currentValue).toMatchInlineSnapshot(`
      Object {
        "count": 1,
        "count2": 1,
      }
    `)
    expect(sideEffect).toHaveBeenCalledTimes(1)
    expect(sideEffect).toHaveBeenLastCalledWith('hello')
  })
})
