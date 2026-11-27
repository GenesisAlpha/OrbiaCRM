"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdminEscrita } from "@/lib/auth/requirePlatformAdmin";
import { requireSupportWrite } from "@/lib/impersonate/support";
import { ligarContaStripe } from "@/lib/xpay/admin-stripe";

export async function ligarStripe(
  _previous: { message: string; ok: boolean },
  form: FormData,
): Promise<{ message: string; ok: boolean }> {
  const { user } = await requirePlatformAdminEscrita();
  if (await requireSupportWrite()) return { ok: false, message: "A sessão de suporte é apenas de leitura." };
  const label = form.get("label");
  const secretKey = form.get("secretKey");
  const publishableKey = form.get("publishableKey");
  if (typeof label !== "string" || typeof secretKey !== "string" || typeof publishableKey !== "string") {
    return { ok: false, message: "Preenche a identificação e as duas chaves." };
  }
  try {
    await ligarContaStripe(user.id, { label, secretKey, publishableKey });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível ligar a conta Stripe.",
    };
  }
  revalidatePath("/admin/xpay");
  return { ok: true, message: "Conta ligada. Consulta o roteamento na lista de contas." };
}
