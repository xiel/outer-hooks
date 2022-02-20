import { act, runHook } from '../../src'
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

  it('should abort render when thrown promise rejects', async () => {
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
})
