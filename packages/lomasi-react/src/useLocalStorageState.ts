import React from 'react';

type SetToken = (token: string | null) => void;
type GetToken = () => string | null;

export function useLocalStorageState(key: string): [string | null, SetToken, GetToken] {
  const getToken = React.useCallback((): string | null => {
    return window.localStorage.getItem(key);
  }, [key]);

  const [state, setState] = React.useState<string | null>(getToken);

  const update = React.useCallback(() => {
    setState(getToken());
  }, [getToken]);

  const setToken = React.useCallback(
    (val: null | string) => {
      if (val === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, val);
      }
      update();
    },
    [key, update]
  );

  // Handle key change !
  const stateRef = React.useRef<string | null>(state);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);
  React.useEffect(() => {
    const currentVal = getToken();
    if (stateRef.current !== currentVal) {
      update();
    }
  }, [getToken, update]);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage) {
        return;
      }
      if (e.key !== key) {
        return;
      }
      update();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, [key, update]);

  return [state, setToken, getToken];
}
