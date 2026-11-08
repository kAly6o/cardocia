"use client";

import { useActionState } from "react";
import { Field, Input, Select, FormMessage, type ActionState } from "@/components/ui/Form";
import { SubmitButton } from "@/components/ui/Button";
import { updateProfile } from "@/lib/actions/auth";
import { savePlatforms } from "@/lib/actions/settings";
import { CURRENCIES } from "@/lib/constants";
import { Textarea } from "@/components/ui/Form";

export function ProfileForm({
  fullName,
  defaultCurrency,
}: {
  fullName: string | null;
  defaultCurrency: string;
}) {
  const [state, action] = useActionState<ActionState | null, FormData>(updateProfile, null);

  return (
    <form action={action} className="space-y-4">
      <Field label="Nom complet">
        <Input name="full_name" defaultValue={fullName ?? ""} placeholder="Votre nom" />
      </Field>
      <Field label="Devise par défaut">
        <Select name="default_currency" defaultValue={defaultCurrency}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      <FormMessage state={state} />
      <SubmitButton>Enregistrer le profil</SubmitButton>
    </form>
  );
}

export function PlatformsForm({ platforms }: { platforms: string[] }) {
  const [state, action] = useActionState<ActionState | null, FormData>(savePlatforms, null);

  return (
    <form action={action} className="space-y-4">
      <Field
        label="Plateformes personnalisées"
        hint="Une plateforme par ligne. Elles s'ajoutent aux plateformes par défaut (Cardmarket, eBay, Vinted, Leboncoin, Vente directe)."
      >
        <Textarea name="platforms" rows={5} defaultValue={platforms.join("\n")} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton>Enregistrer les plateformes</SubmitButton>
    </form>
  );
}
