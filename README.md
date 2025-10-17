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


New Version Menu:

GM_addStyle(
    `.main-div {
    position: absolute;
    top: 50%;
    margin-top: -225px;
    left: 50%;
    margin-left: -200px;
    width: 0px;
    height: 0px;
    overflow: hidden;
    background-color: rgba(19, 18, 18, 0.95);
    font-family: "Kanit", sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: rgb(212, 209, 209);
    z-index: 1000;
    border-style: solid;
    border-radius: 5%;
    animation: close 0.95s ease-in-out forwards;
  }

  .main-div.active {
    width: 400px;
    height: 450px;
    transform-origin: 200px 225px;
    z-index: 1000;
    animation: open 0.95s ease-in-out forwards;
  }

  .main-title {
    margin-bottom: 3rem;
  }

  .main-title .bottom {
    font-size: 5rem;
    position: relative;
  }

  .main-title span {
    font-size: 3rem;
    display: block;
    letter-spacing: 0.5rem;
    transform: translate(-30px, 30px);
  }

  /* menu */

  .menu button {
    color: rgb(190, 184, 184);
    display: block;
    position: relative;
    font-size: 2rem;
    text-transform: uppercase;
    background-color: transparent;
    border: none;
    cursor: pointer;
    overflow: hidden;
    width: 100%;
    height: 100%;
    margin-bottom: 1rem;
  }

  .menu button:hover {
    transform: scale(1.05);
    color: white;
  }

  .menu button::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border-bottom: 1px solid white;
    transform: scale(0, 1);
    transition: transform 250ms ease-out;
  }

  .menu button:hover::before {
    transform: scale(1, 1);
  }

  @keyframes open {
    0% {
      width: 0px;
      height: 0px;
      border-width: 10px;
      border-radius: 2%;
    }
    25% {
      width: 400px;
      height: 0px;
    }
    65% {
      border-radius: 5%;
    }
    100% {
      height: 450px;
      border-width: 10px;
      border-radius: 50% 20% / 10% 40%;
    }
  }

  @keyframes close {
    0% {
      width: 400px;
      height: 450px;
      border-width: 10px;
      border-radius: 50% 20% / 10% 40%;
    }
    45% {
      width: 400px;
      height: 0px;
      border-radius: 10%;
    }
    70% {
      width: 0px;
    }
    100% {
      border-width: 0px;
      width: 0px;
      height: 0px;

    }
  }
  `
);
/* ============menu toggle stuff=============== */
let menuOpt = {
    class: "main-div",
    keyToggle: "Escape",
};

window.addEventListener("keydown", (e) => {
    if (e.key == menuOpt.keyToggle) {
        let menu = document.querySelector(`.${menuOpt.class}`);
        menu.classList.toggle('active');
        console.log('test');
        // if (menu) menu.parentNode.removeChild(menu);
        // else openMenu();
    }
});

/* create menu to display */
let menuCreate = document.createElement("div");
menuCreate.className = menuOpt.class;
menuCreate.innerHTML = `
  <div class="main-title">
    <span>System</span>
    <div class="bottom">Settings</div>
  </div>

  <div class="combat menu">
    <button>Combat</button>
    <!-- <div class="options">
      <div id="instakill">Instakill</div>
      <div class="bull-spam">Bull Spam</div>
      <div class="combat-click">Click</div>
      change to macros when there is more than one
      <div id="combat-zoom">Combat Zoom</div>
    </div> -->
  </div>

  <div class="defense menu">
    <button>Defense</button>
    <!-- <div class="options"></div> -->
  </div>

  <div class="auto menu">
    <button>Auto</button>
  </div>
  <div class="extra menu">
    <button>Extras</button>
  </div>
</div>

`;
document.body.appendChild(menuCreate);
menuOptions();

function menuOptions() {
    const menuBtns = document.querySelectorAll(".menu");
    menuBtns.forEach((btn) => btn.addEventListener("click", () => displaySelection(btn)));
}

function displaySelection(ele) {
    console.log(ele);
}
