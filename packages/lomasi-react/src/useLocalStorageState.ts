import React from 'react';

export function useLocalStorageState(key: string): [string | null, (val: string | null) => void] {
  const [state, setState] = React.useState<string | null>(() => {
    return window.localStorage.getItem(key);
  });

  // Handle key change !
  const stateRef = React.useRef<string | null>(state);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);
  React.useEffect(() => {
    const currentVal = window.localStorage.getItem(key);
    if (stateRef.current !== currentVal) {
      setState(currentVal);
    }
  }, [key]);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage) {
        return;
      }
      if (e.key !== key) {
        return;
      }
      setState(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, [key]);

  const setValue = React.useCallback(
    (val: string | null) => {
      if (val === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, val);
      }
      setState(val);
    },
    [key]
  );

  return [state, setValue];
}
