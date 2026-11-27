"use client";

import { useActionState, useState } from "react";
import type { SettlementQueueItem, SettlementReceipt } from "@/lib/xpay/manual-admin";
import { bookSettlement, reverseSettlement } from "./actions";

const initial = { ok: false, message: "" };
const currency = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const windowFormat = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon", dateStyle: "short", timeStyle: "short",
});
const status: Record<SettlementQueueItem["status"], string> = {
  ready: "Eleg�vel para registo",
  scheduled: "A aguardar a janela",
  calendar_missing: "Calend�rio por confirmar",
  refund_review: "Reembolso em revis�o",
  dispute_review: "Disputa em revis�o",
  paid_with_adjustment: "Registada � requer revis�o",
};

export function SettlementQueue({ invoices, canWrite, today, requestId }: {
  invoices: SettlementQueueItem[];
  canWrite: boolean;
  today: string;
  requestId: string;
}) {
  const [result, action, pending] = useActionState(bookSettlement, initial);
  const [selected, setSelected] = useState<string[]>([]);
  const ready = invoices.some(invoice => invoice.status === "ready");
  const total = invoices.filter(invoice => selected.includes(invoice.invoice_id)).reduce((sum, invoice) => sum + invoice.amount_minor, 0);
  if (!invoices.length) return <p>Sem sa�das pendentes de registo.</p>;
  const table = <div className="overflow-auto"><table className="w-full text-left text-sm">
    <thead><tr><th className="p-3">Fatura</th><th className="p-3">Valor l�quido</th><th className="p-3">Janela em Lisboa</th><th className="p-3">Estado</th></tr></thead>
    <tbody>{invoices.map(invoice => <tr key={invoice.invoice_id}>
      <td className="p-3">
        {canWrite && invoice.status === "ready" ? <label className="flex items-center gap-2">
          <input type="checkbox" name="invoiceId" value={invoice.invoice_id}
            checked={selected.includes(invoice.invoice_id)}
            onChange={event => {
              const checked = event.target.checked;
              setSelected(previous => checked
                ? [...previous, invoice.invoice_id] : previous.filter(id => id !== invoice.invoice_id));
            }} />
          <span>{invoice.invoice_id}</span>
        </label> : invoice.invoice_id}
      </td>
      <td className="p-3">{currency.format(invoice.amount_minor / 100)}</td>
      <td className="p-3">{invoice.dispatch_window_at ? windowFormat.format(new Date(invoice.dispatch_window_at)) : "-"}</td>
      <td className="p-3">{status[invoice.status]}</td>
    </tr>)}</tbody>
  </table></div>;
  if (!canWrite || !ready) return table;
  return <form action={action} className="grid gap-4">
    <input type="hidden" name="requestId" value={requestId} />
    {table}
    <p aria-live="polite">Total selecionado <strong>{currency.format(total / 100)}</strong></p>
    <div className="grid gap-3">
      <label>Valor transferido em EUR <input name="amount" inputMode="decimal" placeholder="8,42" required /></label>
      <label>Data da transfer�ncia em Lisboa <input type="date" name="paymentDate" defaultValue={today} max={today} required /></label>
      <label>Refer�ncia banc�ria ou contabil�stica <input name="reference" maxLength={120} required /></label>
    </div>
    <label><input type="checkbox" name="confirmed" value="yes" required /> A transfer�ncia j� foi efetuada fora da XPAY.</label>
    <button type="submit" disabled={pending || !selected.length}>{pending ? "A registar." : "Registar sa�da"}</button>
    {result.message && <p role={result.ok ? "status" : "alert"}>{result.message}</p>}
  </form>;
}

export function ReverseSettlement({ receipt }: { receipt: SettlementReceipt }) {
  const [result, action, pending] = useActionState(reverseSettlement, initial);
  return <details>
    <summary>Anular registo contabil�stico</summary>
    <form action={action} className="grid gap-3">
      <input type="hidden" name="settlementId" value={receipt.id} />
      <label>Motivo <input name="reason" minLength={4} maxLength={500} required /></label>
      <label><input type="checkbox" name="confirmed" value="yes" required /> Confirmo a anula��o do registo.</label>
      <button type="submit" disabled={pending}>{pending ? "A anular." : "Anular registo"}</button>
      {result.message && <p role={result.ok ? "status" : "alert"}>{result.message}</p>}
    </form>
  </details>;
}
