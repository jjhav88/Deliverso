import { CommunicationsPanel } from "@/modules/admin/components/communications-panel";
import { ExchangeRatesPanel } from "@/modules/admin/components/exchange-rates-panel";
import { FulfillmentSettings } from "@/modules/admin/components/fulfillment-settings";
import { SettingsForm } from "@/modules/admin/components/settings-form";
import { getEmailAdminState } from "@/modules/email/admin-queries";
import { getFulfillmentAdminState } from "@/modules/fulfillment/admin-queries";
import { getExchangeRateAdminStatus } from "@/modules/settings/exchange-rate-status";
import { getSettingsAdminState } from "@/modules/settings/queries";

export default async function AdminSettingsPage() {
  const [initial, fx, fulfillment, email] = await Promise.all([
    getSettingsAdminState(),
    getExchangeRateAdminStatus(),
    getFulfillmentAdminState(),
    getEmailAdminState(),
  ]);
  return (
    <>
      <SettingsForm initial={initial} />
      <CommunicationsPanel state={email} />
      <FulfillmentSettings
        configured={fulfillment.configured}
        zones={fulfillment.zones}
        pickups={fulfillment.pickups}
        schedules={fulfillment.schedules}
        blackouts={fulfillment.blackouts}
      />
      <ExchangeRatesPanel status={fx} />
    </>
  );
}
