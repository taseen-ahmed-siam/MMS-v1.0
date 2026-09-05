import { Metadata } from "next";
import { getVisibleFunds, getMosqueSettings } from "@/lib/queries/public";
import { DonationForm } from "@/components/public/donation-form";
import { PageHeader } from "@/components/public/page-header";
import { PRESET_DONATION_AMOUNTS, CURRENCY_SYMBOL } from "@/constants";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support Al-Noor Mosque with your donation. Every contribution counts.",
};

export default async function DonatePage() {
  const funds = await getVisibleFunds();
  const settings = await getMosqueSettings();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Donate to Our Mosque"
        description="Your donation helps sustain prayer services, education, community programs, and ongoing projects."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-start">
        {/* Donation form */}
        <div className="bg-card rounded-3xl shadow-sm border p-8">
          <h2 className="text-2xl font-semibold mb-6">Make a Donation</h2>
          <DonationForm funds={funds} settings={settings} />
        </div>

        {/* Donation info */}
        <div className="space-y-6">
          {/* Payment methods */}
          <div className="bg-card rounded-3xl shadow-sm border p-8">
            <h3 className="font-semibold text-lg mb-4">Donation Methods</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Please use one of the following methods. After sending, fill the form and an admin will verify your payment.
            </p>
            <div className="space-y-4">
              {settings?.bkash_number && (
                <div>
                  <p className="font-medium text-emerald-700">bKash (Personal)</p>
                  <p className="text-muted-foreground">{settings.bkash_number}</p>
                </div>
              )}
              {settings?.nagad_number && (
                <div>
                  <p className="font-medium text-emerald-700">Nagad (Personal)</p>
                  <p className="text-muted-foreground">{settings.nagad_number}</p>
                </div>
              )}
              {settings?.rocket_number && (
                <div>
                  <p className="font-medium text-emerald-700">Rocket (Personal)</p>
                  <p className="text-muted-foreground">{settings.rocket_number}</p>
                </div>
              )}
              {settings?.bank_details && (
                <div>
                  <p className="font-medium text-emerald-700">Bank Transfer</p>
                  <p className="text-muted-foreground text-sm mt-1 whitespace-pre-line">
                    {settings.bank_details}
                  </p>
                </div>
              )}
              {!settings?.bkash_number && !settings?.nagad_number && !settings?.rocket_number && !settings?.bank_details && (
                <p className="text-xs text-muted-foreground">
                  Please contact the mosque office for the latest donation methods.
                </p>
              )}
            </div>
          </div>

          {/* Preset amounts */}
          <div className="bg-card rounded-3xl shadow-sm border p-8">
            <h3 className="font-semibold text-lg mb-4">Common Donation Amounts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_DONATION_AMOUNTS.map((amt) => (
                <div key={amt} className="bg-muted rounded-xl px-4 py-6 text-center">
                  <p className="text-2xl font-bold text-primary">{CURRENCY_SYMBOL}{amt.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {"The believer\u2019s shade on the Day of Resurrection will be his charity. \u2014 Tirmidhi"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
