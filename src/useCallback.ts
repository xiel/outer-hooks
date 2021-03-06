import { Dependencies } from './core/sharedTypes'
import { useMemo } from './useMemo'

export function useCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  deps: Dependencies
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => callback, deps)
}
