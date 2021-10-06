import { HookRoot, useConnectHook } from '../../src'

describe('useConnectHook', () => {
  it('Destroys parent Hook if connected hooks gets destroyed', async function() {
    // Silence expected console.error logs
    jest.spyOn(console, 'error').mockImplementationOnce(jest.fn)
    jest.spyOn(console, 'error').mockImplementationOnce(jest.fn)

    const error = Error('condition error')
    const innerHook = HookRoot(function useConditionalThrow(condition = false) {
      if (condition) {
        throw error
      }
      return {
        condition,
      }
    })
    const outerHook = HookRoot(function useParentHook() {
      const conB = useConnectHook(innerHook)
      return {
        conB,
      }
    })

    innerHook.update(true)

    await expect(innerHook.value).rejects.toThrowError(error)
    expect(innerHook.isDestroyed).toBe(true)
    await expect(innerHook.effects).rejects.toThrowError(error)
    expect(outerHook.isDestroyed).toBe(true)
    await expect(outerHook.value).rejects.toThrowError(error)
    await expect(outerHook.effects).rejects.toThrowError(error)

    // await outerHook.effects
    await new Promise((r) => requestAnimationFrame(r))

    expect.assertions(6)
  })

  it('Destroys parent Hook if connected hooks is already destroyed when passed in', async function() {
    // Silence expected console.error logs
    jest.spyOn(console, 'error').mockImplementationOnce(jest.fn)
    jest.spyOn(console, 'error').mockImplementationOnce(jest.fn)

    const error = Error('condition error')
    const innerHook = HookRoot(function useAlwaysThrow() {
      throw error
    })

    expect(innerHook.isDestroyed).toBe(true)

    const outerHook = HookRoot(function useParentHook() {
      const conB = useConnectHook(innerHook)
      return {
        conB,
      }
    })

    await expect(innerHook.value).rejects.toThrowError(error)
    await expect(innerHook.effects).rejects.toThrowError(error)

    const outerError = Error(
      'Connected hook was destroyed: useConnectHook(HookRoot(useAlwaysThrow)).'
    )

    await expect(outerHook.effects).rejects.toThrowError(outerError)
    await expect(outerHook.value).rejects.toThrowError(outerError)
    expect(outerHook.isDestroyed).toBe(true)

    // await outerHook.effects
    await new Promise((r) => requestAnimationFrame(r))

    expect.assertions(6)
  })
})
