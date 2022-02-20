import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from '../../src'

const missingHookRootError = `please wrap your outer hook in a runHook`

describe('runHook Warning', () => {
  describe('throw error when called without runHook', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation()

    test('useCallback', () => {
      const useTestHook = () => useCallback(jest.fn(), [])
      expect(() => useTestHook()).toThrowError(missingHookRootError)
    })

    test('useMemo', () => {
      const useTestHook = () => useMemo(jest.fn(), [])
      expect(() => useTestHook()).toThrowError(missingHookRootError)
    })

    test('useEffect', () => {
      const useTestHook = () => useEffect(jest.fn(), [])
      expect(() => useTestHook()).toThrowError(missingHookRootError)
    })

    test('useLayoutEffect', () => {
      const useTestHook = () => useLayoutEffect(jest.fn(), [])
      expect(() => useTestHook()).toThrowError(missingHookRootError)
    })

    test('useRef', () => {
      const useTestHook = () => useRef()
      expect(() => useTestHook()).toThrowError(missingHookRootError)
    })

    test('useState', () => {
      const useTestHook = () => useState('initial value')
      expect(() => useTestHook()).toThrowError(missingHookRootError)
    })

    test('useReducer', () => {
      const useTestHook = () => useReducer(jest.fn(), 'initial value')
      expect(() => useTestHook()).toThrowError(missingHookRootError)
    })

    it('should have called printed to console', () => {
      expect(spy).toHaveBeenCalledTimes(7)
    })
  })
})
