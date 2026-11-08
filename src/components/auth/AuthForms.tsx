"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  signIn,
  signUp,
  requestPasswordReset,
  updatePassword,
} from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/Button";
import { Field, Input, FormMessage, type ActionState } from "@/components/ui/Form";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action] = useActionState<ActionState | null, FormData>(
    signIn,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-xl font-bold text-ink">Connexion</h1>
      <p className="text-sm text-muted">
        Accédez à votre collection et à votre activité.
      </p>
      <input type="hidden" name="redirect" value={redirectTo} />
      <Field label="E-mail">
        <Input name="email" type="email" required autoComplete="email" placeholder="vous@exemple.fr" />
      </Field>
      <Field label="Mot de passe">
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full">Se connecter</SubmitButton>
      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-muted transition-colors hover:text-ink">
          Mot de passe oublié ?
        </Link>
        <Link href="/signup" className="font-medium text-fire transition-colors hover:text-brand-strong">
          Créer un compte
        </Link>
      </div>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState<ActionState | null, FormData>(
    signUp,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-xl font-bold text-ink">Créer un compte</h1>
      <p className="text-sm text-muted">
        Commencez à gérer votre collection Pokémon.
      </p>
      <Field label="Nom (optionnel)">
        <Input name="full_name" autoComplete="name" placeholder="Votre nom" />
      </Field>
      <Field label="E-mail">
        <Input name="email" type="email" required autoComplete="email" placeholder="vous@exemple.fr" />
      </Field>
      <Field label="Mot de passe">
        <Input name="password" type="password" required autoComplete="new-password" placeholder="6 caractères minimum" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full">Créer mon compte</SubmitButton>
      <p className="text-center text-sm text-muted">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-fire hover:text-brand-strong">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState<ActionState | null, FormData>(
    requestPasswordReset,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-xl font-bold text-ink">Mot de passe oublié</h1>
      <p className="text-sm text-muted">
        Saisissez votre e-mail : vous recevrez un lien de réinitialisation.
      </p>
      <Field label="E-mail">
        <Input name="email" type="email" required autoComplete="email" placeholder="vous@exemple.fr" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full">Envoyer le lien</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="text-muted transition-colors hover:text-ink">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}

export function ResetForm() {
  const [state, action] = useActionState<ActionState | null, FormData>(
    updatePassword,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-xl font-bold text-ink">Nouveau mot de passe</h1>
      <p className="text-sm text-muted">
        Choisissez un nouveau mot de passe pour votre compte.
      </p>
      <Field label="Nouveau mot de passe">
        <Input name="password" type="password" required autoComplete="new-password" placeholder="6 caractères minimum" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full">Mettre à jour</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="text-muted transition-colors hover:text-ink">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
