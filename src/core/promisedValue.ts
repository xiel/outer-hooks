export interface PromisedValue<Value> {
  resolve: (value: Value | PromiseLike<Value>) => void
  reject: (reason?: unknown) => void
  promise: Promise<Value>
  isResolved: boolean
  isRejected: boolean
  isSettled: boolean
}

export function createPromisedValue<Value>(): PromisedValue<Value> {
  const promisedValue: PromisedValue<Value> = {
    resolve: void 0 as any,
    reject: void 0 as any,
    promise: void 0 as any,
    isResolved: false,
    isRejected: false,
    get isSettled() {
      return promisedValue.isResolved || promisedValue.isRejected
    },
  }

  promisedValue.promise = new Promise<Value>((resolve, reject) => {
    promisedValue.resolve = (value) => {
      resolve(value)
      promisedValue.isResolved = true
    }
    promisedValue.reject = (reason) => {
      reject(reason)
      promisedValue.isRejected = true
    }
  })

  return promisedValue
}

export function isPromiseLike(err: unknown): err is PromiseLike<unknown> {
  if (typeof err !== 'object') return false
  if (!err) return false
  if ('then' in err && typeof (err as { then: unknown }).then === 'function') {
    return true
  }
  return false
}
