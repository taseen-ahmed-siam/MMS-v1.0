import { Metadata } from "next";
import { getMosqueSettings } from "@/lib/queries/public";
import { ContactForm } from "@/components/public/contact-form";
import { PageHeader } from "@/components/public/page-header";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Al-Noor Mosque. Send us your inquiries, suggestions, or volunteer requests.",
};

export default async function ContactPage() {
  const settings = await getMosqueSettings();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        showBismillah
        title="Contact Us"
        description={"We'd love to hear from you. Send us your questions, suggestions, or requests."}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-start">
        {/* Contact info */}
        <div className="space-y-6">
          <div className="bg-card rounded-3xl shadow-sm border p-8">
            <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">{settings?.address || "123 Main Street, Dhaka, Bangladesh"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">{settings?.phone || "+880 1712 345 678"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">{settings?.email || "info@alnoormosque.org"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div>
                  <p className="font-medium">Office Hours</p>
                  <p className="text-muted-foreground">After Asr to Isha (daily)</p>
                </div>
              </div>
            </div>
          </div>

          {settings?.google_maps_url && (
            <div className="bg-card rounded-3xl overflow-hidden shadow-sm border h-72">
              <iframe
                src={settings.google_maps_url}
                title="Mosque Location"
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* Contact form */}
        <div className="bg-card rounded-3xl shadow-sm border p-8">
          <h2 className="text-2xl font-semibold mb-6">Send a Message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
