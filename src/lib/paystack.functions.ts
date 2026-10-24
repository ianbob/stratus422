import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MEMBERSHIP_FEE_MINOR, PAYSTACK_CURRENCY } from "./paystack";

const referenceSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);

type PaystackEnvelope<T> = {
  status: boolean;
  message?: string;
  data?: T;
};

function getPaystackSecret(): string {
  const secret = process.env["PAYSTACK_SECRET_KEY"];
  if (!secret) throw new Error("Payments are not configured. Add PAYSTACK_SECRET_KEY on the server.");
  return secret;
}

async function paystackRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaystackSecret()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json()) as PaystackEnvelope<T>;
  if (!response.ok || !payload.status || !payload.data) {
    throw new Error(payload.message || "Paystack could not complete the request.");
  }
  return payload.data;
}

export const initializeMembershipPayment = createServerFn({ method: "POST" })
  .handler(async () => {
    const reference = `menger_${crypto.randomUUID().replaceAll("-", "")}`;
    return {
      reference,
      email: "info@mengersacco.co.ke",
      amount: MEMBERSHIP_FEE_MINOR,
      currency: PAYSTACK_CURRENCY,
    };
  });

export const verifyMembershipPayment = createServerFn({ method: "GET" })
  .validator((input: unknown) => referenceSchema.parse(input))
  .handler(async ({ data: reference }) => {
    const payment = await paystackRequest<{
      status: string;
      amount: number;
      currency: string;
    }>(`/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });

    return {
      paid:
        payment.status === "success" &&
        payment.amount === MEMBERSHIP_FEE_MINOR &&
        payment.currency === PAYSTACK_CURRENCY,
    };
  });