DiepScript.define("ui/menu", (require) => {
  // Recreates the Diep-style control panel so players can toggle features live.
  const state = require("core/state");
  const autofarm = require("features/autofarm");

  function ensureMenu() {
    if (state.menuContainer && state.menuContainer.parentNode) {
      state.menuContainer.style.display = "none";
      return;
    }

    // One-off stylesheet keeps the menu self-contained and avoids leaking to the page.
    const style = document.createElement("style");
    style.textContent = `
    :root{
      --inset-width: 100vw;
      --inset-height: 100vh;
      --netcolor0: #555555;
      --netcolor1: #999999;
      --netcolor2: #00b2e1;
      --netcolor3: #00b2e1;
      --netcolor4: #f14e54;
      --netcolor5: #bf7ff5;
      --netcolor6: #00e16e;
      --netcolor7: #8aff69;
      --netcolor8: #ffe869;
      --netcolor9: #fc7677;
      --netcolor10: #768dfc;
      --netcolor11: #f177dd;
      --netcolor12: #ffe869;
      --netcolor13: #43ff91;
      --netcolor14: #bbbbbb;
      --netcolor15: #f14e54;
      --netcolor16: #fcc376;
      --netcolor17: #c0c0c0;
      --net-border: var(--netcolor0);
      --net-cannon: var(--netcolor1);
      --net-tank: var(--netcolor2);
      --net-team-blue: var(--netcolor3);
      --net-team-red: var(--netcolor4);
      --net-team-purple: var(--netcolor5);
      --net-team-green: var(--netcolor6);
      --net-shiny: var(--netcolor7);
      --net-enemy-square: var(--netcolor8);
      --net-enemy-triangle: var(--netcolor9);
      --net-enemy-pentagon: var(--netcolor10);
      --net-neutral: var(--netcolor12);
      --uicolor0: #43fff9;
      --uicolor1: #82ff43;
      --uicolor2: #ff4343;
      --uicolor3: #ffde43;
      --uicolor4: #437fff;
      --uicolor5: #8543ff;
      --uicolor6: #f943ff;
      --border-color: rgba(0,0,0,0.375);
      --border-radius-setting: 6px;
      --panel-bg: rgba(10,14,20,0.95);
      --panel-accent: linear-gradient(180deg, rgba(0,178,225,0.12), rgba(0,142,180,0.06));
      --muted: #9fbfe6;
    }

    .diep-menu {
      position: fixed;
      top: 64px;
      left: 64px;
      width: 360px;
      background: var(--panel-bg);
      color: #e6f0fb;
      font-family: "Ubuntu", "Segoe UI", Arial, sans-serif;
      font-size: 13px;
      z-index: 999999;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      user-select: none;
      border: 1px solid var(--border-color);
      border-radius: calc(var(--border-radius-setting) * 1px);
      overflow: hidden;
    }
    .diep-header {
      display:flex;
      align-items:center;
      gap:10px;
      padding:10px 12px;
      background: var(--panel-accent);
      cursor: move;
      border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    .diep-title { font-weight:700; color:#fff; font-size:15px; }
    .diep-close {
      margin-left:auto;
      background: transparent;
      color: #fff;
      border: 1px solid rgba(255,255,255,0.06);
      width: 28px; height: 24px;
      display:inline-flex; align-items:center; justify-content:center;
      cursor:pointer;
    }

    .diep-body { padding: 12px; display:flex; flex-direction:column; gap:10px; }

    .diep-tabs { display:flex; gap:8px; }
    .diep-tab {
      flex:1;
      text-align:center;
      padding:6px 6px;
      background: rgba(255,255,255,0.02);
      color: var(--muted);
      cursor:pointer;
      border: 1px solid rgba(255,255,255,0.03);
      font-weight:600;
      user-select:none;
    }
    .diep-tab.active {
      background: linear-gradient(180deg, rgba(67,127,255,0.12), rgba(0,178,225,0.06));
      color: #fff;
      border-color: rgba(67,127,255,0.18);
    }

    .diep-section { display:none; padding-top:6px; }
    .diep-section.active { display:block; }

    .diep-row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.02); }
    .diep-row:last-child { border-bottom:none; }
    .diep-label { color:#dbeeff; font-weight:600; }

    .diep-checkbox { width:16px;height:16px; transform:scale(1.05); margin-left:6px; }

    .diep-slider { width:160px; }

    .diep-small { font-size:11px; color:var(--muted); margin-top:6px; line-height:1.2; }

    .diep-button {
      -webkit-tap-highlight-color: rgba(0,0,0,0);
      user-select:none;
      pointer-events: all;
      font-family: "Ubuntu", sans-serif;
      box-sizing: border-box;
      outline: none;
      padding: 0.35rem 0.6rem;
      cursor: pointer;
      border: calc(2.25px - 0.05px) solid var(--border-color);
      color: white;
      text-shadow: 0.8px 0.8px 0 #000, -0.8px 0.8px 0 #000;
      filter: brightness(95%) contrast(90%);
      transition: filter 0.12s ease-in-out, transform 0.06s ease;
      position: relative;
      font-size: 0.95em;
      background-color: var(--net-tank);
      border-left: 2.25px solid var(--border-color);
      border-right: 2.25px solid rgba(0,0,0,0.2);
      border-radius: calc(var(--border-radius-setting) * 0.28rem);
      height: 2.2rem;
      min-width: 8rem;
      display:inline-flex;
      align-items:center;
      justify-content:center;
    }
    .diep-button:active { transform: translateY(1px) scale(0.997); filter: brightness(92%); }

    .diep-select {
      width:100%;
      padding:8px;
      background: rgba(0,0,0,0.18);
      border:1px solid rgba(255,255,255,0.04);
      color:#e6f0fb;
    }

    .diep-footer { padding:8px 12px; font-size:11px; color:var(--muted); text-align:right; border-top:1px solid rgba(255,255,255,0.02); background: rgba(255,255,255,0.01); }
    .diep-menu * { pointer-events: auto; }
    @media (max-width: 480px) {
      .diep-menu { left: 12px; top: 12px; width: calc(100% - 24px); }
    }
  `;
    document.head.appendChild(style);

    const container = document.createElement("div");
    container.className = "diep-menu";

    const header = document.createElement("div");
    header.className = "diep-header";

    const title = document.createElement("div");
    title.className = "diep-title";
    title.innerText = "Swan RC";
    header.appendChild(title);

    const closeBtn = document.createElement("div");
    closeBtn.className = "diep-close";
    closeBtn.innerText = "×";
    closeBtn.title = "Close menu (M)";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      container.style.display = "none";
    });
    header.appendChild(closeBtn);

    const body = document.createElement("div");
    body.className = "diep-body";

    const tabsWrap = document.createElement("div");
    tabsWrap.className = "diep-tabs";
    // Tab metadata drives both the buttons and individual sections.
    const tabs = [
      { id: "spin", label: "Spin" },
      { id: "aim", label: "Aim" },
      { id: "farm", label: "Farm" },
      { id: "visuals", label: "Visuals" },
      { id: "builds", label: "Builds" },
      { id: "info", label: "Info" },
    ];
    const tabButtons = {};
    tabs.forEach((tab, idx) => {
      const btn = document.createElement("div");
      btn.className = "diep-tab" + (idx === 0 ? " active" : "");
      btn.id = `diep-tab-${tab.id}`;
      btn.innerText = tab.label;
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        switchTab(tab.id);
      });
      tabsWrap.appendChild(btn);
      tabButtons[tab.id] = btn;
    });
    body.appendChild(tabsWrap);

    const sections = {};
  function makeSection(id) {
      const sec = document.createElement("div");
      sec.className = "diep-section" + (id === "spin" ? " active" : "");
      sec.id = `diep-section-${id}`;
      sections[id] = sec;
      body.appendChild(sec);
      return sec;
    }

  function appendRowWithStop(sec, row) {
      row.addEventListener("mousedown", (e) => e.stopPropagation());
      row.addEventListener("click", (e) => e.stopPropagation());
      sec.appendChild(row);
    }

    const secSpin = makeSection("spin");
    {
      const row1 = document.createElement("div");
      row1.className = "diep-row";
      const label1 = document.createElement("div");
      label1.className = "diep-label";
      label1.innerText = "Enable Spinner";
      const cb1 = document.createElement("input");
      cb1.type = "checkbox";
      cb1.id = "spinner-checkbox";
      cb1.className = "diep-checkbox";
      cb1.checked = Boolean(state.isSpinning);
      cb1.addEventListener("change", function onSpinChange(e) {
        e.stopPropagation();
        state.isSpinning = this.checked;
        if (window.extern) {
          try {
            window.extern.inGameNotification(
              state.isSpinning ? "Spinner: ON" : "Spinner: OFF",
              0x2b7bb8
            );
          } catch (_error) {}
        }
      });
      row1.appendChild(label1);
      row1.appendChild(cb1);
      appendRowWithStop(secSpin, row1);

      const row2 = document.createElement("div");
      row2.className = "diep-row";
      const label2 = document.createElement("div");
      label2.className = "diep-label";
      label2.innerText = `Speed: ${state.spinSpeed.toFixed(2)}`;
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "2";
      slider.step = "0.01";
      slider.value = state.spinSpeed.toString();
      slider.className = "diep-slider";
      slider.id = "spin-slider";
      slider.addEventListener("input", (ev) => {
        ev.stopPropagation();
        state.spinSpeed = parseFloat(ev.target.value);
        label2.innerText = `Speed: ${state.spinSpeed.toFixed(2)}`;
      });
      row2.appendChild(label2);
      row2.appendChild(slider);
      appendRowWithStop(secSpin, row2);
    }

    const secAim = makeSection("aim");
    {
      const row1 = document.createElement("div");
      row1.className = "diep-row";
      const label1 = document.createElement("div");
      label1.className = "diep-label";
      label1.innerText = "Enable Aimbot";
      const cbA = document.createElement("input");
      cbA.type = "checkbox";
      cbA.id = "aimbot-checkbox";
      cbA.className = "diep-checkbox";
      cbA.checked = Boolean(state.isAimbotActive);
      cbA.addEventListener("change", function onAimChange(e) {
        e.stopPropagation();
        state.isAimbotActive = this.checked;
        if (window.extern) {
          try {
            window.extern.inGameNotification(
              state.isAimbotActive ? "Aimbot: ON" : "Aimbot: OFF",
              0x2b7bb8
            );
          } catch (_error) {}
        }
      });
      row1.appendChild(label1);
      row1.appendChild(cbA);
      appendRowWithStop(secAim, row1);

      const row2 = document.createElement("div");
      row2.className = "diep-row";
      const label2 = document.createElement("div");
      label2.className = "diep-label";
      label2.innerText = "Use Convar Bullet Speed";
      const cbB = document.createElement("input");
      cbB.type = "checkbox";
      cbB.id = "convar-bullet-checkbox";
      cbB.className = "diep-checkbox";
      cbB.checked = Boolean(state.useConvarBulletSpeed);
      cbB.addEventListener("change", function onConvarChange(e) {
        e.stopPropagation();
        state.useConvarBulletSpeed = this.checked;
      });
      row2.appendChild(label2);
      row2.appendChild(cbB);
      appendRowWithStop(secAim, row2);

      const row3 = document.createElement("div");
      row3.className = "diep-row";
      const label3 = document.createElement("div");
      label3.className = "diep-label";
      label3.innerText = "Drone Aim-Only";
      const cbDrone = document.createElement("input");
      cbDrone.type = "checkbox";
      cbDrone.id = "drone-aimonly-checkbox";
      cbDrone.className = "diep-checkbox";
      cbDrone.checked = Boolean(state.useDroneAimOnlyForMinions);
      cbDrone.addEventListener("change", function onDroneChange(e) {
        e.stopPropagation();
        state.useDroneAimOnlyForMinions = this.checked;
      });
      row3.appendChild(label3);
      row3.appendChild(cbDrone);
      appendRowWithStop(secAim, row3);
    }

    const secFarm = makeSection("farm");
    {
      const row1 = document.createElement("div");
      row1.className = "diep-row";
      const label1 = document.createElement("div");
      label1.className = "diep-label";
      label1.innerText = "Enable AutoFarm";
      const cbF = document.createElement("input");
      cbF.type = "checkbox";
      cbF.id = "autofarm-checkbox";
      cbF.className = "diep-checkbox";
      cbF.checked = Boolean(state.isAutoFarm);
      cbF.addEventListener("change", function onFarmChange(e) {
        e.stopPropagation();
        state.isAutoFarm = this.checked;
        if (!state.isAutoFarm) {
          autofarm.resetAutoAim();
        }
        if (window.extern) {
          try {
            window.extern.inGameNotification(
              state.isAutoFarm ? "AutoFarm: ON" : "AutoFarm: OFF",
              0x2b7bb8
            );
          } catch (_error) {}
        }
      });
      row1.appendChild(label1);
      row1.appendChild(cbF);
      appendRowWithStop(secFarm, row1);

      const row2 = document.createElement("div");
      row2.className = "diep-row";
      const label2 = document.createElement("div");
      label2.className = "diep-label";
      label2.innerText = "Autofarm on Right-Hold";
      const cbFH = document.createElement("input");
      cbFH.type = "checkbox";
      cbFH.id = "autofarm-hold-checkbox";
      cbFH.className = "diep-checkbox";
      cbFH.checked = Boolean(state.autofarmOnRightHold);
      cbFH.addEventListener("change", function onFarmHoldChange(e) {
        e.stopPropagation();
        state.autofarmOnRightHold = this.checked;
        if (window.extern) {
          try {
            window.extern.inGameNotification(
              state.autofarmOnRightHold
                ? "Autofarm on Right-Hold: ON"
                : "Autofarm on Right-Hold: OFF",
              0x2b7bb8
            );
          } catch (_error) {}
        }
      });
      row2.appendChild(label2);
      row2.appendChild(cbFH);
      appendRowWithStop(secFarm, row2);

      const priority = document.createElement("div");
      priority.className = "diep-small";
      priority.style.marginTop = "6px";
      priority.innerText = "Priority:";
      secFarm.appendChild(priority);

      const prioWrap = document.createElement("div");
      prioWrap.style.display = "flex";
      prioWrap.style.gap = "6px";
      prioWrap.style.marginTop = "6px";

      const createPriorityOption = (id, label, value) => {
        const wrapper = document.createElement("label");
        wrapper.style.flex = "1";
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "6px";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "farm-priority";
        input.id = `farm-priority-${id}`;
        input.value = value;
        input.checked = state.farmPriority === value;
        input.addEventListener("change", (e) => {
          e.stopPropagation();
          if (input.checked) state.farmPriority = value;
        });
        wrapper.appendChild(input);
        wrapper.appendChild(document.createTextNode(label));
        return wrapper;
      };

      prioWrap.appendChild(createPriorityOption("pentagon", "Pentagon", "pentagon"));
      prioWrap.appendChild(createPriorityOption("square", "Square", "square"));
      prioWrap.appendChild(createPriorityOption("triangle", "Triangle", "triangle"));
      secFarm.appendChild(prioWrap);
    }

    const secVis = makeSection("visuals");
    {
      const row1 = document.createElement("div");
      row1.className = "diep-row";
      const label1 = document.createElement("div");
      label1.className = "diep-label";
      label1.innerText = "Debug Lines";
      const cb1 = document.createElement("input");
      cb1.type = "checkbox";
      cb1.id = "debug-checkbox";
      cb1.className = "diep-checkbox";
      cb1.checked = Boolean(state.isDebug);
      cb1.addEventListener("change", function onDebugChange(e) {
        e.stopPropagation();
        state.isDebug = this.checked;
        if (window.extern) {
          try {
            window.extern.inGameNotification(
              state.isDebug ? "Debug Lines: ON" : "Debug Lines: OFF",
              0x2b7bb8
            );
          } catch (_error) {}
        }
      });
      row1.appendChild(label1);
      row1.appendChild(cb1);
      appendRowWithStop(secVis, row1);

      const row2 = document.createElement("div");
      row2.className = "diep-row";
      const label2 = document.createElement("div");
      label2.className = "diep-label";
      label2.innerText = "Bullet Speed Overlay";
      const cb2 = document.createElement("input");
      cb2.type = "checkbox";
      cb2.id = "show-bullet-speed-checkbox";
      cb2.className = "diep-checkbox";
      cb2.checked = Boolean(state.showBulletSpeeds);
      cb2.addEventListener("change", function onBulletOverlayChange(e) {
        e.stopPropagation();
        state.showBulletSpeeds = this.checked;
        if (window.extern) {
          try {
            window.extern.inGameNotification(
              state.showBulletSpeeds
                ? "Bullet Speed Overlay: ON"
                : "Bullet Speed Overlay: OFF",
              0x2b7bb8
            );
          } catch (_error) {}
        }
      });
      row2.appendChild(label2);
      row2.appendChild(cb2);
      appendRowWithStop(secVis, row2);

      const row3 = document.createElement("div");
      row3.className = "diep-row";
      const label3 = document.createElement("div");
      label3.className = "diep-label";
      label3.innerText = "Black Background";
      const cb3 = document.createElement("input");
      cb3.type = "checkbox";
      cb3.id = "blackbg-checkbox";
      cb3.className = "diep-checkbox";
      cb3.checked = Boolean(state.isBlackBg);
      cb3.addEventListener("change", function onBlackBgChange(e) {
        e.stopPropagation();
        state.isBlackBg = this.checked;
        try {
          if (window.input && typeof window.input.set_convar === "function") {
            window.input.set_convar(
              "ren_background_color",
              state.isBlackBg ? "#000000" : "#CDCDCD"
            );
          }
          if (window.extern) {
            window.extern.inGameNotification(
              state.isBlackBg ? "Black background: ON" : "Black background: OFF",
              0x2b7bb8
            );
          }
        } catch (_error) {}
      });
      row3.appendChild(label3);
      row3.appendChild(cb3);
      appendRowWithStop(secVis, row3);
    }

    const secBuilds = makeSection("builds");
    {
      // Predefined upgrade strings – mirrors the original script’s build list.
      const presets = [
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
      ];

      const buildSelect = document.createElement("select");
      buildSelect.id = "builds-select";
      buildSelect.className = "diep-select";
      buildSelect.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        buildSelect.focus();
      });
      presets.forEach((preset) => {
        const option = document.createElement("option");
        option.value = preset.build;
        option.innerText = preset.name;
        buildSelect.appendChild(option);
      });
      secBuilds.appendChild(buildSelect);

      const applyRow = document.createElement("div");
      applyRow.className = "diep-row";
      const applyBtn = document.createElement("button");
      applyBtn.className = "diep-button";
      applyBtn.innerText = "Apply Build";
      applyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        applySelectedBuild();
      });
      applyRow.appendChild(applyBtn);
      appendRowWithStop(secBuilds, applyRow);

      const autoRow = document.createElement("div");
      autoRow.className = "diep-row";
      const labelAuto = document.createElement("div");
      labelAuto.className = "diep-label";
      labelAuto.innerText = "Auto-Apply Build";
      const cbAuto = document.createElement("input");
      cbAuto.type = "checkbox";
      cbAuto.id = "autobuild-checkbox";
      cbAuto.className = "diep-checkbox";
      cbAuto.checked = false;
      autoRow.appendChild(labelAuto);
      autoRow.appendChild(cbAuto);
      appendRowWithStop(secBuilds, autoRow);

      const info = document.createElement("div");
      info.className = "diep-small";
      info.innerText =
        "Auto-Apply will attempt to set your build repeatedly while enabled.";
      info.addEventListener("mousedown", (e) => e.stopPropagation());
      secBuilds.appendChild(info);

      let autobuildInterval = null;
      function tryExecuteBuildCommand(buildString) {
        try {
          if (window.input && typeof window.input.execute === "function") {
            window.input.execute(`game_stats_build ${buildString}`);
            return true;
          }
        } catch (_error) {}
        try {
          if (window.extern && typeof window.extern.execute === "function") {
            window.extern.execute(`game_stats_build ${buildString}`);
            return true;
          }
        } catch (_error) {}
        try {
          if (window.input && typeof window.input.set_convar === "function") {
            window.input.set_convar("game_stats_build", buildString);
            return true;
          }
        } catch (_error) {}
        return false;
      }
      function applySelectedBuild() {
        const build = buildSelect.value;
        if (!build) return;
        const ok = tryExecuteBuildCommand(build);
        if (!ok && window.extern) {
          try {
            window.extern.inGameNotification(
              "Failed to apply build (no executor found)",
              0xff5e5e
            );
          } catch (_error) {}
        } else if (window.extern) {
          try {
            window.extern.inGameNotification("Applied build", 0x2b7bb8);
          } catch (_error) {}
        }
      }
      function startAutoBuild() {
        if (autobuildInterval) return;
        autobuildInterval = setInterval(() => {
          const build = buildSelect.value;
          if (!build) return;
          tryExecuteBuildCommand(build);
        }, 2500);
      }
      function stopAutoBuild() {
        if (!autobuildInterval) return;
        clearInterval(autobuildInterval);
        autobuildInterval = null;
      }

      cbAuto.addEventListener("change", function (e) {
        e.stopPropagation();
        if (this.checked) startAutoBuild();
        else stopAutoBuild();
      });

      container.applySelectedBuild = applySelectedBuild;
    }

    const secInfo = makeSection("info");
    {
      const infoText = document.createElement("div");
      infoText.className = "diep-small";
      infoText.style.whiteSpace = "normal";
      infoText.style.lineHeight = "1.3";
      infoText.innerHTML =
        "<strong>Swan RC</strong><br>Diep-styled control panel. Keys: U = aimbot, I = stack, M = toggle menu.";
      infoText.addEventListener("mousedown", (e) => e.stopPropagation());
      secInfo.appendChild(infoText);
    }

    const footer = document.createElement("div");
    footer.className = "diep-footer";
    footer.textContent = "Swan RC";

    container.appendChild(header);
    container.appendChild(body);
    container.appendChild(footer);

    document.body.appendChild(container);
    container.style.display = "none";

    function switchTab(id) {
      Object.keys(sections).forEach((key) => {
        sections[key].classList.toggle("active", key === id);
      });
      Object.keys(tabButtons).forEach((key) => {
        tabButtons[key].classList.toggle("active", key === id);
      });
    }

    (function makeDraggable(target, handle) {
      let dragging = false;
      let offsetX = 0;
      let offsetY = 0;
      handle.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        dragging = true;
        const rect = target.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        e.preventDefault();
      });
      function onMove(e) {
        if (!dragging) return;
        target.style.left = `${e.clientX - offsetX}px`;
        target.style.top = `${e.clientY - offsetY}px`;
      }
      function onUp() {
        dragging = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }
    })(container, header);

    try {
      document.getElementById("spinner-checkbox").checked = Boolean(state.isSpinning);
      document.getElementById("spin-slider").value = state.spinSpeed;
      document.getElementById("aimbot-checkbox").checked = Boolean(state.isAimbotActive);
      document.getElementById("convar-bullet-checkbox").checked = Boolean(
        state.useConvarBulletSpeed
      );
      document.getElementById("drone-aimonly-checkbox").checked = Boolean(
        state.useDroneAimOnlyForMinions
      );
      document.getElementById("autofarm-checkbox").checked = Boolean(state.isAutoFarm);
      document.getElementById("autofarm-hold-checkbox").checked = Boolean(
        state.autofarmOnRightHold
      );
      document.getElementById("show-bullet-speed-checkbox").checked = Boolean(
        state.showBulletSpeeds
      );
      document.getElementById("debug-checkbox").checked = Boolean(state.isDebug);
      document.getElementById("blackbg-checkbox").checked = Boolean(state.isBlackBg);
    } catch (_error) {}

    state.menuContainer = container;
  }

  return {
    ensureMenu,
  };
});
