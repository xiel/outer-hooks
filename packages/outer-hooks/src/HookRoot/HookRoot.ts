import { ActiveHook, outerHookState } from '../Internal/OuterHookState'
import { Root, State } from './HookRootTypes'

export function HookRoot<Props, HookValue>(
  fn: (props: Props) => HookValue,
  props: Props,
  onUpdate?: (nextValue: HookValue) => void
): Root<Props, HookValue> {
  let renderId = -1
  let needsRender = false
  let isDestroyed = false
  let latestRenderProps: Props = props

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
    updatePartial,
    destroy,
  })

  const hook: ActiveHook = {
    displayName: fn.name || '',
    requestRender() {
      if (needsRender) {
        return
      }
      needsRender = true

      // batch all updates in current tick
      setTimeout(() => Promise.resolve(undefined).then(render), 1)
    },
    afterRenderEffects: new Set(),
    afterDestroyEffects: new Set(),
  }

  return update(props)

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
            return render(nextProps)
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

  function update(nextProps: Props): Root<Props, HookValue> {
    latestRenderProps = nextProps
    hook.requestRender()
    // TODO: return as a promise? (resolve when rendered)
    return root
  }

  function updatePartial(nextProps: Partial<Props>): Root<Props, HookValue> {
    return update({ ...latestRenderProps, ...nextProps })
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
}
