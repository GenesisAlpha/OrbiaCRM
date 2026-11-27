import { randomUUID } from "node:crypto";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { readSettlements } from "@/lib/xpay/manual-admin";
import { ReverseSettlement, SettlementQueue } from "./forms";

export const dynamic = "force-dynamic";
const root = "/admin/xpay/saidas";
const euros = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
const auditTime = new Intl.DateTimeFormat("pt-PT", { timeZone: "Europe/Lisbon", dateStyle: "short", timeStyle: "short" });

function pageNumber(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{1,6}$/.test(value) ? Number(value) : 0;
}

function pageLink(queue: number, history: number) {
  return root + "?" + new URLSearchParams({ fila: String(queue), historico: String(history) }).toString();
}

export default async function ManualSettlements({ searchParams }: {
  searchParams: Promise<{ fila?: string | string[]; historico?: string | string[] }>;
}) {
  const { user, platformAdmin } = await requirePlatformAdmin();
  const params = await searchParams;
  const queuePage = pageNumber(params.fila);
  const historyPage = pageNumber(params.historico);
  const canWrite = platformAdmin.scope === "full";
  const data = await readSettlements(user.id, queuePage, historyPage).catch(() => null);
  const requestId = randomUUID();

  return <main className="grid max-w-5xl gap-6">
    <header>
      <a href="/admin/xpay"> Contas Stripe da XPAY</a>
      <h1 className="text-2xl font-semibold">Sa�das manuais</h1>
      <p>AtlasClub � Liquida��o em EUR. Regista aqui as transfer�ncias j� efetuadas pela equipa.</p>
    </header>
    {!data ? <p role="alert">As sa�das da XPAY est�o temporariamente indispon�veis.</p> : <>
      <section className="grid gap-3 p-4">
        <h2 className="font-semibold">Faturas por liquidar ou em revis�o</h2>
        <SettlementQueue key={requestId} invoices={data.queue} canWrite={canWrite} today={data.today} requestId={requestId} />
        {(queuePage > 0 || data.moreQueue) && <nav aria-label="P�ginas das faturas" className="flex gap-3">
          {queuePage > 0 && <a href={pageLink(queuePage - 1, historyPage)}>P�gina anterior</a>}
          {data.moreQueue && <a href={pageLink(queuePage + 1, historyPage)}>P�gina seguinte</a>}
        </nav>}
      </section>
      <section className="grid gap-3 p-4">
        <h2 className="font-semibold">Hist�rico contabil�stico</h2>
        {!data.history.length && <p>Sem sa�das registadas.</p>}
        {data.history.map(receipt => <article key={receipt.id} className="grid gap-1 rounded border p-3">
          <strong>{euros.format(receipt.amount_minor / 100)} � {receipt.reference}</strong>
          <p>Transfer�ncia em {receipt.payment_date} � Registo em {auditTime.format(new Date(receipt.recorded_at))}</p>
          <p>Operador <code>{receipt.recorded_by}</code></p>
          <details><summary>Faturas ({receipt.invoice_ids.length})</summary><ul>
            {receipt.invoice_ids.map(id => <li key={id}>{id}</li>)}
          </ul></details>
          {receipt.reversed_at
            ? <p>Anulada em {auditTime.format(new Date(receipt.reversed_at))} por <code>{receipt.reversed_by}</code>. {receipt.reversal_reason}</p>
            : canWrite && <ReverseSettlement receipt={receipt} />}
        </article>)}
        {(historyPage > 0 || data.moreHistory) && <nav aria-label="P�ginas do hist�rico" className="flex gap-3">
          {historyPage > 0 && <a href={pageLink(queuePage, historyPage - 1)}>P�gina anterior</a>}
          {data.moreHistory && <a href={pageLink(queuePage, historyPage + 1)}>P�gina seguinte</a>}
        </nav>}
      </section>
    </>}
  </main>;
}
