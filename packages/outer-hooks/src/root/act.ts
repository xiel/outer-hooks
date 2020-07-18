import { FlushableRenderFn, outerHookState } from '../core/OuterHookState'

const callRenderFn = (fn: FlushableRenderFn) => fn()

type Act = <T>(fn: () => T) => T

export let act: Act =
  process.env.NODE_ENV === 'production'
    ? () => {
        throw new Error('act is only available in tests')
      }
    : (fn) => {
        outerHookState.flushRender = true
        const ret = fn()
        outerHookState.flushRender = false

        outerHookState.rendersToFlush.forEach(callRenderFn)
        outerHookState.rendersToFlush.clear()

        return ret
      }
