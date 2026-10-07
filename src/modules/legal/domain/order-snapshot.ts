import type { OrderLegalSnapshot } from "@/modules/legal/domain/types";

export function legalAcceptanceRows(
  customerId: string,
  snapshot: OrderLegalSnapshot,
): Array<{
  customerId: string;
  documentType: "TERMS" | "DELIVERY_POLICY" | "REFUND_POLICY";
  documentVersion: string;
}> {
  return [
    { customerId, documentType: "TERMS", documentVersion: snapshot.termsVersion },
    {
      customerId,
      documentType: "DELIVERY_POLICY",
      documentVersion: snapshot.deliveryPolicyVersion,
    },
    {
      customerId,
      documentType: "REFUND_POLICY",
      documentVersion: snapshot.refundPolicyVersion,
    },
  ];
}

export function orderLegalFieldData(snapshot: OrderLegalSnapshot) {
  return {
    termsVersion: snapshot.termsVersion,
    deliveryPolicyVersion: snapshot.deliveryPolicyVersion,
    refundPolicyVersion: snapshot.refundPolicyVersion,
  };
}
