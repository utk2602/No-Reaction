import type { VDomNode } from './vdom'; // Assuming VDomNode is defined in vdom.ts. PLEASE DEFINE IT.

// Define the structure for the component context
export interface ComponentContext {
  import type { VDomNode } from './vdom';

  // Define the structure for the component context
  export interface ComponentContext {
    hooks: HookEntry[];
    component: () => VDomNode | string | number | null;
    domNode: HTMLElement | null;
    vDom: VDomNode | string | number | null;
    rerender: () => void;
  }

  type EffectCleanup = (() => void) | undefined;

  type HookEntry =
    | { type: 'state'; value: any }
    | { type: 'effect'; deps?: any[]; cleanup?: EffectCleanup }
    | { type: 'ref'; current: any }
    | { type: 'memo'; value: any; deps?: any[] };

  // Globals to track the current component and hook index
  let currentComponent: ComponentContext | null = null;
  let hookIndex = 0;

  // Internal helper to get or create a hook slot
  function getHookSlot(): HookEntry | undefined {
    if (!currentComponent) throw new Error('Hooks must be called during render');
    return currentComponent.hooks[hookIndex];
  }

  function setHookSlot(slot: HookEntry) {
    if (!currentComponent) throw new Error('Hooks must be called during render');
    currentComponent.hooks[hookIndex] = slot;
  }

  // useState hook
  export const useState = <T>(initialValue: T): [T, (newValue: T | ((prev: T) => T)) => void] => {
    if (!currentComponent) throw new Error('useState must be called within a component render');

    const slot = getHookSlot();
    if (!slot || slot.type !== 'state') {
      // initialize
      setHookSlot({ type: 'state', value: initialValue });
    }

    const currentSlot = getHookSlot() as { type: 'state'; value: T };

    const setState = (newValue: T | ((prev: T) => T)) => {
      const prev = currentSlot.value as T;
      const resolved = typeof newValue === 'function' ? (newValue as Function)(prev) : newValue;
      if (resolved !== prev) {
        currentSlot.value = resolved;
        // schedule rerender
        // capture context's rerender from the stored component (we can access via currentComponent variable only during render setup)
        // To avoid relying on stale currentComponent, find a way to schedule after render: use stored rerender on component in closure
        const ctx = currentComponent as ComponentContext | null;
        if (ctx && typeof ctx.rerender === 'function') ctx.rerender();
      }
    };

    hookIndex++;
    return [currentSlot.value as T, setState];
  };

  // useRef hook
  export const useRef = <T>(initialValue: T) => {
    if (!currentComponent) throw new Error('useRef must be called within a component render');
    const slot = getHookSlot();
    if (!slot || slot.type !== 'ref') {
      setHookSlot({ type: 'ref', current: initialValue });
    }
    const current = getHookSlot() as { type: 'ref'; current: T };
    hookIndex++;
    return current;
  };

  // useMemo hook
  export const useMemo = <T>(factory: () => T, deps?: any[]): T => {
    if (!currentComponent) throw new Error('useMemo must be called within a component render');
    const slot = getHookSlot();
    if (!slot || slot.type !== 'memo') {
      const value = factory();
      setHookSlot({ type: 'memo', value, deps });
      hookIndex++;
      return value;
    }
    const memo = slot as { type: 'memo'; value: T; deps?: any[] };
    const oldDeps = memo.deps;
    let changed = false;
    if (!deps) changed = true;
    else if (!oldDeps) changed = true;
    else if (deps.length !== oldDeps.length) changed = true;
    else {
      for (let i = 0; i < deps.length; i++) if (deps[i] !== oldDeps[i]) { changed = true; break; }
    }
    if (changed) {
      memo.value = factory();
      memo.deps = deps;
    }
    hookIndex++;
    return memo.value;
  };

  // useEffect hook
  export const useEffect = (effect: () => (void | (() => void)), deps?: any[]): void => {
    if (!currentComponent) throw new Error('useEffect must be called within a component render');

    const slot = getHookSlot();

    if (!slot || slot.type !== 'effect') {
      // first time: store deps and schedule effect
      setHookSlot({ type: 'effect', deps, cleanup: undefined });
      // schedule effect to run after render
      scheduleEffect(hookIndex, effect);
    } else {
      const old = slot as { type: 'effect'; deps?: any[]; cleanup?: EffectCleanup };
      const oldDeps = old.deps;
      let changed = false;
      if (!deps) changed = true; // if no deps provided, always run (componentDidMount-like on first render; React runs every render with no deps — but educational choice)
      else if (!oldDeps) changed = true;
      else if (deps.length !== oldDeps.length) changed = true;
      else {
        for (let i = 0; i < deps.length; i++) if (deps[i] !== oldDeps[i]) { changed = true; break; }
      }
      if (changed) {
        // call cleanup immediately before scheduling new effect
        if (typeof old.cleanup === 'function') {
          try { old.cleanup(); } catch (e) { console.error('Error during effect cleanup', e); }
        }
        old.deps = deps;
        old.cleanup = undefined;
        scheduleEffect(hookIndex, effect);
      }
    }

    hookIndex++;
  };

  // Effect scheduling: store pending effects per component and run them after render
  const pendingEffects = new Map<ComponentContext, Array<{ index: number; effect: () => (void | (() => void)) }>>();

  function scheduleEffect(index: number, effect: () => (void | (() => void))) {
    if (!currentComponent) return;
    let list = pendingEffects.get(currentComponent);
    if (!list) { list = []; pendingEffects.set(currentComponent, list); }
    list.push({ index, effect });
  }

  // Called by renderer after a component finishes rendering
  export function runEffectsForComponent(component: ComponentContext) {
    const list = pendingEffects.get(component);
    if (!list) return;
    // Run in order
    for (const item of list) {
      const slot = component.hooks[item.index] as { type: 'effect'; cleanup?: EffectCleanup } | undefined;
      try {
        const cleanup = item.effect();
        if (typeof cleanup === 'function') {
          if (slot) slot.cleanup = cleanup;
        }
      } catch (e) {
        console.error('Error running effect', e);
      }
    }
    pendingEffects.delete(component);
  }

  // Function to set the current component context (to be used in rendering)
  export const setCurrentComponentContext = (component: ComponentContext | null): void => {
    currentComponent = component;
    hookIndex = 0; // Reset hook index for the new component rendering cycle
  };

  // Getter for the current component context (might be useful for debugging or advanced features)
  export const getCurrentComponentContext = (): ComponentContext | null => {
    return currentComponent;
  };
