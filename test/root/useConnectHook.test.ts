import { HookRoot, useConnectHook } from '../../src'
import { silenceNextConsoleError } from '../utils/testHelpers'
import { useAsyncTestHook } from '../utils/useAsyncTestHook'

describe('useConnectHook', () => {
  it('Destroys parent Hook if connected hooks gets destroyed', async function() {
    silenceNextConsoleError()
    silenceNextConsoleError()

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
    silenceNextConsoleError()
    silenceNextConsoleError()

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

    expect(innerHook.isDestroyed).toBeTruthy()
    await expect(innerHook.value).rejects.toThrowError(error)
    await expect(innerHook.effects).rejects.toThrowError(error)

    const outerError = Error(
      'Connected hook was destroyed: useConnectHook(HookRoot(useAlwaysThrow)).'
    )

    await expect(outerHook.effects).rejects.toThrowError(outerError)
    await expect(outerHook.value).rejects.toThrowError(outerError)
    expect(outerHook.isDestroyed).toBe(true)

    expect.assertions(7)
  })

  it('Suspends when connected hook suspends & resolves', async function() {
    const innerHook = HookRoot(useAsyncTestHook, {
      animals: 'Cats',
    })
    expect(innerHook.isSuspended).toBeTruthy()

    const outerHook = HookRoot(function useParentHook() {
      const conB = useConnectHook(innerHook)
      return {
        conB,
      }
    })
    expect(outerHook.isSuspended).toBeTruthy()

    await expect(innerHook.value).resolves.toEqual('Cats are fun!')
    await expect(innerHook.effects).resolves.toBeUndefined()
    await expect(outerHook.value).resolves.toEqual({ conB: 'Cats are fun!' })
    await expect(outerHook.effects).resolves.toBeUndefined()

    expect.assertions(6)
  })

  it('Suspends when connected hook suspends & rejects', async function() {
    silenceNextConsoleError()
    silenceNextConsoleError()
    const innerHook = HookRoot(useAsyncTestHook, {
      animals: 'Spiders',
    })
    expect(innerHook.isSuspended).toBeTruthy()

    const outerHook = HookRoot(function useParentHook() {
      const conB = useConnectHook(innerHook)
      return {
        conB,
      }
    })
    expect(outerHook.isSuspended).toBeTruthy()

    await expect(innerHook.value).rejects.toEqual('scary!')
    await expect(innerHook.effects).rejects.toEqual('scary!')
    await expect(outerHook.value).rejects.toEqual('scary!')
    await expect(outerHook.effects).rejects.toEqual('scary!')

    expect.assertions(6)
  })
})
