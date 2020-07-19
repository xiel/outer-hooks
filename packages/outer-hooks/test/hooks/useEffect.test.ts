import { HookRoot, useEffect, useLayoutEffect } from '../../src'
import { Root } from '../../src/root/HookRootTypes'

describe('useEffect', () => {
  it('mount effect / each render effect without deps', async () => {
    const eachRenderEffect = jest.fn()
    const mountEffect = jest.fn()
    const hookRoot = HookRoot(() => {
      useEffect(eachRenderEffect)
      useEffect(mountEffect, [])
    })

    await hookRoot.state.effects
    expect(eachRenderEffect).toHaveBeenCalledTimes(1)
    expect(mountEffect).toHaveBeenCalledTimes(1)
    hookRoot.update()
    await hookRoot.state.effects
    expect(eachRenderEffect).toHaveBeenCalledTimes(2)
    expect(mountEffect).toHaveBeenCalledTimes(1)
  })

  test.todo('order of execution')
})

describe('useLayoutEffect', () => {
  it('mount effect / effect without deps', async () => {
    const eachRenderLayoutEffect = jest.fn()
    const mountLayoutEffect = jest.fn()
    const hookRoot = HookRoot(() => {
      useLayoutEffect(eachRenderLayoutEffect)
      useLayoutEffect(mountLayoutEffect, [])
    })

    await hookRoot.state.value
    expect(eachRenderLayoutEffect).toHaveBeenCalledTimes(1)
    expect(mountLayoutEffect).toHaveBeenCalledTimes(1)
    hookRoot.update()
    await hookRoot.state.value
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

      await hookRoot.state.value
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
      await hookRoot.state.effects
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
      await hookRoot.state.value
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
      await hookRoot.state.effects
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

    it('should not return a value anymore', function() {})
  })

  it.todo('should call cleanup on destroy')
})
