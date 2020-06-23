import { Root, State } from './HookRootTypes'
import { ActiveHook, outerHookState } from '../Internal/OuterHookState'

export function HookRoot<Props, HookValue>(
  fn: (props: Props) => HookValue,
  props: Props,
  onUpdate?: (nextValue: HookValue) => void
): Root<Props, HookValue> {
  let renderId = -1
  let latestRenderProps: Props
  let needsRender = false
  let isDestroyed = false

  const stateRef: State<HookValue> = {
    value: (undefined as unknown) as HookValue,
    isSuspended: false,
    get isDestroyed() {
      return isDestroyed
    },
  }

  const root: Root<Props, HookValue> = Object.freeze({
    state: stateRef,
    update,
    destroy,
  })

  const hook: ActiveHook = {
    displayName: fn.name || '',
    requestRender() {
      if (needsRender) return
      needsRender = true
      // batch all updates in current tick
      Promise.resolve(undefined).then(render)
    },
    afterRenderEffects: new Set(),
    afterDestroyEffects: new Set(),
  }

  update(props)

  return root

  function render(nextProps?: Props): Root<Props, HookValue> {
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
      stateRef.value = fn(renderProps)
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
            render(nextProps)
          }
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

  function update(nextProps: Props): Root<Props, HookValue> {
    return render(nextProps)
  }

  function destroy() {
    isDestroyed = true
    Promise.resolve().then(() => {
      hook.afterDestroyEffects.forEach((e) => e())
      hook.afterDestroyEffects.clear()

      requestAnimationFrame(() => {
        hook.afterDestroyEffects.forEach((e) => e())
        hook.afterDestroyEffects.clear()
      })
    })
  }
}
