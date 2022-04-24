import { act, runHook, useEffect, useLayoutEffect } from '../../src'
import { createPromisedValue } from '../../src/core/promisedValue'
import { useAsyncTestHook } from '../utils/useAsyncTestHook'

describe('runHook | async/suspended render', () => {
  it('should suspended render and re-render after thrown promise resolves', async () => {
    const hookRoot = act(() => runHook(useAsyncTestHook, { animals: 'Cats' }))

    expect(hookRoot.currentValue).toEqual(undefined)
    expect(hookRoot.isSuspended).toEqual(true)
    expect(await hookRoot.value).toEqual('Cats are fun!')
    expect(hookRoot.isSuspended).toEqual(false)

    act(() => hookRoot.update({ animals: 'Birds' }))

    expect(hookRoot.isSuspended).toEqual(true)
    expect(hookRoot.isDestroyed).toEqual(false)

    expect(await hookRoot.value).toEqual('Birds are fun!')
    expect(hookRoot.isSuspended).toEqual(false)
    expect(hookRoot.isDestroyed).toEqual(false)
  })

  it('should abort render & destroy hook when thrown promise rejects', async () => {
    const hookRoot = act(() => runHook(useAsyncTestHook, { animals: 'Horses' }))

    expect(hookRoot.currentValue).toEqual(undefined)
    expect(hookRoot.isSuspended).toEqual(true)
    expect(await hookRoot.value).toEqual('Horses are fun!')
    expect(hookRoot.isSuspended).toEqual(false)
    jest.spyOn(console, 'error').mockImplementationOnce(jest.fn())

    try {
      hookRoot.update({ animals: 'Spiders' })
      await hookRoot.value
    } catch (e) {
      expect(e).toEqual('scary!')
    }

    expect(hookRoot.isSuspended).toEqual(true)
    expect(hookRoot.isDestroyed).toEqual(true)
  })

  it(`effects scheduled during suspending render must not run (after rendering resumes)`, async () => {
    const val = createPromisedValue()
    const val2 = createPromisedValue()

    const eachLayoutEffect = jest.fn()
    const mountLayoutEffect = jest.fn()

    const eachEffect = jest.fn()
    const mountEffect = jest.fn()

    const hookRoot = act(() =>
      runHook(() => {
        useLayoutEffect(eachLayoutEffect)
        useLayoutEffect(mountLayoutEffect, [])

        useEffect(eachEffect)
        useEffect(mountEffect, [])

        if (!val.isSettled) throw val.promise
        if (!val2.isSettled) {
          setTimeout(() => val2.resolve('done'))
          throw val2.promise
        }
      })
    )

    expect(hookRoot.isSuspended).toBe(true)
    act(() => val.resolve('done'))
    expect(hookRoot.isSuspended).toBe(true)

    await hookRoot.value
    await hookRoot.effects

    expect(eachLayoutEffect).toHaveBeenCalledTimes(1)
    expect(mountLayoutEffect).toHaveBeenCalledTimes(1)
    expect(eachEffect).toHaveBeenCalledTimes(1)
    expect(mountEffect).toHaveBeenCalledTimes(1)

    hookRoot.update()
    await hookRoot.effects

    expect(eachLayoutEffect).toHaveBeenCalledTimes(2)
    expect(mountLayoutEffect).toHaveBeenCalledTimes(1)
    expect(eachEffect).toHaveBeenCalledTimes(2)
    expect(mountEffect).toHaveBeenCalledTimes(1)

    await hookRoot.destroy()
  })
})
