import { exploreUrl, orderAccountUrl, quoteAccountUrl } from "@/modules/email/domain/links";
import { getEmailHeadline, getEmailIntro } from "@/modules/email/domain/presentation";
import { getEmailSubject } from "@/modules/email/domain/subjects";
import type {
  EmailTemplateType,
  OrderEmailView,
  QuoteEmailView,
  RenderedEmail,
  WelcomeEmailView,
} from "@/modules/email/domain/types";
import { emailShell } from "@/modules/email/templates/layout";
import { orderDetailsHtml, orderDetailsText } from "@/modules/email/templates/order-body";
import { quoteDetailsHtml, quoteDetailsText } from "@/modules/email/templates/quote-body";

const quoteTemplates = new Set<EmailTemplateType>([
  "QUOTE_RECEIVED",
  "QUOTE_NEEDS_INFO",
  "QUOTE_OFFERED",
  "QUOTE_ACCEPTED",
  "QUOTE_DECLINED",
  "QUOTE_EXPIRED",
]);

function localeCopy(locale: string) {
  return locale === "en-US"
    ? { viewOrder: "View my order", explore: "Explore DELIVERSO" }
    : { viewOrder: "Ver mi pedido", explore: "Explorar DELIVERSO" };
}

export function renderWelcomeEmail(
  view: WelcomeEmailView,
  publicUrl: string | undefined,
): RenderedEmail {
  const labels = localeCopy(view.locale);
  const title = getEmailHeadline("CUSTOMER_WELCOME", view.locale);
  const intro = getEmailIntro("CUSTOMER_WELCOME", view.locale);
  const href = exploreUrl(publicUrl, view.locale);
  return {
    subject: getEmailSubject("CUSTOMER_WELCOME", view.locale),
    html: emailShell({
      locale: view.locale,
      title,
      intro,
      bodyHtml: "",
      ctaLabel: labels.explore,
      ctaHref: href,
    }),
    text: [
      "DELIVERSO",
      view.locale === "en-US" ? "A delicious universe of flavors" : "Un delicioso universo de sabores",
      title,
      intro,
      `${labels.explore}: ${href}`,
      view.locale === "en-US"
        ? "This is a transactional email about your order."
        : "Este es un correo transaccional relacionado con tu pedido.",
    ].join("\n\n"),
  };
}

export function renderQuoteEmail(
  template: EmailTemplateType,
  view: QuoteEmailView,
  publicUrl: string | undefined,
): RenderedEmail {
  const title = getEmailHeadline(template, view.locale);
  const intro = getEmailIntro(template, view.locale);
  const href = quoteAccountUrl({
    publicUrl,
    locale: view.locale,
    quoteNumber: view.quoteNumber,
  });
  const cta = view.locale === "en-US" ? "View quote" : "Ver cotización";
  return {
    subject: getEmailSubject(template, view.locale),
    html: emailShell({
      locale: view.locale,
      eyebrow: view.quoteNumber,
      title,
      intro,
      bodyHtml: quoteDetailsHtml(view),
      ctaLabel: cta,
      ctaHref: href,
    }),
    text: [
      title,
      intro,
      quoteDetailsText(view),
      `${cta}: ${href}`,
    ].join("\n\n"),
  };
}

export function renderOrderEmail(
  template: Exclude<EmailTemplateType, "CUSTOMER_WELCOME">,
  view: OrderEmailView,
  publicUrl: string | undefined,
): RenderedEmail {
  const labels = localeCopy(view.locale);
  const title = getEmailHeadline(template, view.locale, view.fulfillmentMethod);
  const intro = getEmailIntro(template, view.locale, view.fulfillmentMethod);
  const href = orderAccountUrl({
    publicUrl,
    locale: view.locale,
    orderNumber: view.orderNumber,
  });
  const eyebrow = view.locale === "en-US" ? `Order #${view.orderNumber}` : `Pedido #${view.orderNumber}`;
  return {
    subject: getEmailSubject(template, view.locale, view),
    html: emailShell({
      locale: view.locale,
      eyebrow,
      title,
      intro,
      bodyHtml: orderDetailsHtml(view),
      ctaLabel: labels.viewOrder,
      ctaHref: href,
    }),
    text: [
      title,
      intro,
      orderDetailsText(view),
      `${labels.viewOrder}: ${href}`,
      view.locale === "en-US"
        ? "This is a transactional email about your order."
        : "Este es un correo transaccional relacionado con tu pedido.",
    ].join("\n\n"),
  };
}

export function renderTransactionalEmail(input: {
  template: EmailTemplateType;
  welcome?: WelcomeEmailView;
  order?: OrderEmailView;
  quote?: QuoteEmailView;
  publicUrl?: string;
}): RenderedEmail {
  if (input.template === "CUSTOMER_WELCOME") {
    return renderWelcomeEmail(input.welcome ?? { customerName: null, locale: "es-MX" }, input.publicUrl);
  }
  if (quoteTemplates.has(input.template)) {
    if (!input.quote) {
      throw new Error("QUOTE_EMAIL_VIEW_REQUIRED");
    }
    return renderQuoteEmail(input.template, input.quote, input.publicUrl);
  }
  if (!input.order) {
    throw new Error("ORDER_EMAIL_VIEW_REQUIRED");
  }
  return renderOrderEmail(input.template, input.order, input.publicUrl);
}
