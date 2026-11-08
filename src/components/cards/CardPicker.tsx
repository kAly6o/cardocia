"use client";

import { useEffect, useRef, useState } from "react";

interface PickerCard {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  set: { name: string } | null;
}

export function CardPicker({
  name,
  defaultCardId,
  defaultLabel,
  onSelect,
  onClear,
}: {
  name: string;
  defaultCardId?: string;
  defaultLabel?: string;
  onSelect?: (card: { id: string; name: string; setName: string | null }) => void;
  onClear?: () => void;
}) {
  const [q, setQ] = useState(defaultLabel ?? "");
  const [results, setResults] = useState<PickerCard[]>([]);
  const [selectedId, setSelectedId] = useState(defaultCardId ?? "");
  const [selectedLabel, setSelectedLabel] = useState(defaultLabel ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!q.trim() || selectedLabel === q) {
      setResults([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cards?q=${encodeURIComponent(q)}&limit=8`);
        const json = await res.json();
        setResults(json.cards ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q, selectedLabel]);

  function select(card: PickerCard) {
    setSelectedId(card.id);
    setSelectedLabel(`${card.name} — ${card.set?.name ?? "?"} n°${card.number}`);
    setQ(`${card.name} — ${card.set?.name ?? "?"} n°${card.number}`);
    setOpen(false);
    onSelect?.({ id: card.id, name: card.name, setName: card.set?.name ?? null });
  }

  return (
    <div ref={boxRef} className="relative">
      <input type="hidden" name={name} value={selectedId} />
      <input
        className="input"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          if (selectedId) {
            setSelectedId("");
            setSelectedLabel("");
            onClear?.();
          }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Rechercher une carte (nom ou numéro)…"
        autoComplete="off"
      />
      {open && (loading || results.length > 0) && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-line bg-surface-2 shadow-xl">
          {loading && (
            <li className="px-3 py-2 text-sm text-muted">Recherche…</li>
          )}
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => select(c)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-3"
              >
                <span className="truncate">{c.name}</span>
                <span className="shrink-0 text-xs text-muted">
                  {c.set?.name ?? "—"} n°{c.number}
                </span>
              </button>
            </li>
          ))}
          {!loading && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">Aucun résultat.</li>
          )}
        </ul>
      )}
    </div>
  );
}
