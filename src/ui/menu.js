DiepScript.define("ui/menu", (require) => {
  // Modularized unified menu for DiepScript
  const state = require("core/state");
  const autofarm = require("features/autofarm");

  let welcomeActive = true;
  let keyHandlerAdded = false;

  function ensureMenu() {
    // If menu already exists, toggle visibility by removing/adding .active
    try {
      if (state.menuContainer && state.menuContainer.parentNode) {
        const el = state.menuContainer;
        if (el.classList.contains("active")) {
          el.classList.remove("active");
          setTimeout(() => (el.style.display = "none"), 950);
        } else {
          el.style.display = "flex";
          requestAnimationFrame(() => el.classList.add("active"));
        }
        return;
      }
    } catch (e) {
      // fallthrough to create
    }

    // Inject CSS
    const style = document.createElement("style");
    style.textContent = `
/* Main container */
.main-div {
  position: absolute;
  top: 50%;
  margin-top: -225px;
  left: 50%;
  margin-left: -200px;
  width: 0px;
  height: 0px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(52,78,180,0.48), rgba(82,232,255,0.18));
  backdrop-filter: blur(16px);
  border: 1px solid rgba(82,232,255,0.32);
  font-family: "Kanit", sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgb(212,209,209);
  z-index: 1000000;
  border-radius: 5%;
  animation: close 0.95s ease-in-out forwards;
  box-shadow: 0 22px 46px rgba(67,127,255,0.16);
  user-select: none;
  gap: 8px;
  padding: 12px;
  box-sizing: border-box;
  padding-bottom: 18px;
}
.main-div, .main-div * { box-sizing: border-box; }

.main-div.active {
  width: 400px;
  height: 450px;
  transform-origin: 200px 225px;
  animation: open 0.95s ease-in-out forwards;
}

/* Title / drag handle */
.main-title { display:flex; flex-direction:column; align-items:center; gap:8px; margin-bottom:4px; cursor: grab; }
.main-title.grabbing { cursor: grabbing; }
.main-title .bottom { font-size: 1.25rem; position: relative; }
.main-title span { font-size: 1rem; display: block; letter-spacing: 0.2rem; transform: translate(-8px, 8px); }

/* Tabs/buttons */
.menu-row { display:flex; width:100%; gap:8px; justify-content:space-between; }
.menu { flex:1; display:flex; flex-direction:column; align-items:stretch; }
.menu button {
  color:#eaf5ff;
  background: rgba(67,127,255,0.08);
  border: 1px solid rgba(82,232,255,0.18);
  padding:8px 10px;
  margin-bottom:6px;
  font-weight:600;
  text-transform: uppercase;
  cursor: pointer;
  width:100%;
  min-width:0;
  overflow:hidden;
  white-space:nowrap;
  text-overflow:ellipsis;
}
.menu button:hover { transform: scale(1.02); color:#fff; }
.menu button.active { background: linear-gradient(180deg, rgba(82,232,255,0.28), rgba(67,127,255,0.24)); color:#fff; border-color: rgba(82,232,255,0.45); }

/* Sections */
.section-wrap { width:100%; display:block; padding-top:8px; overflow-y:auto; overflow-x:hidden; flex:1; -webkit-overflow-scrolling: touch; }
.section { display:none; }
.section.active { display:block; }

/* Rows */
.row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.02); }
.row:last-child { border-bottom:none; }
.row > * { min-width:0; }
.label { color:#dbeeff; font-weight:600; font-size:0.95rem; flex:0 1 45%; white-space:normal; word-break:break-word; }
.small { font-size:0.8rem; color:#9fbfe6; margin-top:6px; line-height:1.2; }

/* Inputs */
.diepcb { width:16px; height:16px; transform:scale(1.05); margin-left:6px; flex:0 0 auto; }
.slider { width:160px; max-width:60%; }
.diepb-select { width:100%; padding:6px; background:rgba(67,127,255,0.12); color:#eaf5ff; border:1px solid rgba(82,232,255,0.24); }

/* Welcome section */
.welcome-section { display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:12px 8px; gap:8px; text-align:center; }
.welcome-pfp { width:96px; height:96px; border-radius:50%; object-fit:cover; border:2px solid rgba(255,255,255,0.12); box-shadow: 0 4px 12px rgba(67,127,255,0.28); }
.welcome-title { font-size:1.15rem; color:#fff; font-weight:700; margin-top:6px; }
.welcome-info { font-size:0.92rem; color:#9fbfe6; max-width:92%; line-height:1.3; }

/* Footer */
.footer { margin-top:8px; font-size:0.82rem; color:#9fbfe6; text-align:right; width:100%; padding-right:8px; }

/* Animations */
@keyframes open {
  0% { width: 0; height: 0; border-radius: 2%; }
  25% { width: 400px; height: 0; }
  65% { border-radius: 5%; }
  100% { height: 450px; border-radius: 50% 20% / 10% 40%; }
}
@keyframes close {
  0% { width: 400px; height: 450px; border-radius: 50% 20% / 10% 40%; }
  45% { width: 400px; height: 0; border-radius: 10%; }
  70% { width: 0; }
  100% { width: 0; height: 0; }
}

/* Scrollbar styling */
.section-wrap::-webkit-scrollbar { width:10px; height:10px; }
.section-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius:8px; }
.section-wrap::-webkit-scrollbar-track { background: rgba(67,127,255,0.12); border-radius:8px; }

/* Notification cleanup */
body div[id*="notification"],
body div[class*="notification"],
body span[id*="notification"],
body span[class*="notification"] {
  background: none !important;
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

/* keep menu controls interactive if page blocks pointer-events */
.main-div * { pointer-events: auto; }
@media (max-width:480px) {
  .main-div { left:12px; top:12px; width:calc(100% - 24px); margin-left:0; margin-top:0; transform:none; }
}
`;
    document.head.appendChild(style);

    // Build container
    const container = document.createElement("div");
    container.className = "main-div";
    container.style.display = "none";

    // Title / header (drag handle)
    const titleWrap = document.createElement("div");
    titleWrap.className = "main-title";
    titleWrap.innerHTML = `<span>System</span><div class="bottom">Settings</div>`;
    titleWrap.style.cursor = "grab";
    container.appendChild(titleWrap);

    // Tabs (no tab for welcome)
    const tabs = [
      { id: "aim", label: "Aim" },
      { id: "visuals", label: "Visuals" },
      { id: "spin", label: "Spin" },
      { id: "farm", label: "Farm" },
      { id: "builds", label: "Builds" },
      { id: "info", label: "Info" },
    ];

    const menuRow = document.createElement("div");
    menuRow.className = "menu-row";
    const leftMenu = document.createElement("div");
    leftMenu.className = "menu";
    const rightMenu = document.createElement("div");
    rightMenu.className = "menu";

    tabs.slice(0, 3).forEach((t) => {
      const btn = document.createElement("button");
      btn.id = `tab-btn-${t.id}`;
      btn.innerText = t.label;
      btn.addEventListener("click", (ev) => { ev.stopPropagation(); switchSection(t.id); });
      leftMenu.appendChild(btn);
    });
    tabs.slice(3).forEach((t) => {
      const btn = document.createElement("button");
      btn.id = `tab-btn-${t.id}`;
      btn.innerText = t.label;
      btn.addEventListener("click", (ev) => { ev.stopPropagation(); switchSection(t.id); });
      rightMenu.appendChild(btn);
    });

    menuRow.appendChild(leftMenu);
    menuRow.appendChild(rightMenu);
    container.appendChild(menuRow);

    // Section wrapper
    const sectionWrap = document.createElement("div");
    sectionWrap.className = "section-wrap";
    container.appendChild(sectionWrap);

    // helpers
    const sections = {};
    function makeSection(id, active = false) {
      const s = document.createElement("div");
      s.className = "section" + (active ? " active" : "");
      s.id = `section-${id}`;
      sections[id] = s;
      sectionWrap.appendChild(s);
      return s;
    }
    function appendRow(sec, labelText, inputEl) {
      const row = document.createElement("div");
      row.className = "row";
      const lbl = document.createElement("div");
      lbl.className = "label";
      lbl.innerText = labelText;
      row.appendChild(lbl);
      row.appendChild(inputEl);
      row.addEventListener("mousedown", (e) => e.stopPropagation());
      row.addEventListener("click", (e) => e.stopPropagation());
      sec.appendChild(row);
      return row;
    }

    // Welcome (one-time)
    welcomeActive = true;
    const secWelcome = makeSection("welcome", true);
    secWelcome.classList.add("welcome-section");
    {
      const pfp = document.createElement("img");
      pfp.className = "welcome-pfp";
      pfp.src = "https://i.imgur.com/a8eGMXu.png";
      pfp.alt = "Profile";
      pfp.addEventListener("mousedown", (e) => e.stopPropagation());
      secWelcome.appendChild(pfp);

      const wtitle = document.createElement("div");
      wtitle.className = "welcome-title";
      wtitle.innerText = "Welcome User";
      secWelcome.appendChild(wtitle);

      const winfo = document.createElement("div");
      winfo.className = "welcome-info";
      winfo.innerHTML = `
        <div><strong>Swan RC</strong> — quick controls and info.</div>
        <div style="margin-top:8px;">Use the tabs to enable features. RMB = toggle autofarm, U = aimbot, M = menu.</div>
        <div style="margin-top:6px;">This welcome screen is one-time: switch to any tab to continue.</div>
      `;
      winfo.addEventListener("mousedown", (e) => e.stopPropagation());
      secWelcome.appendChild(winfo);
    }

    // --- Spin section ---
    const secSpin = makeSection("spin", false);
    {
      const cb1 = document.createElement("input");
      cb1.type = "checkbox";
      cb1.id = "spinner-checkbox";
      cb1.className = "diepcb";
      cb1.checked = Boolean(state.isSpinning);
      cb1.addEventListener("change", function (e) {
        e.stopPropagation();
        state.isSpinning = this.checked;
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "Spinner: ON" : "Spinner: OFF", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secSpin, "Enable Spinner", cb1);

      const labelAndSlider = document.createElement("div");
      labelAndSlider.style.display = "flex";
      labelAndSlider.style.flexDirection = "column";
      labelAndSlider.style.alignItems = "flex-end";
      const speedLabel = document.createElement("div");
      speedLabel.className = "small";
      speedLabel.id = "spin-speed-label";
      speedLabel.innerText = `Speed: ${(typeof state.spinSpeed === "number" ? state.spinSpeed.toFixed(2) : "0.00")}`;
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "2";
      slider.step = "0.01";
      slider.value = (typeof state.spinSpeed === "number" ? state.spinSpeed.toString() : "0");
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

    // --- Aim section ---
    const secAim = makeSection("aim", false);
    {
      const cbA = document.createElement("input");
      cbA.type = "checkbox";
      cbA.id = "aimbot-checkbox";
      cbA.className = "diepcb";
      cbA.checked = Boolean(state.isAimbotActive);
      cbA.addEventListener("change", function (e) {
        e.stopPropagation();
        state.isAimbotActive = this.checked;
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "Aimbot: ON" : "Aimbot: OFF", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secAim, "Enable Aimbot", cbA);

      const cbC = document.createElement("input");
      cbC.type = "checkbox";
      cbC.id = "convar-bullet-checkbox";
      cbC.className = "diepcb";
      cbC.checked = Boolean(state.useConvarBulletSpeed);
      cbC.addEventListener("change", function (e) {
        e.stopPropagation();
        state.useConvarBulletSpeed = this.checked;
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "Using convar bullet speed" : "Using calculated bullet speed", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secAim, "Convar Bullet Speed", cbC);

      const cbD = document.createElement("input");
      cbD.type = "checkbox";
      cbD.id = "drone-aimonly-checkbox";
      cbD.className = "diepcb";
      cbD.checked = Boolean(state.useDroneAimOnlyForMinions);
      cbD.addEventListener("change", function (e) {
        e.stopPropagation();
        state.useDroneAimOnlyForMinions = this.checked;
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "Drone mode: ON (space)" : "Drone mode: OFF", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secAim, "Drone Aim", cbD);

      const info = document.createElement("div");
      info.className = "small";
      info.innerText = "Hold RMB to engage the aimbot when this option is enabled.";
      info.addEventListener("mousedown", (e) => e.stopPropagation());
      secAim.appendChild(info);
    }

    // --- Farm section ---
    const secFarm = makeSection("farm", false);
    {
      const cbF = document.createElement("input");
      cbF.type = "checkbox";
      cbF.id = "autofarm-checkbox";
      cbF.className = "diepcb";
      cbF.checked = Boolean(state.isAutoFarm);
      cbF.addEventListener("change", function (e) {
        e.stopPropagation();
        state.isAutoFarm = this.checked;
        if (!state.isAutoFarm) autofarm.resetAutoAim && autofarm.resetAutoAim();
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "AutoFarm: ON" : "AutoFarm: OFF", 0x2b7bb8); } catch (_) {} }
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
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "RMB: ON" : "RMB: OFF", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secFarm, "RMB Toggle", cbFH);

      const rmbInfo = document.createElement("div");
      rmbInfo.className = "small";
      rmbInfo.style.marginTop = "6px";
      rmbInfo.innerText = "Hold RMB to engage the aimbot when this option is enabled.";
      rmbInfo.addEventListener("mousedown", (e) => e.stopPropagation());
      secFarm.appendChild(rmbInfo);

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

    // --- Visuals section ---
    const secVis = makeSection("visuals", false);
    {
      const cb1 = document.createElement("input");
      cb1.type = "checkbox";
      cb1.id = "debug-checkbox";
      cb1.className = "diepcb";
      cb1.checked = Boolean(state.isDebug);
      cb1.addEventListener("change", function (e) {
        e.stopPropagation();
        state.isDebug = this.checked;
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "Debug: ON" : "Debug: OFF", 0x2b7bb8); } catch (_) {} }
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
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "Speed overlay ON" : "Speed overlay OFF", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secVis, "Bullet Speed Overlay", cb2);

    }

    // --- Builds section ---
    const secBuilds = makeSection("builds", false);
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
        { name: "overlord", build: "565656565656565656565656567878787" }
      ];

      const buildSelect = document.createElement("select");
      buildSelect.id = "builds-select";
      buildSelect.className = "diepb-select";
      presets.forEach((p) => {
        const o = document.createElement("option");
        o.value = p.build;
        o.innerText = p.name;
        buildSelect.appendChild(o);
      });
      buildSelect.addEventListener("mousedown", (e) => { e.stopPropagation(); buildSelect.focus(); });
      const selRow = document.createElement("div");
      selRow.className = "row";
      const selLabel = document.createElement("div");
      selLabel.className = "label";
      selLabel.innerText = "Preset";
      selRow.appendChild(selLabel);
      selRow.appendChild(buildSelect);
      selRow.addEventListener("mousedown", (e) => e.stopPropagation());
      secBuilds.appendChild(selRow);

      // Apply button
      const applyRow = document.createElement("div");
      applyRow.className = "row";
      const applyBtn = document.createElement("button");
      applyBtn.className = "diepcb";
      applyBtn.id = "apply-build-btn";
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

      // Auto-build checkbox
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
      autoRow.addEventListener("mousedown", (e) => e.stopPropagation());
      secBuilds.appendChild(autoRow);

      const info = document.createElement("div");
      info.className = "small";
      info.innerText = "Automatically apply stat upgrades for applied build";
      info.addEventListener("mousedown", (e) => e.stopPropagation());
      secBuilds.appendChild(info);

      // Implementation helpers for builds
      let autobuildInterval = null;
      function tryExecuteBuildCommand(buildString) {
        try { if (window.input && typeof window.input.execute === "function") { window.input.execute(`game_stats_build ${buildString}`); return true; } } catch (_) {}
        try { if (window.extern && typeof window.extern.execute === "function") { window.extern.execute(`game_stats_build ${buildString}`); return true; } } catch (_) {}
        try { if (window.input && typeof window.input.set_convar === "function") { window.input.set_convar("game_stats_build", buildString); return true; } } catch (_) {}
        return false;
      }
      function applySelectedBuild() {
        const build = document.getElementById("builds-select").value;
        if (!build) return;
        const ok = tryExecuteBuildCommand(build);
        if (!ok && window.extern) { try { window.extern.inGameNotification("Failed to apply build (no executor found)", 0xff5e5e); } catch (_) {} }
        else if (window.extern) { try { window.extern.inGameNotification("Applied build", 0x2b7bb8); } catch (_) {} }
      }
      function startAutoBuild() {
        if (autobuildInterval) return;
        autobuildInterval = setInterval(() => {
          const build = document.getElementById("builds-select").value;
          if (!build) return;
          tryExecuteBuildCommand(build);
        }, 2500);
      }
      function stopAutoBuild() {
        if (!autobuildInterval) return;
        clearInterval(autobuildInterval);
        autobuildInterval = null;
      }
      cbAuto.addEventListener("change", function (e) { e.stopPropagation(); if (this.checked) startAutoBuild(); else stopAutoBuild(); });
    }

    // --- Info section ---
    const secInfo = makeSection("info", false);
    {
      const infoText = document.createElement("div");
      infoText.className = "small";
      infoText.style.whiteSpace = "normal";
      infoText.style.lineHeight = "1.3";
      infoText.innerHTML = "<strong>Swan RC</strong><br>Thank you for your support";
      infoText.addEventListener("mousedown", (e) => e.stopPropagation());
      secInfo.appendChild(infoText);
    }

    // Footer
    const footer = document.createElement("div");
    footer.className = "footer";
    footer.textContent = "Swan RC";
    container.appendChild(footer);

    // Insert menu
    document.body.appendChild(container);
    // save for other modules
    state.menuContainer = container;

    // Draggable (title handle) - mouse & touch
    (function makeDraggable(target, handle) {
      let dragging = false;
      let offsetX = 0;
      let offsetY = 0;

      function onMouseDown(e) {
        e.stopPropagation();
        dragging = true;
        handle.classList.add("grabbing");
        const rect = target.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        target.style.left = rect.left + "px";
        target.style.top = rect.top + "px";
        target.style.marginLeft = "0";
        target.style.marginTop = "0";
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        e.preventDefault();
      }

      function onMouseMove(e) {
        if (!dragging) return;
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        target.style.left = x + "px";
        target.style.top = y + "px";
      }

      function onMouseUp(e) {
        dragging = false;
        handle.classList.remove("grabbing");
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      function onTouchStart(e) {
        if (!e.touches || e.touches.length === 0) return;
        dragging = true;
        handle.classList.add("grabbing");
        const rect = target.getBoundingClientRect();
        const t = e.touches[0];
        offsetX = t.clientX - rect.left;
        offsetY = t.clientY - rect.top;
        target.style.left = rect.left + "px";
        target.style.top = rect.top + "px";
        target.style.marginLeft = "0";
        target.style.marginTop = "0";
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener("touchend", onTouchEnd);
        e.preventDefault();
      }

      function onTouchMove(e) {
        if (!dragging || !e.touches || e.touches.length === 0) return;
        const t = e.touches[0];
        const x = t.clientX - offsetX;
        const y = t.clientY - offsetY;
        target.style.left = x + "px";
        target.style.top = y + "px";
        e.preventDefault();
      }

      function onTouchEnd(e) {
        dragging = false;
        handle.classList.remove("grabbing");
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
      }

      handle.addEventListener("mousedown", onMouseDown);
      handle.addEventListener("touchstart", onTouchStart, { passive: false });
      handle.style.touchAction = "none";
    })(container, titleWrap);

    // Show menu initially
    container.style.display = "flex";
    requestAnimationFrame(() => container.classList.add("active"));

    // Section switching
    function switchSection(id) {
      if (welcomeActive) {
        if (sections['welcome'] && sections['welcome'].parentNode) {
          sections['welcome'].parentNode.removeChild(sections['welcome']);
        }
        delete sections['welcome'];
        welcomeActive = false;
      }

      Object.keys(sections).forEach((k) => {
        sections[k].classList.toggle("active", k === id);
      });
      tabs.forEach((t) => {
        const btn = document.getElementById(`tab-btn-${t.id}`);
        if (btn) btn.classList.toggle("active", t.id === id);
      });
    }

    // Escape toggle (add once)
    if (!keyHandlerAdded) {
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
      keyHandlerAdded = true;
    }

    // Sync initial values back into DOM
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
    } catch (e) {}

    // expose container for others
    state.menuContainer = container;

    return container;
  }

  return {
    ensureMenu,
  };
});
