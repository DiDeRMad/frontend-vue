import { useState, useEffect, useCallback } from 'react';
import { storageService } from '@services';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    encrypt?: boolean;
    compress?: boolean;
    ttl?: number;
    serializer?: {
      stringify: (value: T) => string;
      parse: (value: string) => T;
    };
  } = {}
): [T, (value: T | ((prev: T) => T)) => Promise<void>, () => void] {
  const {
    encrypt = false,
    compress = false,
    ttl,
    serializer
  } = options;

  // Get from localStorage on mount
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Use storageService for consistent handling
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Load initial value asynchronously
  useEffect(() => {
    const loadValue = async () => {
      try {
        const item = await storageService.getItem<T>(key);
        if (item !== null) {
          setStoredValue(item);
        }
      } catch (error) {
        console.error(`Error loading localStorage key "${key}":`, error);
      }
    };

    loadValue();
  }, [key]);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(async (value: T | ((prev: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage using storageService
      if (serializer) {
        const serialized = serializer.stringify(valueToStore);
        await storageService.setItem(key, serialized, { encrypt, compress, ttl });
      } else {
        await storageService.setItem(key, valueToStore, { encrypt, compress, ttl });
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, encrypt, compress, ttl, serializer]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      storageService.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// Specialized hooks for common use cases
export function useEncryptedStorage<T>(
  key: string,
  initialValue: T,
  ttl?: number
) {
  return useLocalStorage(key, initialValue, { encrypt: true, ttl });
}

export function useCompressedStorage<T>(
  key: string,
  initialValue: T,
  ttl?: number
) {
  return useLocalStorage(key, initialValue, { compress: true, ttl });
}

export function useSessionStorage<T>(
  key: string,
  initialValue: T
) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = sessionStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
    }
  }, [key]);

  const setStoredValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(value) : value;
      setValue(valueToStore);
      sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key]);

  const removeStoredValue = useCallback(() => {
    try {
      setValue(initialValue);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [value, setStoredValue, removeStoredValue] as const;
}