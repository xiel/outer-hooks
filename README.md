

# OuterHooks 💫
[![npm (tag)](https://img.shields.io/npm/v/@xiel/outer-hooks/latest.svg)](https://www.npmjs.com/package/@xiel/outer-hooks)
![GitHub top language](https://img.shields.io/github/languages/top/xiel/outer-hooks.svg)


Create function components using powerful and composable hooks.

If you know and love [hooks from React](https://reactjs.org/docs/hooks-intro.html), you already know the main API of OuterHooks as they are very alike.

### Differences to React

- OuterHooks is plain JavaScript/TypeScript
- No JSX here – does not render to the DOM
- Only meant to compose logic using native & custom hooks
- Life cycle hooks like useEffect also run in Node

### Work in progress 🚧

This library is still in **beta**. It works, is well tested and actively being developed. But the API is not 100% stable yet.

### Native Hooks

- useState, useRef, useMemo, useCallback, useReducer, useEffect, useLayoutEffect, ...

For now please check the React [Hooks API reference](https://reactjs.org/docs/hooks-reference.html) as they work exactly the same in OuterHooks.


### Custom Hooks

By composing native hooks, you can create Custom Hooks. Native Hooks and Custom Hooks can be composed and nested.

### Run Hooks

```ts
// Define a custom hook
function useCustomHook() {
  const [currentState, setState] = useState(0)

  useEffect(() => {
    if (currentState < 5) {
      setState(currentState + 1)
    }
  }, [currentState])

  return currentState
}

// Run the hook
const custom = runHook(useCustomHook)

// Gets called every time the hook has run
// In this example it will get called with the values 0, 1, 2, 3, 4, 5
custom.on('update', (value) => console.log(value))

// Gets called when the hook was destroyed
custom.on('destroy', (error) => console.error('destroyed'))
```

#### runHook(fn)

runHook(fn) returns the following interface, which lets you await the next value, await effects, read the latest value and subscribe to updates to your hook.

```ts
export interface Root<Props, HookValue> {
  displayName: string

  /**
   * Resolves once the hooks has rendered.
   * Might resolve after being intermediately suspended.
   */
  value: Promise<HookValue>

  /**
   * Resolves once all side effects have run (cleanups, useLayoutEffects and useEffects)
   */
  effects: Promise<void>

  /**
   * Returns the current value of the ran hook (outermost custom `useXYZ` hook)
   * This might return undefined or a stole/older value while the hook is suspended.
   * Recommended: Use the value promise to get the latest value.
   */
  currentValue?: HookValue

  /**
   * While the hook is suspended, this will return true
   */
  isSuspended: boolean

  /**
   * If the hook was destroyed (by error or externally), this will return true
   */
  isDestroyed: boolean

  /**
   * Resolves after all cleanup functions have run
   */
  isDestroyedPromise: Promise<unknown> | undefined

  /**
   * Re-run the hook with new props
   */
  render: RenderFn<Props, HookValue>

  /**
   * Re-run the hook with (partially) new props.
   */
  update: UpdateFn<Props, HookValue>

  /**
   * Subscribe to hook updates
   */
  on: <T extends keyof SubscriptionTypes>(
    type: T,
    subscription: SubscriptionTypes<HookValue>[T]
  ) => UnsubscribeFn

  /**
   * Unsubscribe from hook updates
   */
  off: <T extends keyof SubscriptionTypes>(
    type: T,
    subscription: SubscriptionTypes<HookValue>[T]
  ) => void

  /**
   * Destroy the hook.
   * This will run all cleanup functions and reject the value promise
   */
  destroy(reason?: unknown): Promise<unknown>
}

```
