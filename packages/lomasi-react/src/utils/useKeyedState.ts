import React from 'react';

interface KeyedState<T> {
  value: T | null;
  setValue: (key: string, val: T | null) => void;
  setKey: (key: string, val?: T | null) => void;
  clear: () => void;
}

export function useKeyedState<T>(initialKey: string, initialState: T | null): KeyedState<T> {
  const [key, setKeyState] = React.useState(initialKey);
  const [state, setState] = React.useState<T | null>(initialState);
  const keyRef = React.useRef(key);

  React.useLayoutEffect(() => {
    keyRef.current = key;
  });

  const setValue = React.useCallback((key: string, val: T | null) => {
    if (keyRef.current === key) {
      setState(val);
    }
  }, []);

  const setKey = React.useCallback((key: string, val: T | null = null) => {
    setKeyState(key);
    setState(val);
  }, []);

  const clear = React.useCallback(() => {
    setState(null);
  }, []);

  return {
    value: state,
    setKey,
    setValue,
    clear,
  };
}
