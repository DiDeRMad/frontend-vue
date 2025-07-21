import { useState, useEffect, useCallback, useRef } from 'react';

export interface KeyboardState {
  [key: string]: boolean;
}

export interface KeyBinding {
  key: string;
  callback: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  allowInInput?: boolean;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
}

export function useKeyboard() {
  const [keys, setKeys] = useState<KeyboardState>({});
  const [isInputFocused, setIsInputFocused] = useState(false);
  const bindings = useRef<Map<string, KeyBinding>>(new Map());

  // Track key states
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.code || event.key;
      
      setKeys(prev => ({ ...prev, [key]: true }));
      
      // Check for hotkey bindings
      checkBindings(event, 'keydown');
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.code || event.key;
      
      setKeys(prev => ({ ...prev, [key]: false }));
      
      // Check for hotkey bindings
      checkBindings(event, 'keyup');
    };

    // Track input focus to prevent game controls when typing
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.contentEditable === 'true';
      setIsInputFocused(isInput);
    };

    const handleFocusOut = () => {
      setIsInputFocused(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const checkBindings = useCallback((event: KeyboardEvent, type: 'keydown' | 'keyup') => {
    const key = event.code || event.key;
    const binding = bindings.current.get(key);
    
    if (!binding) return;
    
    // Skip if input is focused and binding doesn't allow input
    if (isInputFocused && !binding.allowInInput) return;
    
    // Check modifiers
    if (binding.modifiers) {
      const { ctrl, shift, alt, meta } = binding.modifiers;
      
      if (ctrl !== undefined && event.ctrlKey !== ctrl) return;
      if (shift !== undefined && event.shiftKey !== shift) return;
      if (alt !== undefined && event.altKey !== alt) return;
      if (meta !== undefined && event.metaKey !== meta) return;
    }
    
    // Execute callback
    if (type === 'keydown') {
      binding.callback(event);
      
      if (binding.preventDefault) {
        event.preventDefault();
      }
      
      if (binding.stopPropagation) {
        event.stopPropagation();
      }
    }
  }, [isInputFocused]);

  const bindKey = useCallback((keyBinding: KeyBinding) => {
    bindings.current.set(keyBinding.key, keyBinding);
  }, []);

  const unbindKey = useCallback((key: string) => {
    bindings.current.delete(key);
  }, []);

  const clearBindings = useCallback(() => {
    bindings.current.clear();
  }, []);

  const isKeyPressed = useCallback((key: string) => {
    return Boolean(keys[key]);
  }, [keys]);

  const areKeysPressed = useCallback((keyList: string[]) => {
    return keyList.every(key => keys[key]);
  }, [keys]);

  const anyKeyPressed = useCallback((keyList: string[]) => {
    return keyList.some(key => keys[key]);
  }, [keys]);

  return {
    keys,
    isInputFocused,
    bindKey,
    unbindKey,
    clearBindings,
    isKeyPressed,
    areKeysPressed,
    anyKeyPressed
  };
}

// Hook for game-specific controls
export function useGameControls() {
  const keyboard = useKeyboard();
  const [controls, setControls] = useState({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    jump: false,
    run: false,
    interact: false,
    attack: false,
    block: false,
    autoRun: false
  });

  useEffect(() => {
    // Default game key bindings
    const gameKeys = {
      KeyW: 'moveForward',
      KeyS: 'moveBackward',
      KeyA: 'moveLeft',
      KeyD: 'moveRight',
      Space: 'jump',
      ShiftLeft: 'run',
      KeyE: 'interact',
      NumLock: 'autoRun'
    };

    // Update controls based on key states
    const newControls = { ...controls };
    let changed = false;

    Object.entries(gameKeys).forEach(([key, control]) => {
      const pressed = keyboard.isKeyPressed(key);
      if (newControls[control as keyof typeof controls] !== pressed) {
        newControls[control as keyof typeof controls] = pressed;
        changed = true;
      }
    });

    if (changed) {
      setControls(newControls);
    }
  }, [keyboard.keys, keyboard.isInputFocused]);

  return {
    ...keyboard,
    controls
  };
}

// Hook for hotkey management
export function useHotkeys() {
  const { bindKey, unbindKey, clearBindings } = useKeyboard();
  const hotkeyGroups = useRef<Map<string, string[]>>(new Map());

  const registerHotkey = useCallback((
    key: string,
    callback: () => void,
    options: {
      group?: string;
      description?: string;
      allowInInput?: boolean;
      modifiers?: KeyBinding['modifiers'];
    } = {}
  ) => {
    const { group = 'default', allowInInput = false, modifiers } = options;

    // Add to group
    if (!hotkeyGroups.current.has(group)) {
      hotkeyGroups.current.set(group, []);
    }
    hotkeyGroups.current.get(group)!.push(key);

    // Bind the key
    bindKey({
      key,
      callback: () => callback(),
      allowInInput,
      modifiers,
      preventDefault: true
    });
  }, [bindKey]);

  const unregisterHotkey = useCallback((key: string, group?: string) => {
    unbindKey(key);
    
    if (group && hotkeyGroups.current.has(group)) {
      const keys = hotkeyGroups.current.get(group)!;
      const index = keys.indexOf(key);
      if (index > -1) {
        keys.splice(index, 1);
      }
    }
  }, [unbindKey]);

  const clearHotkeyGroup = useCallback((group: string) => {
    const keys = hotkeyGroups.current.get(group);
    if (keys) {
      keys.forEach(key => unbindKey(key));
      hotkeyGroups.current.delete(group);
    }
  }, [unbindKey]);

  const clearAllHotkeys = useCallback(() => {
    clearBindings();
    hotkeyGroups.current.clear();
  }, [clearBindings]);

  return {
    registerHotkey,
    unregisterHotkey,
    clearHotkeyGroup,
    clearAllHotkeys
  };
}

// Hook for sequence detection (combo keys)
export function useKeySequence(
  sequence: string[],
  callback: () => void,
  options: {
    timeout?: number;
    resetOnMatch?: boolean;
  } = {}
) {
  const { timeout = 2000, resetOnMatch = true } = options;
  const [currentSequence, setCurrentSequence] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const { bindKey } = useKeyboard();

  useEffect(() => {
    // Clear timeout on sequence change
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    if (currentSequence.length > 0) {
      timeoutRef.current = setTimeout(() => {
        setCurrentSequence([]);
      }, timeout);
    }

    // Check for sequence match
    if (currentSequence.length === sequence.length) {
      const matches = sequence.every((key, index) => key === currentSequence[index]);
      
      if (matches) {
        callback();
        if (resetOnMatch) {
          setCurrentSequence([]);
        }
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentSequence, sequence, callback, timeout, resetOnMatch]);

  useEffect(() => {
    // Bind all keys in the sequence
    sequence.forEach(key => {
      bindKey({
        key,
        callback: () => {
          setCurrentSequence(prev => {
            const newSequence = [...prev, key];
            
            // Keep only the last N keys (sequence length)
            if (newSequence.length > sequence.length) {
              return newSequence.slice(-sequence.length);
            }
            
            return newSequence;
          });
        },
        allowInInput: false
      });
    });
  }, [sequence, bindKey]);

  return {
    currentSequence,
    progress: currentSequence.length / sequence.length,
    reset: () => setCurrentSequence([])
  };
}