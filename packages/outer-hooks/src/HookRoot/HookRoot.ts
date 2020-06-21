import { Root, State } from './HookRootTypes'
import { ActiveHook, outerHookState } from '../OuterHookState'

export function HookRoot<Props, HookValue>(
  fn: (props: Props) => HookValue,
  props: Props,
  onUpdate?: (nextValue: HookValue) => void
) {
  let renderId = -1
  let latestRenderProps: Props
  let needsRender = false

  const stateRef: State<HookValue> = {
    value: (undefined as unknown) as HookValue,
    isSuspended: false,
  }

  const root: Root<Props, HookValue> = Object.freeze({
    state: stateRef,
    update,
  })

  const hook: ActiveHook = {
    displayName: fn.name || '',
    requestRender() {
      if (needsRender) return
      needsRender = true
      // batch all updates in current tick
      Promise.resolve(undefined).then(render)
    },
  }

  update(props)

  return root

  function render(nextProps?: Props): Root<Props, HookValue> {
    outerHookState.currentHook = hook
    outerHookState.currentIndex = 0

    const thisRenderID = (renderId += 1)
    const renderProps = nextProps ?? latestRenderProps

    try {
      stateRef.value = fn(renderProps)
      stateRef.isSuspended = false
      needsRender = false
      latestRenderProps = renderProps
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
        throw e
      }
    }

    outerHookState.currentHook = undefined
    outerHookState.currentIndex = -1

    return root
  }

  function update(nextProps: Props): Root<Props, HookValue> {
    return render(nextProps)
  }
}
