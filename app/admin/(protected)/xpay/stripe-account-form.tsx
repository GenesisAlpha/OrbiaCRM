"use client";

import { useActionState } from "react";
import { ligarStripe } from "./actions";

const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

export function StripeAccountForm() {
  const [state, action, pending] = useActionState(ligarStripe, { message: "", ok: false });
  return (
    <form action={action} className="grid max-w-xl gap-4 rounded-lg border p-5">
      <div>
        <h2 className="font-semibold">Ligar conta Stripe</h2>
        <p className="mt-1 text-sm text-muted-foreground">A XPAY valida as chaves e cria o webhook de confirmação de pagamentos.</p>
      </div>
      <label className="grid gap-1 text-sm">
        Nome interno
        <input className={inputClass} name="label" required maxLength={100} />
      </label>
      <label className="grid gap-1 text-sm">
        Chave de servidor
        <input className={inputClass} name="secretKey" type="password" autoComplete="new-password" required maxLength={315} />
      </label>
      <label className="grid gap-1 text-sm">
        Chave publicável
        <input className={inputClass} name="publishableKey" autoComplete="off" spellCheck={false} required maxLength={315} />
      </label>
      {state.message ? <p role={state.ok ? "status" : "alert"} className="text-sm">{state.message}</p> : null}
      <button
        className="justify-self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "A ligar…" : "Ligar conta"}
      </button>
    </form>
  );
}
