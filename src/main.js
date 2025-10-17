DiepScript.define("main", (require) => {
  // Entry point – wires the feature modules together.
  const fov = require("features/fov");
  const input = require("hooks/input");
  require("hooks/canvas");
  const lifecycle = require("runtime/lifecycle");

  function init() {
    fov.initFovController();
    input.initInputHooks();
    lifecycle.initLifecycle();
  }

  return {
    init,
  };
});
