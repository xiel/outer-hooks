import { runHook, useEffect, useState } from '../../src'

describe('useState', () => {
  it('should return a tuple of current/initial state and update function', async () => {
    const hookRoot = runHook(() => {
      const [currentState, setState] = useState('initial value')
      return {
        currentState,
        setState,
      }
    })
    expect((await hookRoot.value).currentState).toBe('initial value')
    expect(typeof (await hookRoot.value).setState).toBe('function')
  })

  it('should accept a function as initializer', async () => {
    const hookRoot = runHook(() => {
      const [currentState, setState] = useState(() => 'initial value')
      return {
        currentState,
        setState,
      }
    })
    expect((await hookRoot.value).currentState).toBe('initial value')
    expect(typeof (await hookRoot.value).setState).toBe('function')
  })

  it('should re-render when update function is called', async () => {
    const hookRoot = runHook(() => {
      const [currentState, setState] = useState('initial value')
      return {
        currentState,
        setState,
      }
    })
    const { setState } = await hookRoot.value
    expect((await hookRoot.value).currentState).toBe('initial value')
    setState('next value')
    expect((await hookRoot.value).currentState).toBe('next value')
    setState('next value 2')
    expect((await hookRoot.value).currentState).toBe('next value 2')
  })

  it('should call callback passed to update function with current value', async () => {
    const hookRoot = runHook(() => {
      const [currentState, setState] = useState(0)
      return {
        currentState,
        setState,
      }
    })
    const { setState } = await hookRoot.value
    expect((await hookRoot.value).currentState).toBe(0)
    setState((n) => n + 1)
    expect((await hookRoot.value).currentState).toBe(1)
    setState((n) => n + 1)
    expect((await hookRoot.value).currentState).toBe(2)
  })

  it('should not re-render when the same value is set', async () => {
    let renderId = -1
    const hookRoot = runHook(() => {
      renderId++
      const [currentState, setState] = useState(0)
      return {
        currentState,
        setState,
      }
    })
    const { setState } = await hookRoot.value
    expect((await hookRoot.value).currentState).toBe(0)
    expect(renderId).toBe(0)
    setState((n) => n)
    expect((await hookRoot.value).currentState).toBe(0)
    setState((n) => n)
    expect((await hookRoot.value).currentState).toBe(0)
    expect(renderId).toBe(0)
  })

  it('should re-render when set state is called in effect', async () => {
    const hookRoot = runHook(() => {
      const [currentState, setState] = useState(0)

      useEffect(() => {
        if (currentState < 5) {
          setState(currentState + 1)
        }
      }, [currentState])

      return currentState
    })

    // gets updated with each effect
    expect(await hookRoot.value).toBe(0)
    await hookRoot.effects
    expect(await hookRoot.value).toBe(1)
    await hookRoot.effects // 2
    await hookRoot.effects // 3
    await hookRoot.effects // 4
    await hookRoot.effects // 5
    expect(await hookRoot.value).toBe(5)
  })

  it('should re-render (sync) when set state is called in render', async () => {
    let renderId = -1
    const hookRoot = runHook(() => {
      renderId++
      const [currentState, setState] = useState(0)

      if (currentState < 5) {
        setState(currentState + 1)
      }

      return currentState
    })

    expect(await hookRoot.value).toBe(5)
    await hookRoot.effects
    expect(await hookRoot.value).toBe(5)
    expect(renderId).toBe(5)
  })
})
