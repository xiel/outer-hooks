import { ActiveHook, outerHookState } from '../core/OuterHookState'
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

  const stateRef: State<HookValue> = {
    value: (undefined as unknown) as HookValue,
    isSuspended: false,
    get isDestroyed() {
      return isDestroyed
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
    // TODO: return as a promise? (resolve when rendered)
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
      stateRef.value = hookFunction(renderProps)
      stateRef.isSuspended = false
      needsRender = false
      latestRenderProps = renderProps
      hook.afterRenderEffects.forEach((e) => e())
      hook.afterRenderEffects.clear()
      onUpdate && onUpdate(stateRef.value)
    } catch (e) {
      if (e instanceof Promise || typeof e.then === 'function') {
        stateRef.isSuspended = true
        e.then(() => {
          if (renderId === thisRenderID) {
            return performRender(nextProps)
          }
          return null
        })
      } else {
        destroy()
        throw e
      }
    }

    outerHookState.currentHook = prevHook
    outerHookState.currentIndex = prevIndex

    return root
  }
}
