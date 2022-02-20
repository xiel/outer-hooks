import { runHook, useEffect, useLayoutEffect } from '../../src'
import { Root } from '../../src/root/runHookTypes'

describe('effects - order of execution', () => {
  let log: string[] = []
  let hookRoot: Root<{}, number>
  let renderId = -1
  let cleanUp = (l: string) => `${l} -> cleanup`

  it('should call them in order, but useLayoutEffects always first', async () => {
    hookRoot = runHook(() => {
      renderId++

      useLayoutEffect(() => {
        const label = `01 | useLayoutEffect (r${renderId})`
        log.push(label)
        return () => log.push(cleanUp(label))
      })

      useEffect(() => {
        const label = `03 | useEffect (r${renderId})`
        log.push(label)
        return () => log.push(cleanUp(label))
      })

      useEffect(() => {
        const label = `04 | useEffect - mount only (r${renderId})`
        log.push(label)
        return () => log.push(cleanUp(label))
      }, [])

      useLayoutEffect(() => {
        const label = `02 | useLayoutEffect - mount only (r${renderId})`
        log.push(label)
        return () => log.push(cleanUp(label))
      }, [])

      useEffect(() => {
        const label = `05 | useEffect after useLayoutEffect (r${renderId})`
        log.push(label)
        return () => log.push(cleanUp(label))
      })

      return renderId
    }, {})

    await hookRoot.effects

    expect(log).toMatchInlineSnapshot(`
      Array [
        "01 | useLayoutEffect (r0)",
        "02 | useLayoutEffect - mount only (r0)",
        "03 | useEffect (r0)",
        "04 | useEffect - mount only (r0)",
        "05 | useEffect after useLayoutEffect (r0)",
      ]
    `)
  })

  it('should call effects that needs re-render on update', async () => {
    log = []
    log.push('-> after update')
    hookRoot.update({})
    await hookRoot.effects
    expect(log).toMatchInlineSnapshot(`
      Array [
        "-> after update",
        "01 | useLayoutEffect (r0) -> cleanup",
        "01 | useLayoutEffect (r1)",
        "03 | useEffect (r0) -> cleanup",
        "03 | useEffect (r1)",
        "05 | useEffect after useLayoutEffect (r0) -> cleanup",
        "05 | useEffect after useLayoutEffect (r1)",
      ]
    `)
  })

  it('should call effects again that needs re-render on update', async () => {
    log = []
    log.push('-> after update')
    hookRoot.update({})
    await hookRoot.effects
    expect(log).toMatchInlineSnapshot(`
      Array [
        "-> after update",
        "01 | useLayoutEffect (r1) -> cleanup",
        "01 | useLayoutEffect (r2)",
        "03 | useEffect (r1) -> cleanup",
        "03 | useEffect (r2)",
        "05 | useEffect after useLayoutEffect (r1) -> cleanup",
        "05 | useEffect after useLayoutEffect (r2)",
      ]
    `)
  })

  it('should call effect cleanups on destroy', async () => {
    log = []
    log.push('-> after destroy')
    await hookRoot.destroy()
    expect(log).toMatchInlineSnapshot(`
      Array [
        "-> after destroy",
        "01 | useLayoutEffect (r2) -> cleanup",
        "02 | useLayoutEffect - mount only (r0) -> cleanup",
        "03 | useEffect (r2) -> cleanup",
        "04 | useEffect - mount only (r0) -> cleanup",
        "05 | useEffect after useLayoutEffect (r2) -> cleanup",
      ]
    `)
  })
})
