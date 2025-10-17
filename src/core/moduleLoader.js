/* eslint-disable no-multi-assign */
// Lightweight AMD-style loader so every module can be `@require`'d individually or bundled later.
(function bootstrapModuleLoader(globalScope) {
  if (globalScope.DiepScript && globalScope.DiepScript.require) {
    return;
  }

  const registry = new Map();
  const cache = new Map();

  function define(name, factory) {
    if (typeof name !== "string" || !name) {
      throw new Error("[DiepScript] Module name must be a non-empty string.");
    }
    if (typeof factory !== "function") {
      throw new Error(`[DiepScript] Factory for "${name}" must be a function.`);
    }
    if (registry.has(name)) {
      console.warn(`[DiepScript] Module "${name}" is already defined. Overwriting.`);
    }
    registry.set(name, factory);
  }

  function require(name) {
    if (cache.has(name)) {
      return cache.get(name);
    }
    if (!registry.has(name)) {
      throw new Error(`[DiepScript] Module "${name}" is not registered.`);
    }

    const module = { exports: {} };
    const factory = registry.get(name);
    const result = factory(require, module.exports, module);
    const resolved = result !== undefined ? result : module.exports;

    cache.set(name, resolved);
    return resolved;
  }

  globalScope.DiepScript = {
    define,
    require,
  };
})(typeof window !== "undefined" ? window : globalThis);
