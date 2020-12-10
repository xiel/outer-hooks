/**
 * @jest-environment node
 */

import { HookRoot, useEffect, useLayoutEffect } from '../../src'

describe('useEffect / useLayoutEffect (in node environment)', () => {
  it('should not render any normal effects', async () => {
    let renderId = -1
    const eachRenderEffect = jest.fn()
    const eachRenderLayoutEffect = jest.fn()
    const hookRoot = HookRoot(() => {
      renderId++
      useEffect(eachRenderEffect)
      useLayoutEffect(eachRenderLayoutEffect)
      return renderId
    })

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
    const hookRoot = HookRoot(() => {
      useEffect(eachRenderEffect)
      useLayoutEffect(eachRenderLayoutEffect)
    })

    await hookRoot.effects
    await hookRoot.destroy()
    const catchEffects = jest.fn()
    await hookRoot.effects.catch(catchEffects)
    expect(catchEffects).toHaveBeenCalledTimes(1)
  })
})
