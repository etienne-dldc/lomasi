import React from 'react';

export function useForceRender(): () => void {
  const [, setNum] = React.useState(Math.random());

  const forceRender = React.useCallback(() => {
    setNum(Math.random());
  }, []);

  return forceRender;
}
