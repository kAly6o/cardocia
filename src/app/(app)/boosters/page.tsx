import { redirect } from "next/navigation";

export default function BoostersPage() {
  redirect("/lots?tab=boosters");
}
