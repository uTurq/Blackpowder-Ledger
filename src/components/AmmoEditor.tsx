import { Fragment } from "react";
import {
  BANDS,
  CARTRIDGE_FAMILIES,
  CASE_MATERIALS,
  Cartridge,
  type CartridgeVisual,
  EFFECTS,
  FX_PLACEMENTS,
  INTENSITIES,
  MARKINGS,
  PROJECTILES,
  PROJECTILE_MATERIALS,
  STYLE_PRESETS,
  TIP_STYLES,
} from "./Cartridge";
import { ammoInUse } from "../lib/ledger";
import type { Commit, Passive } from "../lib/store";
import type { Ammo, DialogState, LedgerState } from "../lib/types";
import { capitalize, clone, money, uid } from "../lib/util";
import { AppButton, SettingsHeading, VisualSelect } from "./ui";

type VisualField = Exclude<keyof CartridgeVisual, "preset">;
const VISUAL_GROUPS: {
  title: string;
  fields: [VisualField, string, ReadonlyArray<readonly [string, string]>][];
}[] = [
  {
    title: "Structural silhouette",
    fields: [
      ["family", "Cartridge family", CARTRIDGE_FAMILIES],
      ["projectile", "Projectile profile", PROJECTILES],
    ],
  },
  {
    title: "Materials & markings",
    fields: [
      ["caseMaterial", "Case material", CASE_MATERIALS],
      ["projectileMaterial", "Projectile material", PROJECTILE_MATERIALS],
      ["tipStyle", "Tip treatment", TIP_STYLES],
    ],
  },
];
const MARKING_FIELDS: [VisualField, string, ReadonlyArray<readonly [string, string]>][] = [
  ["band", "Case band", BANDS],
  ["marking", "Casing marking", MARKINGS],
];
const EFFECT_FIELDS: [VisualField, string, ReadonlyArray<readonly [string, string]>][] = [
  ["fx", "Effect", EFFECTS],
  ["fxPlacement", "Effect placement", FX_PLACEMENTS],
  ["intensity", "Effect intensity", INTENSITIES],
];

export function AmmunitionSettings({
  state,
  passive,
  commit,
  setDialog,
}: {
  state: LedgerState;
  passive: Passive;
  commit: Commit;
  setDialog: (d: DialogState) => void;
}) {
  return (
    <>
      <SettingsHeading
        kicker="AMMOSMITH CATALOG"
        title="Ammunition"
        text="Factory defaults follow the approved AC-3 revisions; custom variants remain fully editable."
      />
      <div className="ammo-editor-list">
        {state.ammo.map((a) => (
          <AmmoEditor
            key={a.id}
            ammo={a}
            state={state}
            passive={passive}
            commit={commit}
            setDialog={setDialog}
          />
        ))}
      </div>
      <AppButton
        variant="primary" className="add-ammo"
        onClick={() =>
          setDialog({
            type: "newAmmo",
            title: "New Ammunition Type",
            value: "New Specialty Round",
            body: "Create a new editable cartridge for homebrew ammunition.",
          })
        }
      >
        + Add Ammunition Type
      </AppButton>
    </>
  );
}

function AmmoEditor({
  ammo: a,
  state,
  passive,
  commit,
  setDialog,
}: {
  ammo: Ammo;
  state: LedgerState;
  passive: Passive;
  commit: Commit;
  setDialog: (d: DialogState) => void;
}) {
  const inUse = ammoInUse(state, a.id);
  const edit = (recipe: (item: Ammo) => void) =>
    passive((n) => {
      const item = n.ammo.find((x) => x.id === a.id);
      if (!item) return false;
      recipe(item);
    });
  // Any hand edit turns a factory look into a custom one; the legacy mirror
  // fields stay in sync for older saves.
  const editVisual = (field: VisualField, value: string) =>
    edit((item) => {
      item.visual[field] = value;
      item.visual.preset = "custom";
      if (field === "family") item.shape = value;
      if (field === "color") item.color = value;
      if (field === "fx") item.fx = value;
      if (field === "symbol") item.symbol = value;
    });
  const select = ([field, label, options]: (typeof EFFECT_FIELDS)[number]) => (
    <VisualSelect
      key={field}
      label={label}
      value={a.visual[field]}
      options={options}
      onChange={(value) => editVisual(field, value)}
    />
  );

  return (
    <details className="ammo-entry" style={{ "--ammo": a.color } as React.CSSProperties}>
      <summary>
        <Cartridge ammo={a} small density={state.theme.density} />
        <span>
          <b>{a.name}</b>
          <small>
            {money(a.cost)} · {a.effect}
          </small>
        </span>
        <em aria-hidden="true">›</em>
      </summary>
      <div className="ammo-editor visual-workshop">
        <div className="visual-preview-suite">
          <div className="hero-round-preview">
            <div>
              <Cartridge ammo={a} density={state.theme.density} />
              <span>Rendered round</span>
            </div>
            <div>
              <Cartridge ammo={a} silhouette density="minimal" />
              <span>Silhouette test</span>
            </div>
          </div>
          <p>
            If these two shapes read differently at a glance, the cartridge is
            doing its job.
          </p>
        </div>
        <div className="visual-fields">
          <label className="field">
            Name
            <input
              value={a.name}
              onChange={(e) =>
                edit((item) => {
                  item.name = e.target.value;
                })
              }
            />
          </label>
          <label className="field">
            Crafting cost
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={a.cost}
              onChange={(e) =>
                edit((item) => {
                  item.cost = Math.max(0, Number(e.target.value) || 0);
                })
              }
            />
          </label>
          <label className="field wide">
            Rules reminder
            <textarea
              value={a.effect}
              onChange={(e) =>
                edit((item) => {
                  item.effect = e.target.value;
                })
              }
            />
          </label>

          {VISUAL_GROUPS.map((group, i) => (
            <Fragment key={group.title}>
              <div className="visual-divider">{group.title}</div>
              {i === 0 && (
                <label className="field">
                  Appearance preset
                  <select
                    value={a.visual.preset}
                    onChange={(e) =>
                      edit((item) => {
                        item.visual = clone(
                          STYLE_PRESETS[e.target.value] || STYLE_PRESETS.custom,
                        );
                        item.color = item.visual.color;
                        item.symbol = item.visual.symbol;
                        item.fx = item.visual.fx;
                        item.shape = item.visual.family;
                      })
                    }
                  >
                    {Object.keys(STYLE_PRESETS).map((key) => (
                      <option key={key} value={key}>
                        {capitalize(key)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {group.fields.map(select)}
            </Fragment>
          ))}
          <label className="field">
            Accent / effect color
            <input
              type="color"
              value={a.visual.color}
              onChange={(e) => editVisual("color", e.target.value)}
            />
          </label>
          {MARKING_FIELDS.map(select)}
          <label className="field">
            Custom mark
            <input
              maxLength={3}
              value={a.visual.symbol}
              onChange={(e) => editVisual("symbol", e.target.value.slice(0, 3))}
            />
          </label>

          <div className="visual-divider">Animated effect</div>
          {EFFECT_FIELDS.map(select)}
          <div className="ammo-editor-actions">
            <AppButton
              onClick={() =>
                commit(
                  (n) => {
                    const src = n.ammo.find((x) => x.id === a.id);
                    if (!src) return false;
                    n.ammo.push({
                      ...clone(src),
                      id: uid("ammo"),
                      name: `${src.name} Variant`,
                      reserve: 0,
                      visual: { ...clone(src.visual), preset: "custom" },
                    });
                  },
                  `Duplicated ${a.name}.`,
                  "ammo",
                )
              }
            >
              Duplicate Variant
            </AppButton>
            <AppButton
              variant="danger"
              disabled={inUse}
              title={
                inUse
                  ? "Set reserve to 0 and remove this type from weapons and presets first."
                  : "Delete this ammunition type"
              }
              onClick={() =>
                setDialog({
                  type: "deleteAmmo",
                  id: a.id,
                  title: "Delete Ammunition Type?",
                  body: `“${a.name}” will be removed from the catalog. You can undo this afterward.`,
                })
              }
            >
              Delete Type
            </AppButton>
          </div>
        </div>
      </div>
    </details>
  );
}
