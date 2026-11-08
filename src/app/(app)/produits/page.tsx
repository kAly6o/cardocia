import { redirect } from "next/navigation";

export default function ProduitsPage() {
  redirect("/collection?tab=sealed");
}
