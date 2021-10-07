import { Root } from './root/HookRootTypes'
import { useLayoutEffect } from './useEffect'
import { useState } from './useState'

export const useConnectHook = <T, K>(hookRoot: Root<T, K>) => {
  const [value, setValue] = useState(hookRoot.currentValue)
  const [hookRootError, setHookRootError] = useState<unknown>()

  // When passed-in hookRoot has suspended, suspend current hook as well and wait for its fulfillment
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
    return hookRoot.on('update', setValue)
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
