import { ActiveHook, outerHookState } from '../core/OuterHookState'
import { createPromisedValue, PromisedValue } from '../core/promisedValue'
import { Root, State } from './HookRootTypes'

type OnUpdateFn<HookValue> = (nextValue: HookValue) => void

export function HookRoot<Props extends object | undefined, HookValue>(
  hookFunction: (props: Props) => HookValue,
  initialProps: Props,
  onUpdate?: OnUpdateFn<HookValue>
): Root<Props, HookValue>

export function HookRoot<Props extends undefined, HookValue>(
  hookFunction: (props?: Props) => HookValue,
  onUpdate?: OnUpdateFn<HookValue>
): Root<Props, HookValue>

export function HookRoot<Props extends object | undefined, HookValue>(
  hookFunction: (props: Props) => HookValue,
  initialPropsOrOnUpdate?: Props | OnUpdateFn<HookValue>,
  onUpdate?: OnUpdateFn<HookValue>
): Root<Props, HookValue> {
  let initialProps: Props | undefined = undefined

  if (typeof initialPropsOrOnUpdate === 'function') {
    onUpdate = initialPropsOrOnUpdate as OnUpdateFn<HookValue>
  } else {
    initialProps = initialPropsOrOnUpdate as Props
  }

  // TODO: move props onto state / root
  let renderId = -1
  let needsRender = false
  let isDestroyed = false
  let latestRenderProps: Props

  let valueFresh = false
  let promisedValue: PromisedValue<HookValue> | undefined

  const stateRef: State<HookValue> = {
    isSuspended: false,
    get isDestroyed() {
      return isDestroyed
    },
    currentValue: (undefined as unknown) as HookValue,
    get value() {
      if (valueFresh) {
        return Promise.resolve(stateRef.currentValue)
      }
      if (!promisedValue) {
        promisedValue = createPromisedValue<HookValue>()
      }
      return promisedValue.promise
    },
  }

  const hookName = hookFunction.name || 'useAnonymousHook'
  const root: Root<Props, HookValue> = Object.freeze({
    displayName: `HookRoot(${hookName})`,
    state: stateRef,
    render,
    update,
    destroy,
  })

  const hook: ActiveHook = {
    displayName: hookName,
    // batches all updates in current tick or flush
    requestRender() {
      if (needsRender) {
        return
      }
      needsRender = true
      promisedValue = undefined
      valueFresh = false

      if (outerHookState.flushRender) {
        outerHookState.rendersToFlush.add(performRender)
      } else {
        setTimeout(() => Promise.resolve(undefined).then(performRender), 1)
      }
    },
    afterRenderEffects: new Set(),
    afterDestroyEffects: new Set(),
  }

  return render(initialProps!)

  /**
   * re-renders the hook in the next tick, with the new set of props
   * @param nextProps
   */
  function render(nextProps: Props): Root<Props, HookValue> {
    latestRenderProps = nextProps
    hook.requestRender()
    return root
  }

  /**
   * re-renders the hook in the next tick, with the new set of props merged with the previous props
   * @param nextProps
   */
  function update(nextProps?: Partial<Props>): Root<Props, HookValue> {
    return render({ ...latestRenderProps, ...nextProps })
  }

  function destroy() {
    if (isDestroyed) {
      console.error('already destroyed')
      return
    }
    isDestroyed = true

    Promise.resolve().then(() => {
      requestAnimationFrame(() => {
        hook.afterDestroyEffects.forEach((e) => e())
        hook.afterDestroyEffects.clear()
      })
    })
  }

  function performRender(nextProps?: Props): Root<Props, HookValue> {
    if (isDestroyed) {
      console.warn('can not re-render a Hook, that was destroyed.')
      return root
    }

    const { currentHook: prevHook, currentIndex: prevIndex } = outerHookState
    outerHookState.currentHook = hook
    outerHookState.currentIndex = 0

    const thisRenderID = (renderId += 1)
    const renderProps = nextProps ?? latestRenderProps

    try {
      stateRef.currentValue = hookFunction(renderProps)
      stateRef.isSuspended = false
      needsRender = false
      latestRenderProps = renderProps

      hook.afterRenderEffects.forEach((e) => e())
      hook.afterRenderEffects.clear()

      onUpdate && onUpdate(stateRef.currentValue)

      valueFresh = true
      if (promisedValue) {
        promisedValue.resolve(stateRef.currentValue)
      }
    } catch (e) {
      if (e instanceof Promise || typeof e.then === 'function') {
        stateRef.isSuspended = true
        e.then(() => {
          if (renderId === thisRenderID) {
            return performRender(nextProps)
          }
          return null
        }).catch((error: unknown) => {
          destroy()

          if (promisedValue) {
            promisedValue.reject(error)
          }
        })
      } else {
        destroy()

        if (promisedValue) {
          promisedValue.reject(e)
        }

        throw e
      }
    }

    outerHookState.currentHook = prevHook
    outerHookState.currentIndex = prevIndex

    return root
  }
}
