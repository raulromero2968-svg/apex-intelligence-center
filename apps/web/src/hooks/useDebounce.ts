import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value.
 * Returns the debounced value that only updates after the specified delay
 * has passed without the value changing.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 *
 * // debouncedSearch only updates 500ms after the user stops typing
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timer if the value changes before the delay expires
    // This ensures we only update when the user has stopped changing the value
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook that provides both the immediate and debounced value along with a setter.
 * Useful when you need to display the immediate value but use the debounced value for API calls.
 *
 * @param initialValue - The initial value
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns Object containing value, debouncedValue, and setValue function
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 500
): {
  value: T;
  debouncedValue: T;
  setValue: React.Dispatch<React.SetStateAction<T>>;
} {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return { value, debouncedValue, setValue };
}
