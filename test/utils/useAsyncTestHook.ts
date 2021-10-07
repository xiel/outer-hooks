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

export const useAsyncTestHook = jest.fn(({ animals }: { animals: string }) => {
  const cachedVal = getFromCache(animals)
  if (cachedVal && cachedVal instanceof Promise) {
    throw cachedVal
  }
  return cachedVal
})
