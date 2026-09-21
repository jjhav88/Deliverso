const cream = "#FFF6E9";
const navy = "#234166";
const purple = "#44294E";
const gold = "#DDA333";
const card = "#FFFDF8";
const border = "#E8D7B6";

export const emailColors = { cream, navy, purple, gold, card, border };

export function emailShell(input: {
  locale: string;
  eyebrow?: string;
  title: string;
  intro: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaHref: string;
}): string {
  const lang = input.locale === "en-US" ? "en" : "es";
  const tagline =
    input.locale === "en-US"
      ? "A delicious universe of flavors"
      : "Un delicioso universo de sabores";
  const transactional =
    input.locale === "en-US"
      ? "This is a transactional email about your order."
      : "Este es un correo transaccional relacionado con tu pedido.";
  const signInNote =
    input.locale === "en-US"
      ? "This link does not sign you in. Please log in to view your order."
      : "Este enlace no inicia sesión. Entra a tu cuenta para ver el pedido.";

  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:${cream};color:${navy};font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${cream}" style="background:${cream};padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="${card}" style="max-width:600px;width:100%;background:${card};border:1px solid ${border};">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <div style="font-size:13px;letter-spacing:0.22em;color:${purple};">DELIVERSO</div>
                <div style="margin-top:8px;font-size:13px;line-height:1.5;color:${gold};">${escapeHtml(tagline)}</div>
              </td>
            </tr>
            ${
              input.eyebrow
                ? `<tr><td style="padding:20px 32px 0 32px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${gold};">${escapeHtml(input.eyebrow)}</td></tr>`
                : ""
            }
            <tr>
              <td style="padding:${input.eyebrow ? "8px" : "24px"} 32px 10px 32px;">
                <h1 style="margin:0;font-size:26px;line-height:1.3;font-weight:normal;color:${navy};">${escapeHtml(input.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;font-size:16px;line-height:1.65;color:${navy};">
                <p style="margin:0;">${escapeHtml(input.intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;font-size:15px;line-height:1.6;color:${navy};">
                ${input.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;">
                <a href="${escapeHtml(input.ctaHref)}" style="display:inline-block;background:${navy};color:${cream};text-decoration:none;padding:13px 22px;border-radius:8px;font-size:15px;">
                  ${escapeHtml(input.ctaLabel)}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;border-top:1px solid ${border};">
                <div style="padding-top:20px;font-size:12px;letter-spacing:0.18em;color:${purple};">DELIVERSO</div>
                <div style="margin-top:6px;font-size:12px;line-height:1.5;color:${gold};">${escapeHtml(tagline)}</div>
                <p style="margin:12px 0 0 0;font-size:12px;line-height:1.55;color:${navy};">${escapeHtml(transactional)}</p>
                <p style="margin:8px 0 0 0;font-size:12px;line-height:1.55;color:${navy};">${escapeHtml(signInNote)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function moneyMxn(amountMinor: number): string {
  return `$${(amountMinor / 100).toFixed(2)}`;
}
