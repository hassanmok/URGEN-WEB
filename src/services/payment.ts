/**
 * طبقة جاهزة للتوسع — ربط بوابة الدفع لاحقاً (Stripe، ZainCash، إلخ).
 * لا تستدعِ بوابة حقيقية من الواجهة قبل تهيئة الخادم والأسرار.
 */

export type PaymentIntentPayload = {
  amountIqd: number
  description: string
  appointmentId?: string
  customerEmail?: string
}

export type PaymentResult =
  | { ok: true; providerRef: string }
  | { ok: false; message: string }

export async function createPaymentIntent(
  payload: PaymentIntentPayload,
): Promise<PaymentResult> {
  void payload
  return {
    ok: false,
    message:
      'لم يتم تفعيل الدفع الإلكتروني بعد. يمكنكم إتمام الحجز عبر الهاتف أو الواتساب.',
  }
}
