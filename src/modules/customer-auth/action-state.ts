import type { CustomerStatus } from "@/modules/customer-auth/domain/status";

export type AuthenticatedCustomer = {
  id: string;
  authUserId: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  status: CustomerStatus;
};

export type CustomerActionState = {
  error: string | null;
  success: string | null;
};

export const emptyCustomerActionState: CustomerActionState = {
  error: null,
  success: null,
};

export const AUTH_REQUIRED_MESSAGE = "Inicia sesión para agregar al carrito.";
export const CUSTOMER_BLOCKED_MESSAGE = "Tu cuenta no puede continuar compras.";
