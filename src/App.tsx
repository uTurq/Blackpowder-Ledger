import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Armory } from "./components/Armory";
import { GoldDialog, ThemedDialog } from "./components/Dialogs";
import { ArmoryFireTab, CombatDock } from "./components/FireControls";
import { HistoryDrawer, HistoryPeek } from "./components/History";
import { LoadingOverlay, type LoadingSequence } from "./components/LoadingOverlay";
import { Presets } from "./components/Presets";
import { ReloadModal } from "./components/ReloadModal";
import { Settings } from "./components/Settings";
import { MainNav, Topbar } from "./components/Topbar";
import { STYLE_PRESETS } from "./components/Cartridge";
import { Workshop } from "./components/Workshop";
import { ACCENTS, createDefaultState } from "./lib/defaults";
import {
  activeWeapon,
  advanceTurn,
  batchCost,
  batchCount,
  countIn,
  craftBatch,
  deleteAmmoType,
  findAmmo,
  findWeapon,
  fireRound,
  loadedCount,
  loadPreset,
  loadWeapon,
  presetShortfall,
  reconcileSelection,
  rollAttack,
  sanitizePlan,
  shortfall,
  startEncounter,
  unloadWeapon,
} from "./lib/ledger";
import { parseSaveFile } from "./lib/migrate";
import { playSound, type SoundKind } from "./lib/sound";
import { useLedgerStore } from "./lib/store";
import { useWakeLock } from "./lib/wakeLock";
import type { Batch, DialogState, Plan, Preset, SettingsTab, View } from "./lib/types";
import { clone, money, plural, uid } from "./lib/util";
import { usePwaInstall } from "./pwa";
import { flushSync } from "react-dom";
import { Scenery } from "./components/Scenery";
import { MotionContext } from "./components/Ticker";
import { Icon } from "./components/ui";

type Toast = { id: number; text: string; kind: string };

export default function App() {
  const { store, state, canUndo } = useLedgerStore();
  const { commit, passive } = store;
  const pwa = usePwaInstall();
  // Keep a phone or tablet from dimming mid-fight.
  useWakeLock(state.combatMode);

  const [settingsTab, setSettingsTab] = useState<SettingsTab>("appearance");
  const [reload, setReload] = useState<{ plan: Plan; selected: string } | null>(null);
  const [sequence, setSequence] = useState<LoadingSequence | null>(null);
  const [firing, setFiring] = useState(false);
  const [shotFx, setShotFx] = useState("none");
  const [toast, setToast] = useState<Toast | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [goldOpen, setGoldOpen] = useState(false);
  const [batch, setBatch] = useState<Batch>({});
  const [presetFilter, setPresetFilter] = useState("all");
  const importRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const busy = useRef({ firing: false, sequence: false });
  const skipSequence = useRef<(() => void) | null>(null);

  const weapon = activeWeapon(state);
  const selectedAmmo = findAmmo(state, state.selectedAmmoId);
  const loaded = loadedCount(weapon.slots);
  const selectedLoaded = state.selectedAmmoId ? countIn(weapon.slots, state.selectedAmmoId) : 0;
  const accent = ACCENTS[state.theme.accent] || ACCENTS.brass;
  const overlayOpen = Boolean(dialog || goldOpen || reload || historyOpen || sequence);
  const cssVars = {
    "--accent": accent[0],
    "--accent-hi": accent[1],
    "--panel-alpha": state.theme.panelOpacity / 100,
    "--bg-intensity": state.theme.backgroundIntensity / 100,
    "--vignette": state.theme.vignette / 100,
    "--scene-blur": `${state.theme.blur}px`,
    "--atmosphere": state.theme.atmosphere / 100,
    "--ui-scale": state.theme.scale / 100,
    "--fx-intensity": state.theme.intensity / 100,
  } as CSSProperties;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function announce(text: string, kind = "success") {
    setToast({ id: Date.now(), text, kind });
    if (liveRef.current) liveRef.current.textContent = text;
  }
  function sound(kind: SoundKind) {
    if (store.getState().sound) playSound(kind);
  }
  const fullMotion = () => store.getState().theme.motion === "full";
  const toTop = () => window.scrollTo({ top: 0, behavior: "instant" });
  /** Swap screens with a cross-fade where the browser supports View Transitions. */
  function transition(update: () => void) {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && fullMotion())
      doc.startViewTransition(() => flushSync(update));
    else update();
  }

  function undo() {
    if (store.undo()) announce("Last action undone.");
    else announce("Nothing to undo.", "muted");
  }

  // ---- Navigation -------------------------------------------------------
  function switchView(view: View) {
    const count = batchCount(state, batch);
    if (state.view === "workshop" && view !== "workshop" && count) {
      setDialog({
        type: "discardCraft",
        id: view,
        title: "Discard This Crafting Batch?",
        body: `Your uncrafted batch contains ${count} rounds. Leaving the bench will clear it.`,
      });
      return;
    }
    if (view === state.view) return;
    transition(() => {
      passive((n) => {
        n.view = view;
        if (view !== "armory") n.combatMode = false;
      });
      toTop();
    });
  }
  function toggleCombat() {
    const s = store.getState();
    transition(() => {
      if (s.combatMode)
        passive((n) => {
          n.combatMode = false;
        });
      else {
        passive((n) => {
          n.combatMode = true;
          n.view = "armory";
        });
        // A separate undo step, so undoing an accidental restart resumes the old fight.
        if (s.turn > 1 || s.reminders.length)
          commit(startEncounter, "New encounter — turn 1.", "turn");
      }
      toTop();
    });
  }
  function chooseWeapon(id: string) {
    passive((n) => {
      const w = findWeapon(n, id);
      if (!w) return false;
      n.activeWeaponId = id;
      reconcileSelection(n, w);
    });
  }
  function chooseAmmo(id: string) {
    passive((n) => {
      if (!activeWeapon(n).slots.includes(id)) return false;
      n.selectedAmmoId = id;
    });
  }
  /** Step Tactical Selection to the next loaded ammunition type. */
  function cycleAmmo() {
    const types = state.ammo.filter((a) => weapon.slots.includes(a.id));
    if (types.length < 2) return;
    const index = types.findIndex((a) => a.id === state.selectedAmmoId);
    chooseAmmo(types[(index + 1) % types.length].id);
    sound("click");
  }

  // ---- Firing -----------------------------------------------------------
  function fire() {
    if (busy.current.firing || busy.current.sequence) return;
    const s = store.getState();
    const w = activeWeapon(s);
    const ammo = findAmmo(s, s.selectedAmmoId);
    if (!ammo) return announce("Select a loaded cartridge first.", "error");
    if (!w.slots.includes(ammo.id)) return announce("That cartridge is no longer loaded.", "error");
    busy.current.firing = true;
    setFiring(true);
    setShotFx(ammo.visual.fx);
    sound("shot");
    if (s.theme.motion !== "off") navigator.vibrate?.(18);
    const full = fullMotion();
    setTimeout(
      () => {
        const fired = commit(
          (n) => fireRound(n, w.id, ammo.id) !== null,
          `Fired ${ammo.name} from ${w.shortName}.`,
          "shot",
        );
        if (!fired) return announce("That cartridge is no longer loaded.", "error");
        const now = store.getState();
        const element = findWeapon(now, w.id)?.element || "off";
        announce(
          `${ammo.name} fired — ${ammo.effect}${element !== "off" && now.elementalUnlocked ? ` · +1d6 ${element}` : ""}`,
        );
      },
      full ? 170 : 10,
    );
    setTimeout(
      () => {
        busy.current.firing = false;
        setFiring(false);
      },
      full ? 820 : 80,
    );
  }
  function nextTurn() {
    const turn = state.turn + 1;
    commit(advanceTurn, `Turn ${turn} started.`, "turn");
    announce(`Turn ${turn}. Once-per-round effects reset.`);
  }
  function roll() {
    const result = rollAttack(state.roller);
    passive((n) => {
      n.roller.last = result.text;
    });
    announce(`Attack roll: ${result.total}`);
  }

  // ---- Loading ----------------------------------------------------------
  /** Plays the seat/extract animation one round at a time; Skip ends it at once. */
  async function playSequence(seq: Omit<LoadingSequence, "progress">, stepMs: number) {
    if (!fullMotion()) return;
    busy.current.sequence = true;
    let skipped = false;
    const steps = Math.max(1, seq.rounds.length);
    setSequence({ ...seq, progress: 0 });
    for (let i = 1; i <= steps && !skipped; i++) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, stepMs);
        skipSequence.current = () => {
          skipped = true;
          clearTimeout(timer);
          resolve();
        };
      });
      if (!skipped) setSequence({ ...seq, progress: i });
    }
    skipSequence.current = null;
    setSequence(null);
    busy.current.sequence = false;
  }
  function openReload(plan?: Plan) {
    if (busy.current.sequence) return;
    const s = store.getState();
    setReload({
      plan: plan ?? activeWeapon(s).slots,
      selected: s.selectedAmmoId || s.ammo[0]?.id || "",
    });
  }
  async function commitReload(plan: Plan, selected: string) {
    const s = store.getState();
    const w = activeWeapon(s);
    const next = sanitizePlan(s, w, plan);
    if (shortfall(s, w, next).length)
      return announce("This load uses more ammunition than you own.", "error");
    setReload(null);
    const indices = next.flatMap((id, i) => (id && id !== w.slots[i] ? [i] : []));
    await playSequence(
      {
        mode: "seat",
        rounds: indices.length ? indices.map((i) => next[i] as string) : [selected],
        indices,
        before: w.slots,
      },
      150,
    );
    const ok = commit(
      (n) => loadWeapon(n, w.id, next),
      `Loaded ${w.shortName} with ${plural(loadedCount(next), "round")}.`,
      "reload",
    );
    if (!ok) return announce("Your reserve changed mid-load; nothing was seated.", "error");
    sound("reload");
    announce(`${w.shortName} ready.`);
  }
  async function unloadAll() {
    const w = activeWeapon(store.getState());
    const indices = w.slots.flatMap((id, i) => (id ? [i] : []));
    if (!indices.length || busy.current.sequence) return;
    await playSequence(
      { mode: "extract", rounds: indices.map((i) => w.slots[i] as string), indices, before: w.slots },
      95,
    );
    if (commit((n) => unloadWeapon(n, w.id) > 0, `Unloaded ${w.shortName}.`, "reload")) {
      sound("reload");
      announce(`${w.shortName} unloaded.`);
    }
  }

  // ---- Presets & crafting ----------------------------------------------
  function adjustPreset(preset: Preset) {
    if (preset.weaponId !== weapon.id) chooseWeapon(preset.weaponId);
    openReload(preset.slots);
  }
  function loadPresetNow(preset: Preset) {
    if (presetShortfall(state, preset).length)
      return announce("Craft the missing cartridges before loading this preset.", "error");
    const w = findWeapon(state, preset.weaponId);
    if (!commit((n) => loadPreset(n, preset), `Quick-loaded ${preset.name} into ${w?.shortName}.`, "reload"))
      return;
    sound("reload");
    announce(`${preset.name} loaded.`);
  }
  function adjustReserve(id: string, delta: number) {
    commit(
      (n) => {
        const a = findAmmo(n, id);
        if (!a) return false;
        a.reserve = Math.max(0, a.reserve + delta);
      },
      `${delta > 0 ? "Added" : "Removed"} ${plural(Math.abs(delta), "reserve round")}.`,
      "inventory",
    );
  }
  function craft() {
    const count = batchCount(state, batch);
    const cost = batchCost(state, batch);
    if (!count) return;
    if (cost > state.gold) return announce("Not enough gold for this batch.", "error");
    commit((n) => craftBatch(n, batch), `Crafted ${count} rounds for ${money(cost)}.`, "craft");
    setBatch({});
    announce(`${count} cartridges added to the case.`);
  }
  function saveGold(gold: number) {
    if (gold !== state.gold)
      commit(
        (n) => {
          n.gold = gold;
        },
        `Set coin ledger to ${money(gold)}.`,
        "gold",
      );
    setGoldOpen(false);
  }

  // ---- Data -------------------------------------------------------------
  function exportSave() {
    const blob = new Blob(
      [
        JSON.stringify(
          { app: "Blackpowder Ledger", exportedAt: new Date().toISOString(), data: state },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blackpowder-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce("Portable save exported.");
  }
  async function importSave(file: File) {
    try {
      store.replace(parseSaveFile(await file.text()), "Imported a portable save.");
      setBatch({});
      announce("Save imported successfully.");
    } catch {
      announce("That file is not a valid Blackpowder Ledger save.", "error");
    }
  }

  function confirmDialog(value: string) {
    if (!dialog) return;
    const val = value.trim();
    const id = dialog.id;
    switch (dialog.type) {
      case "savePreset":
        if (!val) return;
        commit(
          (n) => {
            const w = activeWeapon(n);
            n.presets.push({ id: uid("preset"), name: val, weaponId: w.id, slots: clone(w.slots) });
          },
          `Saved preset “${val}”.`,
          "preset",
        );
        announce("Magazine preset saved.");
        break;
      case "renamePreset":
        if (!val) return;
        commit(
          (n) => {
            const p = n.presets.find((x) => x.id === id);
            if (!p) return false;
            p.name = val;
          },
          `Renamed preset to “${val}”.`,
          "preset",
        );
        break;
      case "deletePreset":
        commit(
          (n) => {
            n.presets = n.presets.filter((p) => p.id !== id);
          },
          "Deleted magazine preset.",
          "preset",
        );
        break;
      case "deleteAmmo":
        if (id) commit((n) => deleteAmmoType(n, id), "Deleted custom ammunition type.", "ammo");
        break;
      case "discardCraft":
        setBatch({});
        passive((n) => {
          n.view = (id as View) || "armory";
          n.combatMode = false;
        });
        toTop();
        break;
      case "reset":
        store.replace(createDefaultState(), "Ledger reset to factory defaults.");
        setBatch({});
        announce("Ledger reset to factory defaults.");
        break;
      case "newAmmo":
        if (!val) return;
        commit(
          (n) => {
            n.ammo.push({
              id: uid("ammo"),
              name: val,
              reserve: 0,
              cost: 1,
              effect: "Add a short rules reminder.",
              color: "#69b8a3",
              symbol: "?",
              fx: "runes",
              shape: "standard",
              visual: clone(STYLE_PRESETS.custom),
            });
          },
          `Added ${val} to the ammunition catalog.`,
          "ammo",
        );
        break;
    }
    setDialog(null);
  }

  // ---- Keyboard ---------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Close only the topmost layer; the loading sequence has its own Skip.
        if (dialog) setDialog(null);
        else if (goldOpen) setGoldOpen(false);
        else if (reload) setReload(null);
        else if (historyOpen) setHistoryOpen(false);
        else if (sequence) skipSequence.current?.();
        return;
      }
      if (overlayOpen || e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      const modifier = e.ctrlKey || e.metaKey;
      if (modifier && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (modifier || e.altKey) return;
      if (e.key.toLowerCase() === "r" && state.view === "armory") {
        e.preventDefault();
        openReload();
      } else if (e.code === "Space" && state.combatMode) {
        e.preventDefault();
        if (!e.repeat) fire();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <MotionContext.Provider value={state.theme.motion}>
    <main
      className={`ledger env-${state.theme.environment} material-${state.theme.material} motion-${state.theme.motion} density-${state.theme.density} ${state.combatMode ? "combat-mode" : ""}`}
      style={cssVars}
    >
      <Scenery environment={state.theme.environment} />
      <div className="shell" inert={overlayOpen || undefined}>
        <Topbar
          state={state}
          weapon={weapon}
          canUndo={canUndo}
          undo={undo}
          rename={(name) =>
            passive((n) => {
              n.characterName = name;
            })
          }
          editGold={() => setGoldOpen(true)}
          toggleCombat={toggleCombat}
          openHistory={() => setHistoryOpen(true)}
        />
        {!state.combatMode && <MainNav view={state.view} go={switchView} />}

        <section className="view-wrap">
          {state.view === "armory" && (
            <Armory
              state={state}
              weapon={weapon}
              firing={firing}
              shotFx={shotFx}
              passive={passive}
              chooseWeapon={chooseWeapon}
              chooseAmmo={chooseAmmo}
              openReload={openReload}
              unloadAll={unloadAll}
              savePreset={() =>
                setDialog({
                  type: "savePreset",
                  title: "Save Magazine Preset",
                  value: `${weapon.shortName} Load ${state.presets.filter((p) => p.weaponId === weapon.id).length + 1}`,
                  body: "Save the current prepared ammunition as a reusable one-tap loadout.",
                })
              }
              nextTurn={nextTurn}
              rollAttack={roll}
              adjustReserve={adjustReserve}
            />
          )}
          {state.view === "workshop" && (
            <Workshop
              state={state}
              batch={batch}
              setBatch={setBatch}
              craft={craft}
              editGold={() => setGoldOpen(true)}
            />
          )}
          {state.view === "presets" && (
            <Presets
              state={state}
              filter={presetFilter}
              setFilter={setPresetFilter}
              adjustPreset={adjustPreset}
              loadNow={loadPresetNow}
              setDialog={setDialog}
              commit={commit}
            />
          )}
          {state.view === "settings" && (
            <Settings
              state={state}
              tab={settingsTab}
              setTab={setSettingsTab}
              passive={passive}
              commit={commit}
              exportSave={exportSave}
              importSave={() => importRef.current?.click()}
              setDialog={setDialog}
              pwaStatus={pwa.status}
              installPwa={async () => {
                const result = await pwa.install();
                if (result === "accepted") announce("Blackpowder Ledger installed for offline use.");
                else if (result === "dismissed") announce("Installation canceled.", "muted");
                else
                  announce(
                    "Use your browser menu and choose Install app or Add to Home Screen.",
                    "muted",
                  );
              }}
            />
          )}
        </section>

        {state.combatMode && (
          <CombatDock
            weapon={weapon}
            selectedAmmo={selectedAmmo}
            selectedLoaded={selectedLoaded}
            loaded={loaded}
            firing={firing}
            density={state.theme.density}
            fire={fire}
            canUndo={canUndo}
            undo={undo}
            cycleAmmo={cycleAmmo}
            openReload={() => openReload()}
          />
        )}
        {!state.combatMode && state.view === "armory" && (
          <ArmoryFireTab
            weapon={weapon}
            selectedAmmo={selectedAmmo}
            selectedLoaded={selectedLoaded}
            loaded={loaded}
            firing={firing}
            density={state.theme.density}
            fire={fire}
          />
        )}
      </div>

      <HistoryPeek
        latest={state.activity[0]}
        compact={!state.combatMode && state.view === "armory"}
        open={() => setHistoryOpen(true)}
      />
      {historyOpen && (
        <HistoryDrawer entries={state.activity} close={() => setHistoryOpen(false)} />
      )}
      {reload && (
        <ReloadModal
          key={weapon.id}
          state={state}
          weapon={weapon}
          initialPlan={reload.plan}
          initialSelected={reload.selected}
          close={() => setReload(null)}
          commit={commitReload}
          announce={announce}
        />
      )}
      {sequence && (
        <LoadingOverlay
          state={state}
          weapon={weapon}
          sequence={sequence}
          skip={() => skipSequence.current?.()}
        />
      )}
      {goldOpen && (
        <GoldDialog gold={state.gold} close={() => setGoldOpen(false)} save={saveGold} />
      )}
      {dialog && (
        <ThemedDialog dialog={dialog} close={() => setDialog(null)} confirm={confirmDialog} />
      )}
      {toast && (
        <div key={toast.id} className={`toast ${toast.kind}`} role="status">
          <Icon name={toast.kind === "error" ? "close" : toast.kind === "muted" ? "spark" : "check"} />
          {toast.text}
        </div>
      )}
      <input
        ref={importRef}
        className="sr-only"
        type="file"
        accept="application/json,.json"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void importSave(file);
        }}
      />
      <div ref={liveRef} className="sr-only" aria-live="polite" />
    </main>
    </MotionContext.Provider>
  );
}
