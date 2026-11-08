"use client";

import { useEffect, useState } from "react";
import { CardImage } from "./CardImage";

export interface PickedCard {
  id: string;
  name: string;
  number: string;
  image: string | null;
  rarity: string | null;
  pokemon_type: string | null;
}

/**
 * Parcours du catalogue (collection → extension → grille de cartes) pour
 * choisir une carte. Appelle `onSelect` quand l'utilisateur clique une carte.
 */
export function CardGridPicker({
  onSelect,
}: {
  onSelect: (card: PickedCard) => void;
}) {
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [collectionId, setCollectionId] = useState("");
  const [sets, setSets] = useState<{ id: string; name: string }[]>([]);
  const [setId, setSetId] = useState("");
  const [cards, setCards] = useState<PickedCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/catalog?type=collections")
      .then((r) => r.json())
      .then((j) => setCollections(j.collections ?? []))
      .catch(() => setCollections([]));
  }, []);

  useEffect(() => {
    if (!collectionId) {
      setSets([]);
      return;
    }
    fetch(`/api/catalog?type=sets&collection=${collectionId}`)
      .then((r) => r.json())
      .then((j) => setSets(j.sets ?? []))
      .catch(() => setSets([]));
  }, [collectionId]);

  useEffect(() => {
    if (!setId) {
      setCards([]);
      return;
    }
    setLoading(true);
    fetch(`/api/catalog?type=cards&set=${setId}`)
      .then((r) => r.json())
      .then((j) => setCards(j.cards ?? []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [setId]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Collection</label>
          <select
            className="select"
            value={collectionId}
            onChange={(e) => {
              setCollectionId(e.target.value);
              setSetId("");
              setCards([]);
            }}
          >
            <option value="">Choisir une collection…</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Extension</label>
          <select
            className="select"
            value={setId}
            onChange={(e) => setSetId(e.target.value)}
            disabled={!collectionId}
          >
            <option value="">Choisir une extension…</option>
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted">Chargement…</p>
      ) : setId && cards.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Aucune carte dans cette extension.</p>
      ) : cards.length > 0 ? (
        <div className="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {cards.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className="group overflow-hidden rounded-lg border border-line bg-surface text-left transition-colors hover:border-brand"
            >
              <div className="aspect-[63/88] overflow-hidden bg-surface-2">
                <CardImage src={c.image} alt={c.name} className="h-full w-full transition-transform duration-200 group-hover:scale-105" />
              </div>
              <div className="p-1.5">
                <p className="truncate text-xs font-medium text-ink" title={c.name}>
                  {c.name}
                </p>
                <p className="truncate text-[10px] text-muted">n°{c.number}</p>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
