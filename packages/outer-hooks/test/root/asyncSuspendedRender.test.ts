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
    }, 100)
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

    expect(hookRoot.state.currentValue).toEqual(undefined)
    expect(hookRoot.state.isSuspended).toEqual(true)
    expect(await hookRoot.state.value).toEqual('Cats are fun!')
    expect(hookRoot.state.isSuspended).toEqual(false)

    act(() => hookRoot.update({ animals: 'Birds' }))

    expect(hookRoot.state.isSuspended).toEqual(true)
    expect(await hookRoot.state.value).toEqual('Birds are fun!')
    expect(hookRoot.state.isSuspended).toEqual(false)
    expect(hookRoot.state.isDestroyed).toEqual(false)
  })

  it('should abort render when thrown promise rejects', async () => {
    const hookRoot = act(() => HookRoot(useAsyncHook, { animals: 'Horses' }))

    expect(hookRoot.state.currentValue).toEqual(undefined)
    expect(hookRoot.state.isSuspended).toEqual(true)
    expect(await hookRoot.state.value).toEqual('Horses are fun!')
    expect(hookRoot.state.isSuspended).toEqual(false)

    try {
      hookRoot.update({ animals: 'Spiders' })
      await hookRoot.state.value
    } catch (e) {
      expect(e).toEqual('scary!')
    }

    expect(hookRoot.state.isSuspended).toEqual(true)
    expect(hookRoot.state.isDestroyed).toEqual(true)
  })
})
