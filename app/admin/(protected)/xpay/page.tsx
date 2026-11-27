import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { listarContasStripe, stripeAdminConfigured, type StripeAccount } from "@/lib/xpay/admin-stripe";
import { StripeAccountForm } from "./stripe-account-form";

export const dynamic = "force-dynamic";

export default async function XpayStripeAdminPage() {
  const { user, platformAdmin } = await requirePlatformAdmin();
  const configured = stripeAdminConfigured();
  let accounts: StripeAccount[] = [];
  let unavailable = false;
  if (configured) {
    try {
      accounts = await listarContasStripe(user.id);
    } catch {
      unavailable = true;
    }
  }

  return (
    <main className="grid max-w-4xl gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Contas Stripe da XPAY</h1>
        <p className="mt-1 text-sm text-muted-foreground">Contas live, webhooks e disponibilidade para roteamento.</p>
      </header>

      {!configured ? (
        <p role="status" className="rounded-lg border p-4 text-sm">A ligação interna à XPAY ainda não está configurada.</p>
      ) : unavailable ? (
        <p role="alert" className="rounded-lg border p-4 text-sm">Não foi possível consultar as contas Stripe.</p>
      ) : (
        <>
          <section className="overflow-auto rounded-lg border" aria-label="Contas ligadas">
            {accounts.length ? (
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3">Conta</th>
                    <th className="p-3">Roteamento</th>
                    <th className="p-3">Webhook</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accounts.map(account => (
                    <tr key={account.id}>
                      <td className="p-3">
                        <span className="block font-medium">{account.label ?? "Stripe"}</span>
                        <code className="text-xs text-muted-foreground">{account.stripeAccountId}</code>
                      </td>
                      <td className="p-3">{account.status === "active" ? "Ativo" : "Inativo"}</td>
                      <td className="p-3">{account.webhookConfigured ? "Configurado" : "Pendente"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="p-4 text-sm text-muted-foreground">Nenhuma conta Stripe ligada.</p>}
          </section>
          {platformAdmin.scope === "full" ? <StripeAccountForm /> : null}
        </>
      )}
    </main>
  );
}
