# DiepScript Modular Refactor

This project reorganizes the original Menu v2 userscript for diep.io into a collection of small, purpose-driven modules. Behaviour stays identical—aimbot, autofarm, spinner, UI, and overlays all work as before—but the code is now easier to navigate, reason about, and maintain.

## Structure

- `src/core/` – shared building blocks such as constants, state, math utilities, stats helpers, and coordinate transforms.
- `src/features/` – individual gameplay features (aimbot, autofarm, spinner, FoV controller, visuals, bullet stacking).
- `src/hooks/` – DOM/canvas/input hooks that lift game data into state and respond to user input.
- `src/runtime/` – player tracking plus the main frame loop and lifecycle glue with `window.extern`.
- `src/ui/menu.js` – Diep-styled control panel rebuilt from the original script.
- `src/main.js` & `src/index.js` – bootstrap the application once all modules are registered.

All modules register themselves through the lightweight loader in `src/core/moduleLoader.js`, so no bundler is required. Tampermonkey simply `@require`s each file and hands control to the loader.

## Tampermonkey Setup

1. Publish the repository (or at least the `src/` directory) to a branch that Tampermonkey can reach.
2. `tampermonkey/TamperScript.user.js` already points at `https://raw.githubusercontent.com/zodmyers/DiepScript/main/...`. Update the branch/commit portion if you want to pin to a specific revision.
3. Install the script in Tampermonkey. The loader will pull every module and call `DiepScript.require("index")` to start the menu.

> GitHub only serves `raw.githubusercontent.com` for **public** repositories. If you keep this project private, host the files elsewhere (e.g., GitHub Pages, a CDN, or a local web server) and update the `@require` URLs accordingly.

> Tip: keep the module URLs pointing at a fixed branch/tag for stability when testing with others.

## Working Locally

- Most behaviour toggles map directly to properties on `core/state.js`, so debugging is as simple as inspecting that object in DevTools.
- The canvas interceptor (`hooks/canvas.js`) is the single place where render parsing happens; per-frame collections are cleared in `runtime/gameLoop.js`.
- Feature modules are intentionally pure where possible. For example, ballistics helpers accept explicit parameters rather than reaching into globals, making future testing easier.

## Credits

- Original script: Dreamy @C:Mi300 (Aimbot + FoV).
- Refactor & modularisation: this project.

If you need to extend functionality, add a module under `src/features/` (or `src/runtime/` if it’s lifecycle-related), register it through the loader, then reference it in `tampermonkey/TamperScript.user.js`. This keeps the project scalable while staying friendly for Tampermonkey distribution. Enjoy! 💻🎯
