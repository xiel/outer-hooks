import { act, HookRoot } from '../../src'

const cache = new Map<string, string>()

const getFromCache = (key: string) => {
  if (cache.has(key)) {
    return cache.get(key)
  }
  return new Promise<string>((r, reject) =>
    setTimeout(() => {
      if (key === 'Spiders') {
        reject('scary!')
      }
      const value = `${key} are fun!`
      cache.set(key, value)
      r(value)
    }, 10)
  )
}

const useAsyncHook = jest.fn(({ animals }: { animals: string }) => {
  const cachedVal = getFromCache(animals)
  if (cachedVal && cachedVal instanceof Promise) {
    throw cachedVal
  }
  return cachedVal
})

describe('HookRoot | async/suspended render', () => {
  it('should suspended render and re-render after thrown promise resolves', async () => {
    const hookRoot = act(() => HookRoot(useAsyncHook, { animals: 'Cats' }))

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
    const hookRoot = act(() => HookRoot(useAsyncHook, { animals: 'Horses' }))

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
