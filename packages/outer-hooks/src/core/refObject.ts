interface RefValue<T> {
  ref: {
    current: T
  }
}

export type RefObject<T> = Readonly<RefValue<T>>

export function createRef<T>(initialValue: T) {
  return Object.freeze({
    ref: {
      current: initialValue,
    },
  })
}
