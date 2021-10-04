import { HookRoot, Root, useEffect, useLayoutEffect } from '../../src'

describe('useEffect', () => {
  it('mount effect / each render effect without deps', async () => {
    const eachRenderEffect = jest.fn()
    const mountEffect = jest.fn()
    const hookRoot = HookRoot(() => {
      useEffect(eachRenderEffect)
      useEffect(mountEffect, [])
    })

    await hookRoot.effects
    expect(eachRenderEffect).toHaveBeenCalledTimes(1)
    expect(mountEffect).toHaveBeenCalledTimes(1)
    hookRoot.update()
    await hookRoot.effects
    expect(eachRenderEffect).toHaveBeenCalledTimes(2)
    expect(mountEffect).toHaveBeenCalledTimes(1)
  })
})

describe('useLayoutEffect', () => {
  it('mount effect / effect without deps', async () => {
    const eachRenderLayoutEffect = jest.fn()
    const mountLayoutEffect = jest.fn()
    const hookRoot = HookRoot(() => {
      useLayoutEffect(eachRenderLayoutEffect)
      useLayoutEffect(mountLayoutEffect, [])
    })

    await hookRoot.value
    expect(eachRenderLayoutEffect).toHaveBeenCalledTimes(1)
    expect(mountLayoutEffect).toHaveBeenCalledTimes(1)
    hookRoot.update()
    await hookRoot.value
    expect(eachRenderLayoutEffect).toHaveBeenCalledTimes(2)
    expect(mountLayoutEffect).toHaveBeenCalledTimes(1)
  })
})

describe('useEffect + useLayoutEffect', () => {
  describe('should call cleanup functions when effect is re-run & on unmount', () => {
    let hookRoot: Root<{}, true>

    const eachRenderLayoutEffectCleanup = jest.fn()
    const eachRenderLayoutEffect = jest.fn(() => eachRenderLayoutEffectCleanup)
    const mountLayoutEffectCleanup = jest.fn()
    const mountLayoutEffect = jest.fn(() => mountLayoutEffectCleanup)

    const eachRenderEffectCleanup = jest.fn()
    const eachRenderEffect = jest.fn(() => eachRenderEffectCleanup)
    const mountEffectCleanup = jest.fn()
    const mountEffect = jest.fn(() => mountEffectCleanup)

    it('at this point only layout effects have been called', async () => {
      hookRoot = HookRoot(() => {
        useLayoutEffect(eachRenderLayoutEffect)
        useLayoutEffect(mountLayoutEffect, [])
        useEffect(eachRenderEffect)
        useEffect(mountEffect, [])
        return true
      }, {})

      await hookRoot.value
      expect(eachRenderLayoutEffect).toHaveBeenCalledTimes(1)
      expect(mountLayoutEffect).toHaveBeenCalledTimes(1)
      expect(eachRenderEffect).toHaveBeenCalledTimes(0)
      expect(mountEffect).toHaveBeenCalledTimes(0)
    })

    it('no cleanup should have been called yet', async () => {
      expect(eachRenderLayoutEffectCleanup).toHaveBeenCalledTimes(0)
      expect(mountLayoutEffectCleanup).toHaveBeenCalledTimes(0)
      expect(eachRenderEffectCleanup).toHaveBeenCalledTimes(0)
      expect(mountEffectCleanup).toHaveBeenCalledTimes(0)
    })

    it('at this point all effects have been called', async () => {
      await hookRoot.effects
      expect(eachRenderLayoutEffect).toHaveBeenCalledTimes(1)
      expect(mountLayoutEffect).toHaveBeenCalledTimes(1)
      expect(eachRenderEffect).toHaveBeenCalledTimes(1)
      expect(mountEffect).toHaveBeenCalledTimes(1)
    })

    it('no cleanup should have been called yet', async () => {
      expect(eachRenderLayoutEffectCleanup).toHaveBeenCalledTimes(0)
      expect(mountLayoutEffectCleanup).toHaveBeenCalledTimes(0)
      expect(eachRenderEffectCleanup).toHaveBeenCalledTimes(0)
      expect(mountEffectCleanup).toHaveBeenCalledTimes(0)
    })

    it('after a call to update and a render only layout effect shoud have re-run', async () => {
      hookRoot.update()
      await hookRoot.value
      expect(eachRenderLayoutEffect).toHaveBeenCalledTimes(2)
      expect(mountLayoutEffect).toHaveBeenCalledTimes(1)
      expect(eachRenderEffect).toHaveBeenCalledTimes(1)
      expect(mountEffect).toHaveBeenCalledTimes(1)
    })

    it('should have called only the layout effect cleanup yet', async () => {
      expect(eachRenderLayoutEffectCleanup).toHaveBeenCalledTimes(1)
      expect(mountLayoutEffectCleanup).toHaveBeenCalledTimes(0)
      expect(eachRenderEffectCleanup).toHaveBeenCalledTimes(0)
      expect(mountEffectCleanup).toHaveBeenCalledTimes(0)
    })

    it('should have called only the layout effect cleanup yet', async () => {
      await hookRoot.effects
      expect(eachRenderLayoutEffect).toHaveBeenCalledTimes(2)
      expect(mountLayoutEffect).toHaveBeenCalledTimes(1)
      expect(eachRenderEffect).toHaveBeenCalledTimes(2)
      expect(mountEffect).toHaveBeenCalledTimes(1)
    })

    it('should have also called the normal each render cleanup', async () => {
      expect(eachRenderLayoutEffectCleanup).toHaveBeenCalledTimes(1)
      expect(mountLayoutEffectCleanup).toHaveBeenCalledTimes(0)
      expect(eachRenderEffectCleanup).toHaveBeenCalledTimes(1)
      expect(mountEffectCleanup).toHaveBeenCalledTimes(0)
    })

    it('should not have run effect again', async () => {
      await hookRoot.destroy()
      expect(eachRenderLayoutEffect).toHaveBeenCalledTimes(2)
      expect(mountLayoutEffect).toHaveBeenCalledTimes(1)
      expect(eachRenderEffect).toHaveBeenCalledTimes(2)
      expect(mountEffect).toHaveBeenCalledTimes(1)
    })

    it('should have also called all cleanup functions', async () => {
      expect(eachRenderLayoutEffectCleanup).toHaveBeenCalledTimes(2)
      expect(mountLayoutEffectCleanup).toHaveBeenCalledTimes(1)
      expect(eachRenderEffectCleanup).toHaveBeenCalledTimes(2)
      expect(mountEffectCleanup).toHaveBeenCalledTimes(1)
    })

    it('should not return a value anymore', async () => {
      const valueCatch = jest.fn()
      await hookRoot.value.catch(valueCatch)
      expect(valueCatch).toHaveBeenCalledTimes(1)
      expect(valueCatch).toHaveBeenLastCalledWith(
        Error('not available | hookRoot is destroyed')
      )
    })
  })

  it('should call all cleanup functions on destroy, when all effects ran before', async () => {
    const layoutEffectCleanup = jest.fn()
    const effectCleanup = jest.fn()
    const useJestHook = jest.fn(() => {
      useLayoutEffect(() => layoutEffectCleanup)
      useEffect(() => effectCleanup)
    })

    const hookRoot = HookRoot(useJestHook)
    await hookRoot.effects
    await hookRoot.destroy()

    expect(layoutEffectCleanup).toHaveBeenCalledTimes(1)
    expect(effectCleanup).toHaveBeenCalledTimes(1)
  })

  it('should only call layout cleanup on destroy, when only value was awaited before destroy', async () => {
    const layoutEffectCleanup = jest.fn()
    const effectCleanup = jest.fn()
    const useJestHook = jest.fn(() => {
      useLayoutEffect(() => layoutEffectCleanup)
      useEffect(() => effectCleanup)
    })

    const hookRoot = HookRoot(useJestHook)
    await hookRoot.value
    await hookRoot.destroy()

    expect(layoutEffectCleanup).toHaveBeenCalledTimes(1)
    expect(effectCleanup).toHaveBeenCalledTimes(0)
  })
})

describe('effects promise', () => {
  it('should resolve after all effects have run', async () => {
    const effect = jest.fn()
    const layoutEffect = jest.fn()
    const useJestHook = jest.fn(() => {
      useEffect(effect)
      useLayoutEffect(layoutEffect)
    })
    const hookRoot = HookRoot(useJestHook)

    expect(effect).toHaveBeenCalledTimes(0)
    expect(layoutEffect).toHaveBeenCalledTimes(1)

    await hookRoot.value

    // only layout effect should have been called after value promise
    expect(effect).toHaveBeenCalledTimes(0)
    expect(layoutEffect).toHaveBeenCalledTimes(1)

    await hookRoot.effects

    // all effects should have rendered by now
    expect(effect).toHaveBeenCalledTimes(1)
    expect(layoutEffect).toHaveBeenCalledTimes(1)
    expect(useJestHook).toHaveBeenCalledTimes(1)
  })

  it('should reject effects promise after destroy', async () => {
    const useJestHook = jest.fn(() => 'hook value')
    const hookRoot = HookRoot(useJestHook)

    expect(await hookRoot.value).toBe('hook value')
    expect(useJestHook).toHaveBeenCalledTimes(1)

    expect(hookRoot.destroy()).toMatchInlineSnapshot(`Promise {}`)

    const effectCatch = jest.fn()
    await hookRoot.effects.catch(effectCatch)

    expect(effectCatch).toHaveBeenCalledTimes(1)
    expect(effectCatch).toHaveBeenLastCalledWith(
      Error('not available | hookRoot is destroyed')
    )
  })
})
