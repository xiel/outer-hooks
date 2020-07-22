import { HookRoot, useEffect, useLayoutEffect } from '../../src'

describe('useEffect Exception Handling', () => {
  it('should not call effect & cleanup if hook was not rendered fully (error/exception)', async () => {
    const eachRenderLayoutEffectCleanup = jest.fn()
    const eachRenderLayoutEffect = jest.fn(() => eachRenderLayoutEffectCleanup)
    const eachRenderEffectCleanup = jest.fn()
    const eachRenderEffect = jest.fn(() => eachRenderEffectCleanup)
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(jest.fn())

    const error = new Error('this hook throws')
    const useJestHook = () => {
      useLayoutEffect(eachRenderLayoutEffect)
      useEffect(eachRenderEffect)

      // simulate a exception
      throw error
    }

    let hookRoot = HookRoot(useJestHook)

    const effectCatch = jest.fn()
    const valueCatch = jest.fn()
    await hookRoot.state.value.catch(valueCatch)
    await hookRoot.state.effects.catch(effectCatch)

    expect(hookRoot.state.isDestroyed).toBeTruthy()

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(valueCatch).toHaveBeenCalledTimes(1)
    expect(valueCatch).toHaveBeenLastCalledWith(error)
    expect(effectCatch).toHaveBeenCalledTimes(1)

    expect(eachRenderLayoutEffect).toHaveBeenCalledTimes(0)
    expect(eachRenderLayoutEffectCleanup).toHaveBeenCalledTimes(0)
    expect(eachRenderEffect).toHaveBeenCalledTimes(0)
    expect(eachRenderEffectCleanup).toHaveBeenCalledTimes(0)
  })

  it('should cleanup when error was thrown in useEffect', async () => {
    let log: string[] = []
    let renderId = -1
    let cleanUp = (l: string) => `${l} -> cleanup`
    const errorMessage = 'error in effect!'

    const hookRoot = HookRoot(() => {
      renderId++

      useEffect(() => {
        const label = `02 | useEffect (r${renderId})`
        log.push(label)
        return () => log.push(cleanUp(label))
      })

      useEffect(() => {
        const label = `03 | useEffect (r${renderId})`

        if (renderId === 2) {
          log.push(`-> ${errorMessage} [${label}]`)
          throw new Error(errorMessage)
        } else {
          log.push(label)
        }

        return () => log.push(cleanUp(label))
      })

      useEffect(() => {
        const label = `04 | useEffect (r${renderId})`
        log.push(label)
        return () => log.push(cleanUp(label))
      })

      useLayoutEffect(() => {
        const label = `01 | useLayoutEffect (r${renderId})`
        log.push(label)
        return () => log.push(cleanUp(label))
      })
    })

    expect(await hookRoot.state.effects)
    expect(log).toMatchInlineSnapshot(`
      Array [
        "01 | useLayoutEffect (r0)",
        "02 | useEffect (r0)",
        "03 | useEffect (r0)",
        "04 | useEffect (r0)",
      ]
    `)

    log = []
    expect(await hookRoot.update().state.effects)
    expect(log).toMatchInlineSnapshot(`
      Array [
        "01 | useLayoutEffect (r0) -> cleanup",
        "01 | useLayoutEffect (r1)",
        "02 | useEffect (r0) -> cleanup",
        "02 | useEffect (r1)",
        "03 | useEffect (r0) -> cleanup",
        "03 | useEffect (r1)",
        "04 | useEffect (r0) -> cleanup",
        "04 | useEffect (r1)",
      ]
    `)

    log = []
    const effectCatch = jest.fn()
    expect(await hookRoot.update().state.effects.catch(effectCatch))
    expect(effectCatch).toHaveBeenCalledTimes(1)
    expect(log).toMatchInlineSnapshot(`
      Array [
        "01 | useLayoutEffect (r1) -> cleanup",
        "01 | useLayoutEffect (r2)",
        "02 | useEffect (r1) -> cleanup",
        "02 | useEffect (r2)",
        "03 | useEffect (r1) -> cleanup",
        "-> error in effect! [03 | useEffect (r2)]",
        "01 | useLayoutEffect (r2) -> cleanup",
        "02 | useEffect (r2) -> cleanup",
        "04 | useEffect (r1) -> cleanup",
      ]
    `)

    expect(hookRoot.state.isSuspended).toBe(false)
    expect(hookRoot.state.isDestroyed).toBe(true)
  })

  it('should cleanup when error was thrown in useLayoutEffect', async () => {
    let log: string[] = []
    let renderId = -1
    let cleanUp = (l: string) => `${l} -> cleanup`
    const errorMessage = 'error in effect!'

    const hookRoot = HookRoot(() => {
      renderId++

      useEffect(() => {
        const label = `03 | useEffect (r${renderId})`
        log.push(label)
        return () => log.push(cleanUp(label))
      })

      useLayoutEffect(() => {
        const label = `01 | useLayoutEffect (r${renderId})`
        log.push(label)
        return () => log.push(cleanUp(label))
      })

      useLayoutEffect(() => {
        const label = `02 | useLayoutEffect (r${renderId})`

        if (renderId === 2) {
          log.push(`-> ${errorMessage} [${label}]`)
          throw new Error(errorMessage)
        } else {
          log.push(label)
        }

        return () => log.push(cleanUp(label))
      })
    })

    expect(await hookRoot.state.effects)
    expect(log).toMatchInlineSnapshot(`
      Array [
        "01 | useLayoutEffect (r0)",
        "02 | useLayoutEffect (r0)",
        "03 | useEffect (r0)",
      ]
    `)

    log = []
    expect(await hookRoot.update().state.effects)
    expect(log).toMatchInlineSnapshot(`
      Array [
        "01 | useLayoutEffect (r0) -> cleanup",
        "01 | useLayoutEffect (r1)",
        "02 | useLayoutEffect (r0) -> cleanup",
        "02 | useLayoutEffect (r1)",
        "03 | useEffect (r0) -> cleanup",
        "03 | useEffect (r1)",
      ]
    `)

    log = []
    const effectCatch = jest.fn()
    await hookRoot.update().state.effects.catch(effectCatch)
    expect(effectCatch).toHaveBeenCalledTimes(1)
    expect(effectCatch.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        [Error: error in effect!],
      ]
    `)
    expect(log).toMatchInlineSnapshot(`
      Array [
        "01 | useLayoutEffect (r1) -> cleanup",
        "01 | useLayoutEffect (r2)",
        "02 | useLayoutEffect (r1) -> cleanup",
        "-> error in effect! [02 | useLayoutEffect (r2)]",
        "01 | useLayoutEffect (r2) -> cleanup",
        "03 | useEffect (r1) -> cleanup",
      ]
    `)

    expect(hookRoot.state.isSuspended).toBe(false)
    expect(hookRoot.state.isDestroyed).toBe(true)
  })
})
