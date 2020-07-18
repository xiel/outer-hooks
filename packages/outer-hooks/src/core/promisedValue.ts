export interface PromisedValue<Value> {
  resolve: (value: Value | PromiseLike<Value>) => void
  reject: (reason?: unknown) => void
  promise: Promise<Value>
  isResolved: boolean
  isRejected: boolean
}

const placeholder: any = undefined

export function createPromisedValue<Value>(): PromisedValue<Value> {
  const promisedValue: PromisedValue<Value> = {
    resolve: placeholder,
    reject: placeholder,
    promise: placeholder,
    isResolved: false,
    isRejected: false,
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
