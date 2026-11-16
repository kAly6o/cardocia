// Couleurs partagées (badges de statuts, etc.).

export function stockStatusClass(status: string): string {
  switch (status) {
    case "Disponible":
      return "text-emerald-300 bg-emerald-900/30 border-emerald-600/40";
    case "Réservé":
      return "text-amber-300 bg-amber-900/30 border-amber-600/40";
    case "Vendu":
      return "text-rose-300 bg-rose-900/30 border-rose-600/40";
    case "Dans lot":
      return "text-cyan-300 bg-cyan-900/30 border-cyan-600/40";
    case "Dans booster":
      return "text-indigo-300 bg-indigo-900/30 border-indigo-600/40";
    default:
      return "text-zinc-300 bg-zinc-700/40 border-zinc-500/40";
  }
}