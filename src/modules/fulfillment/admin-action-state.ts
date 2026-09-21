export type PersistedScheduleWindow = {
  id: string;
  startTime: string;
  endTime: string;
  label: string | null;
};

export type FulfillmentAdminState = {
  error: string | null;
  success: string | null;
  code?: string | null;
  windows?: PersistedScheduleWindow[];
  revision?: string;
};

export const emptyFulfillmentAdminState: FulfillmentAdminState = {
  error: null,
  success: null,
  code: null,
};
