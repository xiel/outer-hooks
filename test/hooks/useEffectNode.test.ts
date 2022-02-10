/**
 * @jest-environment node
 */

import { HookRoot, useEffect, useLayoutEffect } from '../../src'

// TODO: add effectsDisabled false test for node

describe('useEffect / useLayoutEffect (in node environment with effects disabled)', () => {
  it('should not render any normal effects', async () => {
    let renderId = -1
    const eachRenderEffect = jest.fn()
    const eachRenderLayoutEffect = jest.fn()
    const useHook = () => {
      renderId++
      useEffect(eachRenderEffect)
      useLayoutEffect(eachRenderLayoutEffect)
      return renderId
    }
    useHook.effectsDisabled = true
    const hookRoot = HookRoot(useHook)

    await hookRoot.effects
    expect(eachRenderEffect).toHaveBeenCalledTimes(0)
    expect(eachRenderLayoutEffect).toHaveBeenCalledTimes(0)
    expect(hookRoot.currentValue).toBe(0)

    hookRoot.update()

    await hookRoot.effects
    expect(eachRenderEffect).toHaveBeenCalledTimes(0)
    expect(eachRenderLayoutEffect).toHaveBeenCalledTimes(0)
    expect(hookRoot.currentValue).toBe(1)
  })

  it('should throw after destroy', async () => {
    const eachRenderEffect = jest.fn()
    const eachRenderLayoutEffect = jest.fn()
    const useHook = () => {
      useEffect(eachRenderEffect)
      useLayoutEffect(eachRenderLayoutEffect)
    }
    useHook.effectsDisabled = true
    const hookRoot = HookRoot(useHook)

    await hookRoot.effects
    await hookRoot.destroy()
    const catchEffects = jest.fn()
    await hookRoot.effects.catch(catchEffects)
    expect(catchEffects).toHaveBeenCalledTimes(1)
  })
})
