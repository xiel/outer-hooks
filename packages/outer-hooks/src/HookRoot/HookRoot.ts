import { Root, State } from './HookRootTypes'

export function HookRoot<Props, HookValue>(
  fn: (props: Props) => HookValue,
  props: Props,
  onUpdate?: (nextValue: HookValue) => void
) {
  let renderId = -1
  let latestRenderProps: Props

  const stateRef: State<HookValue> = {
    value: (undefined as unknown) as HookValue,
    isSuspended: false,
  }

  update(props)

  const root: Root<Props, HookValue> = Object.freeze({
    state: stateRef,
    update,
  })

  return root

  function render(nextProps?: Props): Root<Props, HookValue> {
    const thisRenderID = (renderId += 1)
    const renderProps = nextProps ?? latestRenderProps

    try {
      stateRef.value = fn(renderProps)
      stateRef.isSuspended = false
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

    return root
  }

  function update(nextProps: Props): Root<Props, HookValue> {
    return render(nextProps)
  }
}
