import "server-only";
import { SignJWT } from "jose";

const url = "http://xpay-stripe-admin:3007/crm/admin/xpay/stripe-accounts";

export type StripeAccount = {
  id: string;
  label: string | null;
  stripeAccountId: string;
  status: string;
  webhookConfigured: boolean;
  webhookUrl: string;
};

export function stripeAdminConfigured() {
  return (process.env.XPAY_STRIPE_ADMIN_BRIDGE_KEY?.length ?? 0) >= 32;
}

async function requestStripeAdmin(actorId: string, body?: {
  label: string;
  secretKey: string;
  publishableKey: string;
}) {
  const key = process.env.XPAY_STRIPE_ADMIN_BRIDGE_KEY;
  if (!key || key.length < 32) throw new Error("A ligação interna à XPAY ainda não está configurada.");
  const token = await new SignJWT({ scope: body ? "stripe:manage" : "stripe:read" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(actorId)
    .setIssuer("orbia-crm")
    .setAudience("xpay-stripe-admin")
    .setIssuedAt()
    .setExpirationTime("50s")
    .sign(new TextEncoder().encode(key));
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { authorization: "Bearer " + token, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(body ? 75_000 : 8000),
  }).catch(() => null);

  if (!response) throw new Error("O serviço de contas Stripe da XPAY está indisponível.");
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if ([400, 409, 502, 503].includes(response.status) && typeof data?.message === "string") {
      throw new Error(data.message);
    }
    throw new Error("O serviço de contas Stripe recusou o pedido.");
  }
  return data;
}

export async function listarContasStripe(actorId: string): Promise<StripeAccount[]> {
  const result = await requestStripeAdmin(actorId);
  if (!Array.isArray(result)) throw new Error("Resposta inválida da XPAY.");
  return result;
}

export async function ligarContaStripe(actorId: string, body: {
  label: string;
  secretKey: string;
  publishableKey: string;
}): Promise<StripeAccount> {
  return requestStripeAdmin(actorId, body);
}
