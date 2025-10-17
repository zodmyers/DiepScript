DiepScript.define("ui/menu", (require) => {
  // Replaces the original Diep-style control panel with the new visual design
  // while preserving all original element IDs and functionality.
  const state = require("core/state");
  const autofarm = require("features/autofarm");

  function ensureMenu() {
    if (state.menuContainer && state.menuContainer.parentNode) {
      // If the menu exists, toggle visibility by removing/adding .active
      const el = state.menuContainer;
      if (el.classList.contains("active")) {
        el.classList.remove("active");
        // let original hide behavior still possible
        setTimeout(() => (el.style.display = "none"), 950);
      } else {
        el.style.display = "flex";
        // allow layout, then animate open
        requestAnimationFrame(() => el.classList.add("active"));
      }
      return;
    }

    // Inject the new CSS (derived from the provided menu design)
    const style = document.createElement("style");
    style.textContent = `
/* Wrapper and animation from the provided design */
.main-div {
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
  z-index: 1000000;
  border-style: solid;
  border-radius: 5%;
  animation: close 0.95s ease-in-out forwards;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  user-select: none;
  gap: 8px;
  padding: 12px;
}

.main-div.active {
  width: 400px;
  height: 450px;
  transform-origin: 200px 225px;
  z-index: 1000000;
  animation: open 0.95s ease-in-out forwards;
}

/* header */
.main-title {
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:8px;
}
.main-title .bottom {
  font-size: 1.25rem;
  position: relative;
}
.main-title span {
  font-size: 1rem;
  display: block;
  letter-spacing: 0.2rem;
  transform: translate(-8px, 8px);
}

/* menu buttons (tabs) */
.menu-row {
  display:flex;
  width:100%;
  gap:8px;
  justify-content:space-between;
}
.menu {
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:stretch;
}
.menu button {
  color: rgb(190, 184, 184);
  display: block;
  position: relative;
  font-size: 1rem;
  text-transform: uppercase;
  background-color: transparent;
  border: none;
  cursor: pointer;
  overflow: hidden;
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 6px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.03);
  color: #dbeeff;
  font-weight:600;
}
.menu button:hover { transform: scale(1.02); color: #fff; }
.menu button.active { background: linear-gradient(180deg, rgba(67,127,255,0.12), rgba(0,178,225,0.06)); color: #fff; border-color: rgba(67,127,255,0.18); }

/* sections */
.section-wrap {
  width: 100%;
  display:block;
  padding-top:8px;
  overflow: auto;
  flex:1;
}
.section {
  display:none;
}
.section.active { display:block; }

/* rows and labels (kept simple so existing ids and controls fit) */
.row {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  padding:6px 0;
  border-bottom:1px solid rgba(255,255,255,0.02);
}
.row:last-child { border-bottom:none; }
.label { color:#dbeeff; font-weight:600; font-size:0.95rem; }
.small { font-size:0.8rem; color:#9fbfe6; margin-top:6px; line-height:1.2; }

/* inputs */
.diepcb { width:16px; height:16px; transform:scale(1.05); margin-left:6px; }
.slider { width:160px; }

/* footer */
.footer { margin-top:8px; font-size:0.85rem; color:#9fbfe6; }

/* open/close animations (copied from provided file) */
@keyframes open {
  0% { width: 0px; height: 0px; border-width: 10px; border-radius: 2%; }
  25% { width: 400px; height: 0px; }
  65% { border-radius: 5%; }
  100% { height: 450px; border-width: 10px; border-radius: 50% 20% / 10% 40%; }
}
@keyframes close {
  0% { width: 400px; height: 450px; border-width: 10px; border-radius: 50% 20% / 10% 40%; }
  45% { width: 400px; height: 0px; border-radius: 10%; }
  70% { width: 0px; }
  100% { border-width: 0px; width: 0px; height: 0px; }
}
`;
    document.head.appendChild(style);

    // Create container using new design class
    const container = document.createElement("div");
    container.className = "main-div";
    container.style.display = "none";

    // Header/title
    const titleWrap = document.createElement("div");
    titleWrap.className = "main-title";
    titleWrap.innerHTML = `<span>System</span><div class="bottom">Settings</div>`;
    container.appendChild(titleWrap);

    // Tab buttons (we keep the same logical tabs as before)
    const tabs = [
      { id: "spin", label: "Spin" },
      { id: "aim", label: "Aim" },
      { id: "farm", label: "Farm" },
      { id: "visuals", label: "Visuals" },
      { id: "builds", label: "Builds" },
      { id: "info", label: "Info" },
    ];

    const menuRow = document.createElement("div");
    menuRow.className = "menu-row";

    const leftMenu = document.createElement("div");
    leftMenu.className = "menu";

    const rightMenu = document.createElement("div");
    rightMenu.className = "menu";

    // We'll create three tab buttons on left and three on right to resemble the provided layout
    tabs.slice(0, 3).forEach((t, i) => {
      const btn = document.createElement("button");
      btn.id = `tab-btn-${t.id}`;
      btn.innerText = t.label;
      if (i === 0) btn.classList.add("active");
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        switchSection(t.id);
      });
      leftMenu.appendChild(btn);
    });
    tabs.slice(3).forEach((t, i) => {
      const btn = document.createElement("button");
      btn.id = `tab-btn-${t.id}`;
      btn.innerText = t.label;
      if (i === 0) btn.classList.add("active");
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        switchSection(t.id);
      });
      rightMenu.appendChild(btn);
    });

    menuRow.appendChild(leftMenu);
    menuRow.appendChild(rightMenu);
    container.appendChild(menuRow);

    // Section wrapper
    const sectionWrap = document.createElement("div");
    sectionWrap.className = "section-wrap";

    // helper to create sections and keep original ids for inputs
    const sections = {};
    function makeSection(id) {
      const sec = document.createElement("div");
      sec.className = "section";
      if (id === "spin") sec.classList.add("active");
      sec.id = `section-${id}`;
      sections[id] = sec;
      sectionWrap.appendChild(sec);
      return sec;
    }

    function appendRow(sec, labelText, inputEl) {
      const row = document.createElement("div");
      row.className = "row";
      const label = document.createElement("div");
      label.className = "label";
      label.innerText = labelText;
      row.appendChild(label);
      row.appendChild(inputEl);
      // stop clicks from bubbling to global toggles
      row.addEventListener("mousedown", (e) => e.stopPropagation());
      row.addEventListener("click", (e) => e.stopPropagation());
      sec.appendChild(row);
      return row;
    }

    // Spin section (keep original IDs)
    const secSpin = makeSection("spin");
    {
      const cb1 = document.createElement("input");
      cb1.type = "checkbox";
      cb1.id = "spinner-checkbox";
      cb1.className = "diepcb";
      cb1.checked = Boolean(state.isSpinning);
      cb1.addEventListener("change", function (e) {
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
      appendRow(secSpin, "Enable Spinner", cb1);

      const labelAndSlider = document.createElement("div");
      labelAndSlider.style.display = "flex";
      labelAndSlider.style.flexDirection = "column";
      labelAndSlider.style.alignItems = "flex-end";
      const speedLabel = document.createElement("div");
      speedLabel.className = "small";
      speedLabel.id = "spin-speed-label";
      speedLabel.innerText = `Speed: ${state.spinSpeed.toFixed(2)}`;
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "2";
      slider.step = "0.01";
      slider.value = state.spinSpeed.toString();
      slider.id = "spin-slider";
      slider.className = "slider";
      slider.addEventListener("input", (ev) => {
        ev.stopPropagation();
        state.spinSpeed = parseFloat(ev.target.value);
        speedLabel.innerText = `Speed: ${state.spinSpeed.toFixed(2)}`;
      });
      labelAndSlider.appendChild(speedLabel);
      labelAndSlider.appendChild(slider);
      const row = document.createElement("div");
      row.className = "row";
      const lbl = document.createElement("div");
      lbl.className = "label";
      lbl.innerText = "Speed";
      row.appendChild(lbl);
      row.appendChild(labelAndSlider);
      row.addEventListener("mousedown", (e) => e.stopPropagation());
      row.addEventListener("click", (e) => e.stopPropagation());
      secSpin.appendChild(row);
    }

    // Aim section
    const secAim = makeSection("aim");
    {
      const cbA = document.createElement("input");
      cbA.type = "checkbox";
      cbA.id = "aimbot-checkbox";
      cbA.className = "diepcb";
      cbA.checked = Boolean(state.isAimbotActive);
      cbA.addEventListener("change", function (e) {
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
      appendRow(secAim, "Enable Aimbot", cbA);

      const cbB = document.createElement("input");
      cbB.type = "checkbox";
      cbB.id = "convar-bullet-checkbox";
      cbB.className = "diepcb";
      cbB.checked = Boolean(state.useConvarBulletSpeed);
      cbB.addEventListener("change", function (e) {
        e.stopPropagation();
        state.useConvarBulletSpeed = this.checked;
      });
      appendRow(secAim, "Use Convar Bullet Speed", cbB);

      const cbDrone = document.createElement("input");
      cbDrone.type = "checkbox";
      cbDrone.id = "drone-aimonly-checkbox";
      cbDrone.className = "diepcb";
      cbDrone.checked = Boolean(state.useDroneAimOnlyForMinions);
      cbDrone.addEventListener("change", function (e) {
        e.stopPropagation();
        state.useDroneAimOnlyForMinions = this.checked;
      });
      appendRow(secAim, "Drone Aim-Only", cbDrone);
    }

    // Farm section
    const secFarm = makeSection("farm");
    {
      const cbF = document.createElement("input");
      cbF.type = "checkbox";
      cbF.id = "autofarm-checkbox";
      cbF.className = "diepcb";
      cbF.checked = Boolean(state.isAutoFarm);
      cbF.addEventListener("change", function (e) {
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
      appendRow(secFarm, "Enable AutoFarm", cbF);

      const cbFH = document.createElement("input");
      cbFH.type = "checkbox";
      cbFH.id = "autofarm-hold-checkbox";
      cbFH.className = "diepcb";
      cbFH.checked = Boolean(state.autofarmOnRightHold);
      cbFH.addEventListener("change", function (e) {
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
      appendRow(secFarm, "Autofarm on Right-Hold", cbFH);

      // Priority radios - preserve original ids
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

    // Visuals section
    const secVis = makeSection("visuals");
    {
      const cb1 = document.createElement("input");
      cb1.type = "checkbox";
      cb1.id = "debug-checkbox";
      cb1.className = "diepcb";
      cb1.checked = Boolean(state.isDebug);
      cb1.addEventListener("change", function (e) {
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
      appendRow(secVis, "Debug Lines", cb1);

      const cb2 = document.createElement("input");
      cb2.type = "checkbox";
      cb2.id = "show-bullet-speed-checkbox";
      cb2.className = "diepcb";
      cb2.checked = Boolean(state.showBulletSpeeds);
      cb2.addEventListener("change", function (e) {
        e.stopPropagation();
        state.showBulletSpeeds = this.checked;
        if (window.extern) {
          try {
            window.extern.inGameNotification(
              state.showBulletSpeeds ? "Bullet Speed Overlay: ON" : "Bullet Speed Overlay: OFF",
              0x2b7bb8
            );
          } catch (_error) {}
        }
      });
      appendRow(secVis, "Bullet Speed Overlay", cb2);

      const cb3 = document.createElement("input");
      cb3.type = "checkbox";
      cb3.id = "blackbg-checkbox";
      cb3.className = "diepcb";
      cb3.checked = Boolean(state.isBlackBg);
      cb3.addEventListener("change", function (e) {
        e.stopPropagation();
        state.isBlackBg = this.checked;
        try {
          if (window.input && typeof window.input.set_convar === "function") {
            window.input.set_convar("ren_background_color", state.isBlackBg ? "#000000" : "#CDCDCD");
          }
          if (window.extern) {
            window.extern.inGameNotification(
              state.isBlackBg ? "Black background: ON" : "Black background: OFF",
              0x2b7bb8
            );
          }
        } catch (_error) {}
      });
      appendRow(secVis, "Black Background", cb3);
    }

    // Builds section (preserve builds-select, autobuild-checkbox, apply)
    const secBuilds = makeSection("builds");
    {
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
      buildSelect.className = "diepcb"; // appearance doesn't matter; id must match
      presets.forEach((preset) => {
        const option = document.createElement("option");
        option.value = preset.build;
        option.innerText = preset.name;
        buildSelect.appendChild(option);
      });
      const buildRow = document.createElement("div");
      buildRow.className = "row";
      const buildLabel = document.createElement("div");
      buildLabel.className = "label";
      buildLabel.innerText = "Select Build";
      buildRow.appendChild(buildLabel);
      buildRow.appendChild(buildSelect);
      buildRow.addEventListener("mousedown", (e) => e.stopPropagation());
      secBuilds.appendChild(buildRow);

      const applyRow = document.createElement("div");
      applyRow.className = "row";
      const applyBtn = document.createElement("button");
      applyBtn.className = "diepcb";
      applyBtn.innerText = "Apply Build";
      applyBtn.style.padding = "6px 10px";
      applyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        applySelectedBuild();
      });
      applyRow.appendChild(document.createElement("div")); // spacer
      applyRow.appendChild(applyBtn);
      applyRow.addEventListener("mousedown", (e) => e.stopPropagation());
      secBuilds.appendChild(applyRow);

      const autoRow = document.createElement("div");
      autoRow.className = "row";
      const labelAuto = document.createElement("div");
      labelAuto.className = "label";
      labelAuto.innerText = "Auto-Apply Build";
      const cbAuto = document.createElement("input");
      cbAuto.type = "checkbox";
      cbAuto.id = "autobuild-checkbox";
      cbAuto.className = "diepcb";
      cbAuto.checked = false;
      autoRow.appendChild(labelAuto);
      autoRow.appendChild(cbAuto);
      secBuilds.appendChild(autoRow);

      const info = document.createElement("div");
      info.className = "small";
      info.innerText = "Auto-Apply will attempt to set your build repeatedly while enabled.";
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

    // Info section
    const secInfo = makeSection("info");
    {
      const infoText = document.createElement("div");
      infoText.className = "small";
      infoText.style.whiteSpace = "normal";
      infoText.style.lineHeight = "1.3";
      infoText.innerHTML =
        "<strong>Fwan RC</strong><br>Diep-styled control panel. Keys: U = aimbot, I = stack, M = toggle menu.";
      infoText.addEventListener("mousedown", (e) => e.stopPropagation());
      secInfo.appendChild(infoText);
    }

    // Footer
    const footer = document.createElement("div");
    footer.className = "footer";
    footer.textContent = "Swan RC";

    container.appendChild(sectionWrap);
    container.appendChild(footer);

    document.body.appendChild(container);

    // keep reference for toggling and future calls
    state.menuContainer = container;

    // logic to switch sections (tabs) and keep buttons active
    function switchSection(id) {
      Object.keys(sections).forEach((k) => {
        sections[k].classList.toggle("active", k === id);
      });
      // toggle button classes
      tabs.forEach((t) => {
        const b = document.getElementById(`tab-btn-${t.id}`);
        if (b) b.classList.toggle("active", t.id === id);
      });
    }

    // Wire initial state values back to any existing DOM elements (for robustness)
    try {
      const sync = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === "checkbox" || el.type === "radio") el.checked = Boolean(val);
        else el.value = val;
      };
      sync("spinner-checkbox", state.isSpinning);
      sync("spin-slider", state.spinSpeed);
      sync("aimbot-checkbox", state.isAimbotActive);
      sync("convar-bullet-checkbox", state.useConvarBulletSpeed);
      sync("drone-aimonly-checkbox", state.useDroneAimOnlyForMinions);
      sync("autofarm-checkbox", state.isAutoFarm);
      sync("autofarm-hold-checkbox", state.autofarmOnRightHold);
      sync("show-bullet-speed-checkbox", state.showBulletSpeeds);
      sync("debug-checkbox", state.isDebug);
      sync("blackbg-checkbox", state.isBlackBg);
    } catch (_error) {}

    // global keyboard toggle: Escape to open/close menu like the provided design
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const m = state.menuContainer;
        if (!m) return;
        if (m.classList.contains("active")) {
          m.classList.remove("active");
          setTimeout(() => (m.style.display = "none"), 950);
        } else {
          m.style.display = "flex";
          requestAnimationFrame(() => m.classList.add("active"));
        }
      }
    });
  }

  return {
    ensureMenu,
  };
});
