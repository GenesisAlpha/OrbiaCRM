"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdminEscrita } from "@/lib/auth/requirePlatformAdmin";
import { requireSupportWrite } from "@/lib/impersonate/support";
import { updateSettlement } from "@/lib/xpay/manual-admin";

export type FormState = { ok: boolean; message: string };

function value(form: FormData, name: string) {
  const field = form.get(name);
  return typeof field === "string" ? field.trim() : "";
}

function minorUnits(amount: string) {
  if (!/^\d{1,9}([,.]\d{1,2})?$/.test(amount)) return 0;
  const [whole, decimals = ""] = amount.replace(",", ".").split(".");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

export async function bookSettlement(_before: FormState, form: FormData): Promise<FormState> {
  const { user } = await requirePlatformAdminEscrita();
  if (await requireSupportWrite()) return { ok: false, message: "A sess�o de suporte � s� de leitura." };
  const invoiceIds = form.getAll("invoiceId").filter((id): id is string => typeof id === "string");
  const amountMinor = minorUnits(value(form, "amount"));
  const reference = value(form, "reference");
  const paymentDate = value(form, "paymentDate");
  if (value(form, "confirmed") !== "yes" || !invoiceIds.length || !amountMinor || !reference || !paymentDate) {
    return { ok: false, message: "Preenche os dados e confirma a transfer�ncia efetuada." };
  }
  try {
    await updateSettlement(user.id, { action: "book", invoiceIds, amountMinor, reference, paymentDate, requestId: value(form, "requestId") });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha ao registar a sa�da." };
  }
  revalidatePath("/admin/xpay/saidas");
  return { ok: true, message: "Sa�da contabil�stica registada." };
}

export async function reverseSettlement(_before: FormState, form: FormData): Promise<FormState> {
  const { user } = await requirePlatformAdminEscrita();
  if (await requireSupportWrite()) return { ok: false, message: "A sess�o de suporte � s� de leitura." };
  const reason = value(form, "reason");
  if (reason.length < 4 || value(form, "confirmed") !== "yes") {
    return { ok: false, message: "Indica o motivo e confirma a anula��o contabil�stica." };
  }
  try {
    await updateSettlement(user.id, { action: "reverse", settlementId: value(form, "settlementId"), reason });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha ao anular o registo." };
  }
  revalidatePath("/admin/xpay/saidas");
  return { ok: true, message: "Registo anulado. A anula��o ficou no hist�rico." };
}
