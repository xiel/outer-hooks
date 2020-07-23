interface RefValue<T> {
  ref: {
    current: T
  }
}

export type RefObject<T> = Readonly<RefValue<T>>

export function createRef<T>(initialValue: T): RefObject<T>
export function createRef<T>(initialValue?: T): RefObject<T | undefined>
export function createRef<T>(initialValue: T): RefObject<T> {
  return Object.freeze({
    ref: {
      current: initialValue,
    },
  })
}
