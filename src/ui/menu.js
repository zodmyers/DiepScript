DiepScript.define("ui/menu", (require) => {
  // Recreates the Diep-style control panel using the new layout shared in README.
  // Sections: Combat, Auto, Defense, Extras.
  const state = require("core/state");
  const autofarm = require("features/autofarm");

  const PANEL_IDS = ["combat", "auto", "defense", "extras"];

  function ensureMenu() {
    if (state.menuContainer && state.menuContainer.parentNode) {
      if (typeof state.menuContainer.__hide === "function") {
        state.menuContainer.__hide();
      } else {
        state.menuContainer.style.display = "none";
      }
      return;
    }

    injectStyles();

    const container = document.createElement("div");
    container.className = "ds-menu";
    container.dataset.open = "false";

    // expose helpers so the input hook can trigger the animation-aware show/hide
    const showMenu = () => {
      container.style.display = "flex";
      // delay to next frame so the animation runs each time
      requestAnimationFrame(() => {
        container.classList.add("active");
        container.dataset.open = "true";
      });
    };
    const hideMenu = () => {
      container.classList.remove("active");
      container.dataset.open = "false";
      setTimeout(() => {
        if (container.dataset.open !== "true") {
          container.style.display = "none";
        }
      }, 500); // allow close animation to finish
    };
    container.__show = showMenu;
    container.__hide = hideMenu;
    container.__toggle = () => (container.dataset.open === "true" ? hideMenu() : showMenu());

    const title = document.createElement("div");
    title.className = "ds-title";
    title.innerHTML = `
      <span class="ds-title-prefix">System</span>
      <div class="ds-title-main">Settings</div>
    `;
    container.appendChild(title);

    const shell = document.createElement("div");
    shell.className = "ds-shell";
    container.appendChild(shell);

    const nav = document.createElement("nav");
    nav.className = "ds-nav";
    shell.appendChild(nav);

    const panelsWrap = document.createElement("div");
    panelsWrap.className = "ds-panels";
    shell.appendChild(panelsWrap);

    const navButtons = {};
    PANEL_IDS.forEach((id, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.panel = id;
      btn.className = "ds-nav-btn" + (idx === 0 ? " active" : "");
      btn.innerText = id.charAt(0).toUpperCase() + id.slice(1);
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        switchPanel(id, navButtons, panelsWrap);
      });
      nav.appendChild(btn);
      navButtons[id] = btn;
    });

    const combatPanel = createPanel("combat", panelsWrap, true);
    const autoPanel = createPanel("auto", panelsWrap);
    const defensePanel = createPanel("defense", panelsWrap);
    const extrasPanel = createPanel("extras", panelsWrap);

    populateCombatPanel(combatPanel);
    populateAutoPanel(autoPanel);
    populateDefensePanel(defensePanel);
    populateExtrasPanel(extrasPanel);

    document.body.appendChild(container);
    container.style.display = "none";
    state.menuContainer = container;
  }

  function injectStyles() {
    if (document.getElementById("diepscript-menu-styles")) return;
    const style = document.createElement("style");
    style.id = "diepscript-menu-styles";
    style.textContent = `
      .ds-menu {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 0;
        height: 0;
        display: none;
        flex-direction: column;
        justify-content: flex-start;
        align-items: stretch;
        background: rgba(12, 18, 28, 0.94);
        color: #dbeeff;
        font-family: "Ubuntu", "Segoe UI", Arial, sans-serif;
        border: 1px solid rgba(0, 178, 225, 0.35);
        border-radius: 18px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.65);
        z-index: 100000;
        overflow: hidden;
        pointer-events: auto;
        animation: ds-close 0.65s ease forwards;
      }

      .ds-menu.active {
        width: 560px;
        height: 430px;
        animation: ds-open 0.65s ease forwards;
      }

      .ds-title {
        padding: 24px 28px 12px;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .ds-title-prefix {
        display: block;
        color: rgba(219, 238, 255, 0.68);
        font-size: 16px;
        margin-bottom: 4px;
      }
      .ds-title-main {
        font-size: 34px;
        font-weight: 700;
        color: #ffffff;
        text-shadow: 0 0 16px rgba(0, 178, 225, 0.35);
      }

      .ds-shell {
        flex: 1;
        display: flex;
        gap: 18px;
        padding: 0 24px 24px;
      }

      .ds-nav {
        width: 148px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ds-nav-btn {
        position: relative;
        padding: 12px 16px;
        border: 1px solid rgba(0, 178, 225, 0.18);
        border-radius: 10px;
        background: rgba(0, 178, 225, 0.08);
        color: rgba(219, 238, 255, 0.75);
        font-size: 15px;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
        transition: transform 0.12s ease, border-color 0.12s ease, color 0.12s ease, background 0.12s ease;
      }

      .ds-nav-btn::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border: 1px solid rgba(255, 255, 255, 0.08);
        opacity: 0;
        transition: opacity 0.15s ease;
      }

      .ds-nav-btn:hover {
        transform: translateX(4px);
        color: #ffffff;
        border-color: rgba(0, 178, 225, 0.35);
        background: rgba(0, 178, 225, 0.12);
      }

      .ds-nav-btn.active {
        color: #ffffff;
        background: linear-gradient(135deg, rgba(0, 178, 225, 0.22), rgba(67, 127, 255, 0.28));
        border-color: rgba(67, 127, 255, 0.4);
      }
      .ds-nav-btn.active::after {
        opacity: 1;
      }

      .ds-panels {
        flex: 1;
        min-width: 0;
        background: rgba(5, 10, 18, 0.65);
        border: 1px solid rgba(0, 178, 225, 0.12);
        border-radius: 14px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow-y: auto;
      }

      .ds-panel {
        display: none;
        flex-direction: column;
        gap: 14px;
      }

      .ds-panel.active {
        display: flex;
      }

      .ds-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      }

      .ds-row label {
        font-weight: 600;
        color: #f4fbff;
      }

      .ds-row-text {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .ds-row.ds-row--stacked {
        flex-direction: column;
        align-items: flex-start;
      }
      .ds-row.ds-row--stacked label {
        margin-bottom: 6px;
      }

      .ds-row input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #00b2e1;
      }

      .ds-row input[type="range"] {
        flex: 1;
        margin-left: 12px;
        accent-color: #00b2e1;
      }

      .ds-row .ds-value {
        min-width: 80px;
        text-align: right;
        font-size: 13px;
        color: rgba(219, 238, 255, 0.7);
      }

      .ds-row .ds-hint {
        font-size: 12px;
        color: rgba(219, 238, 255, 0.6);
        margin-top: 6px;
      }

      .ds-build-block {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ds-select {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.06);
        color: #dbeeff;
        font-size: 14px;
      }

      .ds-button {
        align-self: flex-start;
        padding: 10px 18px;
        border-radius: 10px;
        border: 1px solid rgba(0, 178, 225, 0.35);
        background: linear-gradient(135deg, rgba(0, 178, 225, 0.35), rgba(67, 127, 255, 0.4));
        color: #ffffff;
        font-weight: 600;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }

      .ds-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgba(0, 178, 225, 0.25);
      }

      .ds-info {
        font-size: 13px;
        line-height: 1.5;
        color: rgba(219, 238, 255, 0.72);
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 12px;
      }

      @keyframes ds-open {
        0% {
          width: 0;
          height: 0;
          border-radius: 30%;
        }
        40% {
          width: 560px;
          height: 0;
        }
        100% {
          width: 560px;
          height: 430px;
          border-radius: 18px;
        }
      }

      @keyframes ds-close {
        0% {
          width: 560px;
          height: 430px;
        }
        60% {
          width: 560px;
          height: 0;
        }
        100% {
          width: 0;
          height: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createPanel(id, wrap, active = false) {
    const panel = document.createElement("section");
    panel.className = "ds-panel" + (active ? " active" : "");
    panel.id = `ds-panel-${id}`;
    wrap.appendChild(panel);
    panel.addEventListener("mousedown", (e) => e.stopPropagation());
    panel.addEventListener("click", (e) => e.stopPropagation());
    return panel;
  }

  function switchPanel(id, navButtons, panelsWrap) {
    Object.values(navButtons).forEach((btn) => btn.classList.remove("active"));
    if (navButtons[id]) navButtons[id].classList.add("active");

    panelsWrap.querySelectorAll(".ds-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `ds-panel-${id}`);
    });
  }

  function createToggleRow({ id, label, checked, onChange, hint }) {
    const row = document.createElement("div");
    row.className = "ds-row";

    const textWrap = document.createElement("div");
    textWrap.className = "ds-row-text";
    const labelEl = document.createElement("label");
    labelEl.htmlFor = id;
    labelEl.innerText = label;
    textWrap.appendChild(labelEl);

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = id;
    toggle.checked = checked;
    toggle.addEventListener("change", (ev) => {
      ev.stopPropagation();
      onChange(ev.target.checked);
    });
    if (hint) {
      const hintEl = document.createElement("div");
      hintEl.className = "ds-hint";
      hintEl.innerText = hint;
      textWrap.appendChild(hintEl);
    }

    row.appendChild(textWrap);
    row.appendChild(toggle);

    row.addEventListener("mousedown", (e) => e.stopPropagation());
    row.addEventListener("click", (e) => e.stopPropagation());
    return row;
  }

  function createRangeRow({ id, label, min, max, step, value, onInput }) {
    const row = document.createElement("div");
    row.className = "ds-row";

    const labelEl = document.createElement("label");
    labelEl.innerText = label;
    labelEl.htmlFor = id;
    row.appendChild(labelEl);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = id;
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);
    row.appendChild(slider);

    const valueEl = document.createElement("div");
    valueEl.className = "ds-value";
    valueEl.innerText = value.toFixed(2);
    row.appendChild(valueEl);

    slider.addEventListener("input", (ev) => {
      ev.stopPropagation();
      const val = parseFloat(ev.target.value);
      valueEl.innerText = val.toFixed(2);
      onInput(val);
    });

    row.addEventListener("mousedown", (e) => e.stopPropagation());
    row.addEventListener("click", (e) => e.stopPropagation());
    return row;
  }

  function populateCombatPanel(panel) {
    panel.appendChild(
      createToggleRow({
        id: "ds-spinner-toggle",
        label: "Spinner",
        checked: Boolean(state.isSpinning),
        onChange: (checked) => {
          state.isSpinning = checked;
          try {
            window.extern?.inGameNotification?.(checked ? "Spinner: ON" : "Spinner: OFF", 0x2b7bb8);
          } catch (_) {}
        },
      })
    );

    panel.appendChild(
      createRangeRow({
        id: "ds-spin-speed",
        label: "Spin Speed",
        min: 0,
        max: 2,
        step: 0.01,
        value: state.spinSpeed,
        onInput: (val) => {
          state.spinSpeed = val;
        },
      })
    );

    panel.appendChild(
      createToggleRow({
        id: "ds-aimbot-toggle",
        label: "Aimbot",
        checked: Boolean(state.isAimbotActive),
        onChange: (checked) => {
          state.isAimbotActive = checked;
          try {
            window.extern?.inGameNotification?.(checked ? "Aimbot: ON" : "Aimbot: OFF", 0xf533ff);
          } catch (_) {}
        },
      })
    );

    panel.appendChild(
      createToggleRow({
        id: "ds-convar-toggle",
        label: "Use Convar Bullet Speed",
        checked: Boolean(state.useConvarBulletSpeed),
        hint: "Reads bullet speed from game stats for prediction.",
        onChange: (checked) => {
          state.useConvarBulletSpeed = checked;
        },
      })
    );

    panel.appendChild(
      createToggleRow({
        id: "ds-drone-toggle",
        label: "Drone Aim-Only",
        checked: Boolean(state.useDroneAimOnlyForMinions),
        hint: "Keeps minions from firing, only aims for drone classes.",
        onChange: (checked) => {
          state.useDroneAimOnlyForMinions = checked;
        },
      })
    );

    panel.appendChild(
      createToggleRow({
        id: "ds-bullet-overlay-toggle",
        label: "Bullet Speed Overlay",
        checked: Boolean(state.showBulletSpeeds),
        onChange: (checked) => {
          state.showBulletSpeeds = checked;
          try {
            window.extern?.inGameNotification?.(
              checked ? "Bullet Speed Overlay: ON" : "Bullet Speed Overlay: OFF",
              0x2b7bb8
            );
          } catch (_) {}
        },
      })
    );
  }

  function populateAutoPanel(panel) {
    panel.appendChild(
      createToggleRow({
        id: "ds-autofarm-toggle",
        label: "AutoFarm",
        checked: Boolean(state.isAutoFarm),
        onChange: (checked) => {
          state.isAutoFarm = checked;
          if (!checked) autofarm.resetAutoAim();
          try {
            window.extern?.inGameNotification?.(checked ? "AutoFarm: ON" : "AutoFarm: OFF", 0x2b7bb8);
          } catch (_) {}
        },
      })
    );

    panel.appendChild(
      createToggleRow({
        id: "ds-autorighthold-toggle",
        label: "AutoFarm on Right-Hold",
        checked: Boolean(state.autofarmOnRightHold),
        onChange: (checked) => {
          state.autofarmOnRightHold = checked;
          try {
            window.extern?.inGameNotification?.(
              checked ? "Autofarm on Right-Hold: ON" : "Autofarm on Right-Hold: OFF",
              0x2b7bb8
            );
          } catch (_) {}
        },
      })
    );
  }

  function populateDefensePanel(panel) {
    panel.appendChild(
      createToggleRow({
        id: "ds-debug-toggle",
        label: "Debug Lines",
        checked: Boolean(state.isDebug),
        onChange: (checked) => {
          state.isDebug = checked;
          try {
            window.extern?.inGameNotification?.(checked ? "Debug Lines: ON" : "Debug Lines: OFF", 0x2b7bb8);
          } catch (_) {}
        },
      })
    );

    panel.appendChild(
      createToggleRow({
        id: "ds-blackbg-toggle",
        label: "Black Background",
        checked: Boolean(state.isBlackBg),
        onChange: (checked) => {
          state.isBlackBg = checked;
          try {
            window.input?.set_convar?.("ren_background_color", checked ? "#000000" : "#CDCDCD");
            window.extern?.inGameNotification?.(
              checked ? "Black background: ON" : "Black background: OFF",
              0x2b7bb8
            );
          } catch (_) {}
        },
      })
    );
  }

  function populateExtrasPanel(panel) {
    const buildBlock = document.createElement("div");
    buildBlock.className = "ds-build-block";

    const buildSelect = document.createElement("select");
    buildSelect.id = "ds-build-select";
    buildSelect.className = "ds-select";
    buildSelect.addEventListener("mousedown", (e) => e.stopPropagation());
    buildSelect.addEventListener("click", (e) => e.stopPropagation());
    [
      { name: "rocketeer", build: "565656565656567878787878787822333" },
      { name: "skimmer", build: "565656565656484848484848487777777" },
      { name: "factory", build: "565656565656564848484848484777777" },
      { name: "spike", build: "5656565656565677744487777888222222222233333333338888888888111" },
      { name: "autosmasher", build: "5656565656565677744487777888222222222233333333338888888888111" },
      { name: "annihilator", build: "565656565656484848484848487777777" },
      { name: "battleship", build: "565656565656564848484848447777777" },
      { name: "autotrapper", build: "565656565656564444848877787878787" },
      { name: "streamliner", build: "565656565656564444488888878777777" },
      { name: "spreadshot", build: "565656565656567878787878787843242" },
      { name: "auto5", build: "565656565656567847847847847847878" },
      { name: "autogunner", build: "565656565656567847847847847847878" },
      { name: "landmine", build: "5656565656565677744487777888222222222233333333338888888888111" },
      { name: "tritrap", build: "565656565656564444888777787878787" },
      { name: "combattrap", build: "565656565656564444888777787878787" },
      { name: "booster", build: "565656565656567878788888888422222" },
      { name: "fighter", build: "565656565656567878788888888422222" },
      { name: "overseer", build: "565656565656565656565656567878787" },
      { name: "overlord", build: "565656565656565656565656567878787" },
    ].forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.build;
      option.innerText = preset.name;
      buildSelect.appendChild(option);
    });
    buildBlock.appendChild(buildSelect);

    const applyButton = document.createElement("button");
    applyButton.className = "ds-button";
    applyButton.type = "button";
    applyButton.innerText = "Apply Build";
    buildBlock.appendChild(applyButton);

    const autoApplyRow = createToggleRow({
      id: "ds-autobuild-toggle",
      label: "Auto-Apply Build",
      checked: false,
      hint: "Attempts to reapply your selected build every few seconds.",
      onChange: () => {},
    });

    panel.appendChild(buildBlock);
    panel.appendChild(autoApplyRow);

    const info = document.createElement("div");
    info.className = "ds-info";
    info.innerHTML =
      "<strong>Swan RC</strong><br>Diep-styled control panel. Keys: U = aimbot, I = stack, M = toggle menu.";
    panel.appendChild(info);

    // Implementation helpers
    let autobuildInterval = null;
    const startAutoBuild = () => {
      if (autobuildInterval) return;
      autobuildInterval = setInterval(() => {
        const build = buildSelect.value;
        if (!build) return;
        applyBuild(build);
      }, 2500);
    };
    const stopAutoBuild = () => {
      if (!autobuildInterval) return;
      clearInterval(autobuildInterval);
      autobuildInterval = null;
    };

    const applyBuild = (buildString) => {
      const tryExecute = () => {
        try {
          if (window.input && typeof window.input.execute === "function") {
            window.input.execute(`game_stats_build ${buildString}`);
            return true;
          }
        } catch (_) {}
        try {
          if (window.extern && typeof window.extern.execute === "function") {
            window.extern.execute(`game_stats_build ${buildString}`);
            return true;
          }
        } catch (_) {}
        try {
          if (window.input && typeof window.input.set_convar === "function") {
            window.input.set_convar("game_stats_build", buildString);
            return true;
          }
        } catch (_) {}
        return false;
      };

      const ok = tryExecute();
      if (!ok) {
        try {
          window.extern?.inGameNotification?.("Failed to apply build (no executor found)", 0xff5e5e);
        } catch (_) {}
      } else {
        try {
          window.extern?.inGameNotification?.("Applied build", 0x2b7bb8);
        } catch (_) {}
      }
    };

    applyButton.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const build = buildSelect.value;
      if (build) applyBuild(build);
    });

    const autoToggle = autoApplyRow.querySelector("input[type=checkbox]");
    autoToggle.addEventListener("change", (ev) => {
      ev.stopPropagation();
      if (ev.target.checked) startAutoBuild();
      else stopAutoBuild();
    });

    // keep API parity with previous version
    const menuContainer = panel.parentElement?.parentElement?.parentElement;
    if (menuContainer) {
      menuContainer.applySelectedBuild = () => {
        const build = buildSelect.value;
        if (build) applyBuild(build);
      };
    }
  }

  return {
    ensureMenu,
  };
});
