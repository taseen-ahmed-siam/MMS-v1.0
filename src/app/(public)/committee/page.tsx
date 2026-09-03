import { Metadata } from "next";
import { Users, Mail, Phone } from "lucide-react";
import { getCurrentCommittee } from "@/lib/queries/public";
import { PageHeader } from "@/components/public/page-header";
import { SectionHeading } from "@/components/public/section-heading";

export const metadata: Metadata = {
  title: "Committee",
  description:
    "Meet the elected committee members who serve and guide Al-Noor Mosque community.",
};

export default async function CommitteePage() {
  const members = await getCurrentCommittee();

  return (
    <div>
      <PageHeader
        title="Our Committee"
        description="The dedicated team that leads and serves our community."
      />

      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {members.length > 0 ? (
            <>
              <SectionHeading
                eyebrow="Leadership"
                title="Current Committee"
              />
              <div className="mx-auto mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center hover:shadow-md transition-shadow"
                  >
                    {/* Avatar */}
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-10 w-10 text-primary" />
                    </div>

                    {/* Name & Designation */}
                    <h3 className="text-lg font-semibold text-foreground">
                      {m.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-[#C8A951]">
                      {m.designation}
                    </p>

                    {/* Period */}
                    {m.committee_period && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {m.committee_period}
                      </p>
                    )}

                    {/* Biography */}
                    {m.biography && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                        {m.biography}
                      </p>
                    )}

                    {/* Contact */}
                    <div className="mt-4 flex items-center justify-center gap-3">
                      {m.phone && (
                        <a
                          href={`tel:${m.phone}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          title={`Call ${m.name}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {m.email && (
                        <a
                          href={`mailto:${m.email}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          title={`Email ${m.name}`}
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-xl text-center">
              <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium text-foreground">
                  No committee members listed
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Committee information will be available soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
