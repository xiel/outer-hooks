import { runHook, useRef } from '../../src'

describe('useRef', () => {
  it('should always return same ref object', async () => {
    const hookRoot = runHook(() => {
      return useRef('initial value')
    })

    let refValue = await hookRoot.value
    hookRoot.update()
    await hookRoot.effects
    expect(hookRoot.currentValue).toBe(refValue)
    hookRoot.update()
    await hookRoot.effects
    expect(hookRoot.currentValue).toBe(refValue)
    expect(hookRoot.currentValue!.current).toBe('initial value')
  })

  it('should allow modifications of the ref objects current property', async () => {
    const hookRoot = runHook(() => {
      return useRef('initial value')
    })

    let refValue = await hookRoot.value
    refValue.current = 'other value'
    hookRoot.update()
    await hookRoot.effects
    hookRoot.update()
    await hookRoot.effects
    expect(hookRoot.currentValue).toBe(refValue)
    expect(hookRoot.currentValue!.current).toBe('other value')
  })
})
