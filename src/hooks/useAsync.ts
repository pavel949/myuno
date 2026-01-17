import { useState, useCallback, useRef, useEffect } from 'react';

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export interface UseAsyncOptions<T> {
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const { initialData = null, onSuccess, onError } = options;
  
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await asyncFunction();
      
      if (isMountedRef.current) {
        setState({ data: result, isLoading: false, error: null });
        onSuccess?.(result);
      }
      
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, isLoading: false, error: errorObj }));
        onError?.(errorObj);
      }
      
      throw errorObj;
    }
  }, [asyncFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({ data: initialData, isLoading: false, error: null });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
    isIdle: !state.isLoading && !state.error && state.data === initialData,
    isSuccess: !state.isLoading && !state.error && state.data !== null,
    isError: !state.isLoading && state.error !== null,
  };
}

// Immediate execution variant
export function useAsyncImmediate<T>(
  asyncFunction: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncOptions<T> = {}
) {
  const result = useAsync(asyncFunction, options);
  
  useEffect(() => {
    result.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return result;
}
