import { ACCENTS, ELEMENTS, ENVIRONMENTS, PANEL_MATERIALS } from "../lib/defaults";
import type { Commit, Passive } from "../lib/store";
import type {
  DialogState,
  LedgerState,
  Motion,
  RollMode,
  SettingsTab,
  Theme,
  Weapon,
} from "../lib/types";
import { capitalize, timeAgo } from "../lib/util";
import type { PwaInstallStatus } from "../pwa";
import { AmmunitionSettings } from "./AmmoEditor";
import type { AnimationDensity } from "./Cartridge";
import { AppButton, Icon, Range, SettingsHeading, Toggle } from "./ui";
import { WeaponArt } from "./WeaponArt";

const TABS: [SettingsTab, string][] = [
  ["appearance", "Appearance"],
  ["combat", "Combat"],
  ["animation", "Animation & Sound"],
  ["weapons", "Weapons"],
  ["ammunition", "Ammunition"],
  ["data", "Data & Saves"],
];

type SettingsProps = {
  state: LedgerState;
  tab: SettingsTab;
  setTab: (t: SettingsTab) => void;
  passive: Passive;
  commit: Commit;
  exportSave: () => void;
  importSave: () => void;
  setDialog: (d: DialogState) => void;
  pwaStatus: PwaInstallStatus;
  installPwa: () => void;
};

export function Settings(props: SettingsProps) {
  const { tab, setTab } = props;
  return (
    <section className="settings-shell panel glass">
      <div className="settings-sidebar">
        <span className="eyebrow">SYSTEM CONFIGURATION</span>
        <h1>Settings</h1>
        <p>
          Shape the ledger to your table, screen, and preferred level of
          spectacle.
        </p>
        <nav aria-label="Settings sections">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
            >
              <span>{label}</span>
              <b aria-hidden="true">›</b>
            </button>
          ))}
        </nav>
      </div>
      <div className="settings-content">
        {tab === "appearance" && <AppearanceSettings {...props} />}
        {tab === "combat" && <CombatSettings {...props} />}
        {tab === "animation" && <AnimationSettings {...props} />}
        {tab === "weapons" && <WeaponSettings {...props} />}
        {tab === "ammunition" && <AmmunitionSettings {...props} />}
        {tab === "data" && <DataSettings {...props} />}
      </div>
    </section>
  );
}

function themeSetter(passive: Passive) {
  return <K extends keyof Theme>(key: K, value: Theme[K]) =>
    passive((n) => {
      n.theme[key] = value;
    });
}

function AppearanceSettings({ state, passive }: SettingsProps) {
  const setTheme = themeSetter(passive);
  return (
    <>
      <SettingsHeading
        kicker="VISUAL SYSTEM"
        title="Appearance"
        text="Build a rough field ledger: forged metal, scarred leather, timber, or a paper bounty board."
      />
      <div className="setting-block">
        <h3>Environment</h3>
        <div className="environment-grid">
          {ENVIRONMENTS.map(([id, label]) => (
            <button
              key={id}
              className={`${state.theme.environment === id ? "active" : ""} env-card-${id}`}
              aria-pressed={state.theme.environment === id}
              onClick={() => setTheme("environment", id)}
            >
              <span />
              <b>{label}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="setting-block">
        <h3>Panel material</h3>
        <div className="choice-row material-choices">
          {PANEL_MATERIALS.map(([id, label]) => (
            <button
              key={id}
              className={`${state.theme.material === id ? "active" : ""} material-swatch-${id}`}
              aria-pressed={state.theme.material === id}
              onClick={() => setTheme("material", id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="setting-block">
        <h3>Accent metal</h3>
        <div className="swatches">
          {Object.entries(ACCENTS).map(([id, colors]) => (
            <button
              key={id}
              className={state.theme.accent === id ? "active" : ""}
              aria-pressed={state.theme.accent === id}
              onClick={() => setTheme("accent", id)}
            >
              <i style={{ background: colors[0] }} />
              <span>{id}</span>
            </button>
          ))}
        </div>
      </div>
      <Range
        label="Panel transparency"
        detail="Lower values reveal more of the chosen environment."
        value={state.theme.panelOpacity}
        min={62}
        max={98}
        suffix="%"
        onChange={(v) => setTheme("panelOpacity", v)}
      />
      <Range
        label="Background visibility"
        detail="Controls the strength of environmental artwork."
        value={state.theme.backgroundIntensity}
        min={20}
        max={100}
        suffix="%"
        onChange={(v) => setTheme("backgroundIntensity", v)}
      />
      <Range
        label="Vignette"
        detail="Darkens the outer edge behind the interface."
        value={state.theme.vignette}
        min={0}
        max={80}
        suffix="%"
        onChange={(v) => setTheme("vignette", v)}
      />
      <Range
        label="Background blur"
        detail="Softens busy scenery behind text."
        value={state.theme.blur}
        min={0}
        max={12}
        suffix="px"
        onChange={(v) => setTheme("blur", v)}
      />
      <Range
        label="Interface scale"
        detail="Adjusts the visual density of the ledger."
        value={state.theme.scale}
        min={88}
        max={112}
        suffix="%"
        onChange={(v) => setTheme("scale", v)}
      />
    </>
  );
}

function CombatSettings({ state, passive }: SettingsProps) {
  const setRoller = <K extends keyof LedgerState["roller"]>(
    key: K,
    value: LedgerState["roller"][K],
  ) =>
    passive((n) => {
      n.roller[key] = value;
    });
  return (
    <>
      <SettingsHeading
        kicker="TABLE PLAY"
        title="Combat controls"
        text="Optional helpers stay lightweight and never replace your character sheet."
      />
      <Toggle
        label="Attack roller"
        detail="Show a fast d20 control inside Combat Mode."
        value={state.roller.enabled}
        onChange={(v) => setRoller("enabled", v)}
      />
      <Toggle
        label="Elemental Chamber unlocked"
        detail="Enable the level 10 +1d6 elemental modification controls."
        value={state.elementalUnlocked}
        onChange={(v) =>
          passive((n) => {
            n.elementalUnlocked = v;
          })
        }
      />
      {state.roller.enabled && (
        <div className="setting-block">
          <h3>Attack bonus</h3>
          <div className="number-fields">
            {(
              [
                ["dex", "Dexterity"],
                ["prof", "Proficiency"],
                ["misc", "Miscellaneous"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  inputMode="numeric"
                  value={state.roller[key]}
                  onChange={(e) => setRoller(key, Number(e.target.value) || 0)}
                />
              </label>
            ))}
            <label>
              Roll mode
              <select
                value={state.roller.mode}
                onChange={(e) => setRoller("mode", e.target.value as RollMode)}
              >
                <option value="normal">Normal</option>
                <option value="advantage">Advantage</option>
                <option value="disadvantage">Disadvantage</option>
              </select>
            </label>
          </div>
        </div>
      )}
      <div className="setting-block rules-card">
        <h3>Encoded class rulings</h3>
        <ul>
          <li>Tactical Selection: choose any prepared cartridge.</li>
          <li>Hollow Point: +1d4 piercing.</li>
          <li>Explosive Shell: 5-foot blast, once per round.</li>
          <li>Full Metal Jacket: 1d6 piercing to a creature directly behind.</li>
          <li>Elemental Chamber: +1d6 damage on each shot when unlocked.</li>
        </ul>
        <small>All costs and reminders remain editable in Ammunition.</small>
      </div>
    </>
  );
}

function AnimationSettings({ state, passive }: SettingsProps) {
  const setTheme = themeSetter(passive);
  return (
    <>
      <SettingsHeading
        kicker="FEEDBACK"
        title="Animation & sound"
        text="All cartridge effects stay visible by default, exactly as requested."
      />
      <div className="setting-block">
        <h3>Cartridge animation density</h3>
        <div className="segmented">
          {(
            [
              ["all", "All Rounds"],
              ["focused", "Selected / Focused"],
              ["minimal", "Minimal"],
            ] as [AnimationDensity, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              className={state.theme.density === id ? "active" : ""}
              aria-pressed={state.theme.density === id}
              onClick={() => setTheme("density", id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="setting-block">
        <h3>Motion profile</h3>
        <div className="segmented">
          {(["full", "reduced", "off"] as Motion[]).map((id) => (
            <button
              key={id}
              className={state.theme.motion === id ? "active" : ""}
              aria-pressed={state.theme.motion === id}
              onClick={() => setTheme("motion", id)}
            >
              {capitalize(id)}
            </button>
          ))}
        </div>
      </div>
      <Range
        label="Effect intensity"
        detail="Scales flame, vapor, tracer, glint, and ambient effects."
        value={state.theme.intensity}
        min={20}
        max={120}
        suffix="%"
        onChange={(v) => setTheme("intensity", v)}
      />
      <Range
        label="Environmental motion"
        detail="Controls dust, embers, and arcane drift."
        value={state.theme.atmosphere}
        min={0}
        max={100}
        suffix="%"
        onChange={(v) => setTheme("atmosphere", v)}
      />
      <Toggle
        label="Mechanical sound"
        detail="Enable synthesized clicks, cycling, and shot feedback."
        value={state.sound}
        onChange={(v) =>
          passive((n) => {
            n.sound = v;
          })
        }
      />
    </>
  );
}

function WeaponSettings({ state, passive }: SettingsProps) {
  const editWeapon = (id: string, recipe: (w: Weapon) => void) =>
    passive((n) => {
      const w = n.weapons.find((x) => x.id === id);
      if (!w) return false;
      recipe(w);
    });
  return (
    <>
      <SettingsHeading
        kicker="ARMORY"
        title="Weapon configuration"
        text="Refinish the two canonical firearms and choose their chamber element."
      />
      <div className="weapon-editor-grid">
        {state.weapons.map((w) => (
          <article key={w.id}>
            <div className="weapon-editor-stage">
              <WeaponArt weapon={w} />
            </div>
            <label>
              Display name
              <input
                value={w.name}
                onChange={(e) =>
                  editWeapon(w.id, (x) => {
                    x.name = e.target.value;
                  })
                }
              />
            </label>
            <div className="two-fields">
              <label>
                Metal
                <select
                  value={w.finish}
                  onChange={(e) =>
                    editWeapon(w.id, (x) => {
                      x.finish = e.target.value;
                    })
                  }
                >
                  <option value="blackened">Blackened Steel</option>
                  <option value="steel">Polished Steel</option>
                  <option value="brass">Brass</option>
                  <option value="silver">Silver</option>
                  <option value="copper">Copper</option>
                </select>
              </label>
              <label>
                Stock
                <select
                  value={w.stock}
                  onChange={(e) =>
                    editWeapon(w.id, (x) => {
                      x.stock = e.target.value;
                    })
                  }
                >
                  <option value="walnut">Dark Walnut</option>
                  <option value="ebony">Ebony</option>
                  <option value="weathered">Weathered Ash</option>
                  <option value="ivory">Ivory</option>
                </select>
              </label>
            </div>
            {state.elementalUnlocked && (
              <label>
                Elemental Chamber
                <select
                  value={w.element}
                  onChange={(e) =>
                    editWeapon(w.id, (x) => {
                      x.element = e.target.value;
                      if (e.target.value !== "off") x.lastElement = e.target.value;
                    })
                  }
                >
                  {ELEMENTS.map((x) => (
                    <option key={x} value={x}>
                      {capitalize(x)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

function DataSettings({
  state,
  exportSave,
  importSave,
  setDialog,
  pwaStatus,
  installPwa,
}: SettingsProps) {
  return (
    <>
      <SettingsHeading
        kicker="PORTABLE LEDGER"
        title="Data & saves"
        text="Your ledger saves automatically on this device. Export a file before moving browsers or computers."
      />
      <div className="save-status">
        <Icon name="lock" />
        <div>
          <span>AUTOSAVE HEALTHY</span>
          <h3>Last saved {timeAgo(state.savedAt)}</h3>
          <p>Stored locally on this device.</p>
        </div>
      </div>
      <div className={`install-status ${pwaStatus}`}>
        <div className="install-mark" aria-hidden="true">
          BL
        </div>
        <div>
          <span>OFFLINE FIELD KIT</span>
          <h3>
            {pwaStatus === "installed"
              ? "Installed on this device"
              : "Install Blackpowder Ledger"}
          </h3>
          <p>
            {pwaStatus === "installed"
              ? "Ready to open without internet. Updates arrive automatically when you reconnect."
              : pwaStatus === "available"
                ? "Adds a standalone app icon and keeps the complete armory available without internet."
                : "Open your browser menu and choose Install app or Add to Home Screen."}
          </p>
        </div>
        {pwaStatus !== "installed" && (
          <AppButton
            className={pwaStatus === "available" ? "primary" : ""}
            onClick={installPwa}
          >
            <Icon name="download" />
            {pwaStatus === "available" ? "Install App" : "How to Install"}
          </AppButton>
        )}
      </div>
      <div className="data-actions">
        <AppButton className="primary" onClick={exportSave}>
          <Icon name="download" />
          Export Portable Save
        </AppButton>
        <AppButton onClick={importSave}>
          <Icon name="upload" />
          Import Save
        </AppButton>
      </div>
      <div className="danger-zone">
        <div>
          <h3>Reset the ledger</h3>
          <p>
            Restore factory ammunition, weapons, presets, gold, and appearance.
            The reset can be undone until you close the page.
          </p>
        </div>
        <AppButton
          className="danger"
          onClick={() =>
            setDialog({
              type: "reset",
              title: "Reset the Entire Ledger?",
              body: "This restores the Charmworks factory defaults. Your current state will remain available through Undo during this session.",
            })
          }
        >
          Reset Everything
        </AppButton>
      </div>
    </>
  );
}
