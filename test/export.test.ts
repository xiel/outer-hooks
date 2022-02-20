import * as ExportedInterface from '../src'

test('exported interface', () => {
  expect(ExportedInterface).toMatchInlineSnapshot(`
    Object {
      "act": [Function],
      "runHook": [Function],
      "useCallback": [Function],
      "useConnectHook": [Function],
      "useEffect": [Function],
      "useLayoutEffect": [Function],
      "useMemo": [Function],
      "useReducer": [Function],
      "useRef": [Function],
      "useState": [Function],
    }
  `)
})
