import { HookRoot, useRef } from '../../src'

describe('useRef', () => {
  it('should always return same ref object', async () => {
    const hookRoot = HookRoot(() => {
      return useRef('initial value')
    })

    let refValue = await hookRoot.state.value
    hookRoot.update()
    await hookRoot.state.effects
    expect(hookRoot.state.currentValue).toBe(refValue)
    hookRoot.update()
    await hookRoot.state.effects
    expect(hookRoot.state.currentValue).toBe(refValue)
    expect(hookRoot.state.currentValue!.current).toBe('initial value')
  })

  it('should allow modifications of the ref objects current property', async () => {
    const hookRoot = HookRoot(() => {
      return useRef('initial value')
    })

    let refValue = await hookRoot.state.value
    refValue.current = 'other value'
    hookRoot.update()
    await hookRoot.state.effects
    hookRoot.update()
    await hookRoot.state.effects
    expect(hookRoot.state.currentValue).toBe(refValue)
    expect(hookRoot.state.currentValue!.current).toBe('other value')
  })
})
