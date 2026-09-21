"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { isAppLocale } from "@/config/i18n";
import { getPathname } from "@/i18n/navigation";
import { requireCustomer } from "@/modules/customer-auth/queries";
import { getDisplayCurrency } from "@/server/preferences/currency";
import { getExchangeRateSet } from "@/server/exchange-rates/service";
import { requireCheckoutContext } from "@/modules/checkout/queries";
import { createOrderFromCheckoutDraft } from "@/modules/orders/create-from-draft";
import { getOwnedOrderPaymentStatuses, getOwnedOrderRecord } from "@/modules/orders/queries";
import { toOwnedOrderPaymentStatusResult } from "@/modules/orders/domain/confirmation";
import { createOrGetPaymentIntentForOrder } from "@/modules/payments/create-intent";
import { getStripeGateway } from "@/server/stripe/client";
import { getPrisma } from "@/server/db/prisma";
import { ORDER_CHANGED_MESSAGE, type OrderActionState } from "@/modules/orders/action-state";
import { canAccessCustomerOrder } from "@/modules/orders/domain/ownership";

function paymentPath(locale: string, orderNumber: string) {
  const safe = isAppLocale(locale) ? locale : "es-MX";
  return getPathname({
    locale: safe,
    href: { pathname: "/pago/[orderNumber]", params: { orderNumber } },
  });
}

function revalidateOrderSurfaces() {
  revalidatePath("/cuenta");
  revalidatePath("/en/account");
  revalidatePath("/carrito");
  revalidatePath("/en/cart");
  revalidatePath("/checkout");
  revalidatePath("/en/checkout");
  revalidatePath("/admin/orders");
}

export async function startOrderPayment(
  previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  void previousState;
  void formData;
  const locale = await getLocale();
  const context = await requireCheckoutContext();
  const result = await createOrderFromCheckoutDraft({
    customerId: context.customer.id,
    checkoutDraftId: context.draft.id,
    locale: isAppLocale(locale) ? locale : "es-MX",
    displayCurrency: await getDisplayCurrency(),
    rateSet: await getExchangeRateSet(),
  });

  if (!result.ok) {
    revalidateOrderSurfaces();
    return {
      error: result.code === "CHANGED" ? ORDER_CHANGED_MESSAGE : "No pudimos crear el pedido.",
      success: null,
    };
  }

  await createOrGetPaymentIntentForOrder(result.orderId);
  revalidateOrderSurfaces();
  redirect(paymentPath(locale, result.orderNumber));
}

export async function cancelPendingOrder(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const customer = await requireCustomer(
    getPathname({
      locale: isAppLocale(locale) ? locale : "es-MX",
      href: { pathname: "/pago/[orderNumber]", params: { orderNumber: orderNumber || "x" } },
    }),
  );
  const order = await getOwnedOrderRecord({ customerId: customer.id, orderNumber });
  const accountPath = getPathname({ locale: isAppLocale(locale) ? locale : "es-MX", href: "/cuenta" });
  if (!order || !canAccessCustomerOrder({ orderCustomerId: order.customerId, customerId: customer.id })) {
    redirect(accountPath);
  }
  if (order.status === "PAID" || order.paymentStatus === "SUCCEEDED") {
    redirect(
      getPathname({
        locale: isAppLocale(locale) ? locale : "es-MX",
        href: { pathname: "/cuenta/pedidos/[orderNumber]", params: { orderNumber } },
      }),
    );
  }
  if (order.status !== "PENDING_PAYMENT") {
    redirect(accountPath);
  }

  if (order.stripePaymentIntentId) {
    await getStripeGateway().cancelPaymentIntent(order.stripePaymentIntentId);
  }

  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: order.id },
      select: { status: true, paymentStatus: true },
    });
    if (!current || current.status === "PAID" || current.paymentStatus === "SUCCEEDED") {
      return;
    }
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        paymentStatus: "CANCELED",
        cancelledAt: new Date(),
      },
    });
    await tx.cart.update({
      where: { id: order.cartId },
      data: { status: "ACTIVE" },
    });
    await tx.orderEvent.create({
      data: { orderId: order.id, type: "ORDER_CANCELLED" },
    });
  });

  revalidateOrderSurfaces();
  redirect(getPathname({ locale: isAppLocale(locale) ? locale : "es-MX", href: "/carrito" }));
}

export async function getOwnedOrderPaymentStatus(orderNumber: string) {
  const locale = await getLocale();
  const customer = await requireCustomer(
    getPathname({
      locale: isAppLocale(locale) ? locale : "es-MX",
      href: { pathname: "/pedido/[orderNumber]/confirmacion", params: { orderNumber } },
    }),
  );

  const order = await getOwnedOrderPaymentStatuses(orderNumber);
  return toOwnedOrderPaymentStatusResult({
    customerId: customer.id,
    order,
  });
}
