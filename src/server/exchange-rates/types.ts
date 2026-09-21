import type { CurrencyCode } from "@/config/currency";

export type ExchangeRateRequest = {
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
};

/**
 * Cotización obtenida de un proveedor externo.
 * `rate` se representa como string decimal para no usar un flotante
 * como fuente de verdad del tipo de cambio.
 */
export type ExchangeRateQuote = {
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
  rate: string;
  fetchedAt: Date;
  provider: string;
};

/**
 * Contrato de infraestructura. El dominio no debe importar un SDK
 * concreto. Las implementaciones vivirán detrás de este puerto.
 */
export interface ExchangeRateProvider {
  getQuote(request: ExchangeRateRequest): Promise<ExchangeRateQuote>;
}
