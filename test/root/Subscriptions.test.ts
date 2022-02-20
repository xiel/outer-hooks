import { Root, runHook } from '../../src'
import { silenceNextConsoleError } from '../utils/testHelpers'

describe('Subscriptions', () => {
  function prepareHookRoot<R extends Root<any, any>>(hookRoot: R) {
    const onUpdateFn = jest.fn()
    const onDestroyFn = jest.fn()
    hookRoot.on('update', onUpdateFn)
    hookRoot.on('destroy', onDestroyFn)
    return {
      onUpdateFn,
      onDestroyFn,
    }
  }

  describe('on/off("update")', () => {
    it('should call on("update") func after render (no props)', async () => {
      let renderId = 0
      const hookRoot = runHook(() => `value: ${renderId++}`)
      const { onDestroyFn, onUpdateFn } = prepareHookRoot(hookRoot)
      expect(await hookRoot.value).toEqual('value: 0')
      expect(onUpdateFn).toHaveBeenCalledTimes(1)
      expect(onUpdateFn).toHaveBeenLastCalledWith('value: 0')
      await hookRoot.update().value
      expect(onUpdateFn).toHaveBeenCalledTimes(2)
      expect(onUpdateFn).toHaveBeenLastCalledWith('value: 1')
      expect(onDestroyFn).toHaveBeenCalledTimes(0)
    })

    it('should call on("update") func after render (empty props)', async () => {
      let renderId = 0
      const hookRoot = runHook(() => `value: ${renderId++}`, {})
      const { onDestroyFn, onUpdateFn } = prepareHookRoot(hookRoot)
      await hookRoot.value
      expect(onUpdateFn).toHaveBeenCalledTimes(1)
      expect(onUpdateFn).toHaveBeenLastCalledWith('value: 0')
      await hookRoot.update({}).value
      expect(onUpdateFn).toHaveBeenCalledTimes(2)
      expect(onUpdateFn).toHaveBeenLastCalledWith('value: 1')
      expect(onDestroyFn).toHaveBeenCalledTimes(0)
    })
  })

  describe('on/off("destroy")', () => {
    it('should call on("destroy") func when hook throws sync in first render', async () => {
      silenceNextConsoleError()
      const hookRoot = runHook(function useThrowSync() {
        throw Error('throw sync')
      })
      const catchFn = jest.fn()
      const { onDestroyFn, onUpdateFn } = prepareHookRoot(hookRoot)
      await hookRoot.value.catch(catchFn)
      expect(catchFn).toHaveBeenCalledTimes(1)
      expect(onUpdateFn).toHaveBeenCalledTimes(0)
      expect(onDestroyFn).toHaveBeenCalledTimes(1)
    })

    it('should call on("destroy") func when hook throws after update', async () => {
      silenceNextConsoleError()
      const hookRoot = runHook((shouldThrow = false) => {
        if (shouldThrow) {
          throw Error('some error')
        }
      })
      const { onDestroyFn, onUpdateFn } = prepareHookRoot(hookRoot)
      await hookRoot.value
      expect(onUpdateFn).toHaveBeenCalledTimes(1)
      expect(onDestroyFn).toHaveBeenCalledTimes(0)

      hookRoot.update(true)
      const catchFn = jest.fn()
      await hookRoot.value.catch(catchFn)
      await hookRoot.isDestroyedPromise
      expect(catchFn).toHaveBeenCalledTimes(1)
      expect(onUpdateFn).toHaveBeenCalledTimes(1)
      expect(onDestroyFn).toHaveBeenCalledTimes(1)
    })

    it('should NOT call on("destroy") func when unsubscribed using off', async () => {
      silenceNextConsoleError()
      const hookRoot = runHook((shouldThrow = false) => {
        if (shouldThrow) {
          throw Error('some error')
        }
      })
      const { onDestroyFn } = prepareHookRoot(hookRoot)
      await hookRoot.value
      hookRoot.off('destroy', onDestroyFn)
      hookRoot.update(true)
      await hookRoot.isDestroyedPromise
      expect(onDestroyFn).toHaveBeenCalledTimes(0)
    })
  })
})
