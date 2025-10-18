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

1. Publish the repository (or at least the `dist/` folder) to a branch that Tampermonkey can reach.
2. `tampermonkey/TamperScript.user.js` now pulls the single bundle at `https://raw.githubusercontent.com/zodmyers/DiepScript/NewVersionTest/dist/diepScript.bundle.js`. Change `NewVersionTest` to another branch/commit if you want to pin a release.
3. Install/update the script in Tampermonkey. The loader will fetch the bundle and bootstrap `DiepScript.require("index")`.

> GitHub only serves `raw.githubusercontent.com` for **public** repositories. If you keep things private, host `dist/diepScript.bundle.js` somewhere accessible (GitHub Pages, CDN, personal server) and update the `@require` URL.

### Rebuilding the bundle

Whenever you touch files in `src/`, regenerate the bundle:

```powershell
pwsh -File scripts/build-bundle.ps1
```

This overwrites `dist/diepScript.bundle.js` with the latest module code. Commit both the source changes and the refreshed bundle so Tampermonkey stays in sync.

> Tip: keep the module URLs pointing at a fixed branch/tag for stability when testing with others.

## Working Locally

- Most behaviour toggles map directly to properties on `core/state.js`, so debugging is as simple as inspecting that object in DevTools.
- The canvas interceptor (`hooks/canvas.js`) is the single place where render parsing happens; per-frame collections are cleared in `runtime/gameLoop.js`.
- Feature modules are intentionally pure where possible. For example, ballistics helpers accept explicit parameters rather than reaching into globals, making future testing easier.

## Credits

- Original script: Dreamy @C:Mi300 (Aimbot + FoV).
- Refactor & modularisation: this project.

If you need to extend functionality, add a module under `src/features/` (or `src/runtime/` if it’s lifecycle-related), register it through the loader, then reference it in `tampermonkey/TamperScript.user.js`. This keeps the project scalable while staying friendly for Tampermonkey distribution. Enjoy! 💻🎯

Aim Prediction Foluma:


1) Aimbot
This is the one script I don't want to give away, because it'd make the game unfair. That said, here's the function i use to predict movement, for informational purposes:
function intercept(src, dst, v) {
	var tx = dst.x - src.x,
		ty = dst.y - src.y,
		tvx = dst.vx,
		tvy = dst.vy;
 
	// Get quadratic equation components
	var a = tvx * tvx + tvy * tvy - v * v;
	var b = 2 * (tvx * tx + tvy * ty);
	var c = tx * tx + ty * ty;
 
	// Solve quadratic
	var ts = quad(a, b, c); // See quad(), below
 
	// Find smallest positive solution
	var sol = null;
	if (ts) {
		var t0 = ts[0],
			t1 = ts[1];
		var t = Math.min(t0, t1);
		if (t < 0) t = Math.max(t0, t1);
		if (t > 0) {
			sol = {
				x: dst.x + dst.vx * t,
				y: dst.y + dst.vy * t
			};
		}
	}
 
	return sol;
}
function quad(a, b, c) {
	var sol = null;
	if (Math.abs(a) < 1e-6) {
		if (Math.abs(b) < 1e-6) {
			sol = Math.abs(c) < 1e-6 ? [0, 0] : null;
		} else {
			sol = [-c / b, -c / b];
		}
	} else {
		var disc = b * b - 4 * a * c;
		if (disc >= 0) {
			disc = Math.sqrt(disc);
			a = 2 * a;
			sol = [(-b - disc) / a, (-b + disc) / a];
		}
	}
	return sol;
}
 
Use the above like:
 
let t = intercept({
    x: mainCircle.x,
    y: mainCircle.y
}, {
    x: target.x,
    y: target.y,
    vx: avgXV - myXV,
    vy: avgYV - myYV
}, bulletSpeed);
t will have the x and y you should aim at (use Math.atan2)