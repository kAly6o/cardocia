"use client";

import { useEffect, useState } from "react";
import { RARITIES, FINISHES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import type { CompositionRule } from "@/lib/compose";

interface Slot {
  rarity: string;
  finish: string;
  count: string;
}

export function CompositionRuleInput({
  name = "rule",
  defaultValue,
}: {
  name?: string;
  defaultValue?: CompositionRule | null;
}) {
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [sets, setSets] = useState<{ id: string; name: string }[]>([]);
  const [sourceType, setSourceType] = useState<"all" | "collection" | "set">(
    defaultValue?.source.type ?? "all",
  );
  const [sourceId, setSourceId] = useState(defaultValue?.source.id ?? "");
  const [slots, setSlots] = useState<Slot[]>(
    defaultValue?.slots?.length
      ? defaultValue.slots.map((s) => ({
          rarity: s.rarity ?? "",
          finish: s.finish ?? "",
          count: String(s.count || 1),
        }))
      : [{ rarity: "", finish: "", count: "1" }],
  );
  const [allowDuplicates, setAllowDuplicates] = useState(defaultValue?.allowDuplicates ?? false);

  useEffect(() => {
    fetch("/api/catalog?type=collections")
      .then((r) => r.json())
      .then((j) => setCollections(j.collections ?? []))
      .catch(() => setCollections([]));
    fetch("/api/catalog?type=sets")
      .then((r) => r.json())
      .then((j) => setSets(j.sets ?? []))
      .catch(() => setSets([]));
  }, []);

  const total = slots.reduce((s, x) => s + (parseInt(x.count) || 0), 0);

  const rule = {
    source: { type: sourceType, id: sourceType === "all" ? null : sourceId || null },
    slots: slots.map((s) => ({
      rarity: s.rarity || null,
      finish: s.finish || null,
      count: parseInt(s.count) || 0,
    })),
    allowDuplicates,
  };

  const updateSlot = (i: number, patch: Partial<Slot>) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addSlot = () => setSlots((prev) => [...prev, { rarity: "", finish: "", count: "1" }]);
  const removeSlot = (i: number) => setSlots((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface-2/40 p-3">
      <input type="hidden" name={name} value={JSON.stringify(rule)} />

      <div>
        <label className="field-label">Piocher depuis</label>
        <select
          className="select"
          value={sourceType}
          onChange={(e) => {
            setSourceType(e.target.value as typeof sourceType);
            setSourceId("");
          }}
        >
          <option value="all">Tout le stock (aléatoire)</option>
          <option value="collection">Une collection</option>
          <option value="set">Une extension</option>
        </select>

        {sourceType === "collection" && (
          <select className="select mt-2" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">Choisir une collection…</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        {sourceType === "set" && (
          <select className="select mt-2" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">Choisir une extension…</option>
            {sets.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-2">
        {slots.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_64px_28px] items-end gap-2">
            <div>
              <label className="field-label">Rareté</label>
              <select className="select" value={s.rarity} onChange={(e) => updateSlot(i, { rarity: e.target.value })}>
                <option value="">Toutes</option>
                {RARITIES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Finition</label>
              <select className="select" value={s.finish} onChange={(e) => updateSlot(i, { finish: e.target.value })}>
                <option value="">Toutes</option>
                {FINISHES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Qté</label>
              <input className="input" type="number" min={1} value={s.count} onChange={(e) => updateSlot(i, { count: e.target.value })} />
            </div>
            <button
              type="button"
              onClick={() => removeSlot(i)}
              className="mb-1 text-muted transition-colors hover:text-red-300"
              title="Retirer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={addSlot}>
          + Ajouter un slot
        </Button>
        <span className="text-sm text-muted">
          {total} carte{total > 1 ? "s" : ""}
        </span>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={allowDuplicates} onChange={(e) => setAllowDuplicates(e.target.checked)} />
        Autoriser les doublons (même carte plusieurs fois)
      </label>
    </div>
  );
}
