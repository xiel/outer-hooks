export interface PromisedValue<Value> {
  resolve: (value: Value | PromiseLike<Value>) => void
  reject: (reason?: unknown) => void
  promise: Promise<Value>
  isResolved: boolean
  isRejected: boolean
  isFulfilled: boolean
}

const placeholder: any = undefined

export function createPromisedValue<Value>(): PromisedValue<Value> {
  const promisedValue: PromisedValue<Value> = {
    resolve: placeholder,
    reject: placeholder,
    promise: placeholder,
    isResolved: false,
    isRejected: false,
    isFulfilled: false,
  }

  promisedValue.promise = new Promise<Value>((resolve, reject) => {
    promisedValue.resolve = (value) => {
      resolve(value)
      promisedValue.isResolved = true
      promisedValue.isFulfilled = true
    }
    promisedValue.reject = (reason) => {
      reject(reason)
      promisedValue.isRejected = true
      promisedValue.isFulfilled = true
    }
  })

  return promisedValue
}
