import { HookRoot, Root, useLayoutEffect, useState } from '../../src'

export const useConnectHook = <T, K>(hookRoot: Root<T, K>) => {
  const [value, setValue] = useState(hookRoot.currentValue)
  const [hookRootError, setHookRootError] = useState<unknown>()

  if (hookRoot.isSuspended) {
    throw hookRoot.value
  }

  if (hookRootError) {
    throw hookRootError
  }

  useLayoutEffect(() => {
    if (hookRoot.isDestroyed) return
    if (hookRoot.isSuspended) return
    setValue(hookRoot.currentValue)
    return hookRoot.subscribe(setValue)
  }, [hookRoot])

  useLayoutEffect(() => {
    if (hookRoot.isDestroyed) {
      return setHookRootError(
        Error(
          `Connected hook was destroyed: useConnectHook(${hookRoot.displayName}).`
        )
      )
    }
    return hookRoot.on('destroy', setHookRootError)
  }, [hookRoot])

  return value
}

describe('useConnectHook', () => {
  it('Destroys parent Hook if connected hooks gets destroyed', async function() {
    // Silence console.error logs
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

  it('Destroys parent Hook if connected hooks is immediately destroyex', async function() {
    // Silence console.error logs
    jest.spyOn(console, 'error').mockImplementationOnce(jest.fn)
    jest.spyOn(console, 'error').mockImplementationOnce(jest.fn)

    const error = Error('condition error')
    const innerHook = HookRoot(function useAlwaysThrow() {
      throw error
    })
    const outerHook = HookRoot(function useParentHook() {
      const conB = useConnectHook(innerHook)
      return {
        conB,
      }
    })

    await expect(innerHook.value).rejects.toThrowError(error)
    expect(innerHook.isDestroyed).toBe(true)
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
