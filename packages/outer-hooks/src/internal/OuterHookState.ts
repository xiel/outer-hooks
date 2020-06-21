export interface ActiveHook {
  displayName: string
  requestRender(): void
}

export interface OuterHookState {
  currentHook?: ActiveHook
  currentIndex: number
}

export const outerHookState: OuterHookState = {
  currentHook: undefined,
  currentIndex: -1,
}
