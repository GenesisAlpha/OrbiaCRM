import "server-only";
import { SignJWT } from "jose";

const endpoint = "http://xpay-manual-settlement:3009/settlements";

export type QueueStatus = "ready" | "scheduled" | "calendar_missing" | "refund_review" | "dispute_review" | "paid_with_adjustment";
export interface SettlementQueueItem {
  invoice_id: string;
  currency: "EUR";
  amount_minor: number;
  dispatch_window_at: string | null;
  status: QueueStatus;
}

export interface SettlementReceipt {
  id: string;
  currency: "EUR";
  amount_minor: number;
  reference: string;
  payment_date: string;
  recorded_at: string;
  recorded_by: string;
  reversed_at: string | null;
  reversed_by: string | null;
  reversal_reason: string | null;
  invoice_ids: string[];
}

interface SettlementPage {
  queue: SettlementQueueItem[];
  history: SettlementReceipt[];
  moreQueue: boolean;
  moreHistory: boolean;
  today: string;
}

type SettlementMutation = {
  action: "book";
  requestId: string;
  reference: string;
  paymentDate: string;
  amountMinor: number;
  invoiceIds: string[];
} | { action: "reverse"; settlementId: string; reason: string };

const errors: Record<string, string> = {
  duplicate: "A refer�ncia j� foi usada ou este registo foi alterado. Atualiza a p�gina e confere o hist�rico.",
  ineligible_or_mismatched: "As faturas j� n�o est�o eleg�veis ou o total n�o coincide com o valor transferido.",
  invalid_fields: "Confere a refer�ncia, a data, o valor e as faturas selecionadas.",
  unavailable: "A liga��o �s sa�das XPAY est� indispon�vel.",
};

async function call<T>(actor: string, url: URL, body?: SettlementMutation): Promise<T> {
  const key = process.env.XPAY_STRIPE_ADMIN_BRIDGE_KEY;
  if (!key || key.length < 32) throw new Error(errors.unavailable);
  const token = await new SignJWT({ scope: body ? "settlement:manage" : "settlement:read" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(actor)
    .setIssuer("orbia-crm")
    .setAudience("xpay-settlement-admin")
    .setIssuedAt()
    .setExpirationTime("45s")
    .sign(new TextEncoder().encode(key));
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { authorization: "Bearer " + token, "content-type": "application/json" },
    body: body && JSON.stringify(body), signal: AbortSignal.timeout(15_000), cache: "no-store", redirect: "error",
  }).catch(() => null);
  if (!response) throw new Error(errors.unavailable);
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new Error(errors[result?.error] ?? errors.unavailable);
  return result;
}

export function readSettlements(actor: string, queue: number, history: number) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ queue: String(queue), history: String(history) }).toString();
  return call<SettlementPage>(actor, url);
}

export function updateSettlement(actor: string, params: SettlementMutation) {
  return call<{ id: string }>(actor, new URL(endpoint), params);
}
