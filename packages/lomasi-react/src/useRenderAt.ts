import React from 'react';
import { useForceRender } from './useForceRender';

const nowInSec = () => Date.now() / 1000;

export function useRenderAt(timeInSeconds: number | null): void {
  const forceRender = useForceRender();

  React.useEffect(() => {
    if (timeInSeconds === null) {
      return;
    }
    const diff = timeInSeconds - nowInSec();
    if (diff < 0) {
      return;
    }
    // add 1 second
    const timer = window.setTimeout(() => {
      forceRender();
    }, diff * 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [forceRender, timeInSeconds]);
}
