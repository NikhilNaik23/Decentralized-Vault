import { useEffect, useRef } from 'react';

/**
 * Custom hook that runs effect only on updates (not on mount)
 */
export const useUpdateEffect = (effect, dependencies) => {
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      return effect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};
