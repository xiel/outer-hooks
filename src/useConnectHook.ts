import { Root } from './root/HookRootTypes'
import { useState } from './useState'
import { useLayoutEffect } from './useEffect'

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
