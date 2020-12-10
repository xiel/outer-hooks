import { HookRoot, useCallback } from '../../src'

describe('useCallback', () => {
  it('should return same callback when deps are empty', async () => {
    const hookRoot = HookRoot(() => {
      return useCallback(() => {}, [])
    })

    let callbackValue = await hookRoot.value
    hookRoot.update()
    await hookRoot.effects
    expect(hookRoot.currentValue).toBe(callbackValue)
    hookRoot.update()
    await hookRoot.effects
    expect(hookRoot.currentValue).toBe(callbackValue)
  })

  it('should return new callback when deps change', async () => {
    const hookRoot = HookRoot(
      ({ dep }) => {
        return useCallback(() => dep, [dep])
      },
      { dep: 'A' }
    )
    let callbackValue = await hookRoot.value
    hookRoot.update({ dep: 'B' })
    await hookRoot.effects
    expect(hookRoot.currentValue).not.toBe(callbackValue)
    callbackValue = await hookRoot.value
    hookRoot.update({ dep: 'C' })
    await hookRoot.effects
    expect(hookRoot.currentValue).not.toBe(callbackValue)
  })
})
