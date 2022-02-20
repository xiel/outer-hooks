

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
```
