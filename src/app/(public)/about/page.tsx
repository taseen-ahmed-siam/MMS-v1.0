import { Metadata } from "next";
import Link from "next/link";
import { Landmark, BookOpen, Users, Heart } from "lucide-react";
import { getMosqueSettings, getCurrentCommittee } from "@/lib/queries/public";
import { PageHeader } from "@/components/public/page-header";
import { SectionHeading } from "@/components/public/section-heading";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Al-Noor Mosque — our history, mission, facilities, and the services we offer to the community.",
};

export default async function AboutPage() {
  const settings = await getMosqueSettings();
  const committee = await getCurrentCommittee().then((m) => m.slice(0, 4));

  return (
    <div>
      <PageHeader
        title="About Our Mosque"
        description="আল্লাহর ঘর — শান্তি, জ্ঞান এবং সম্প্রদায়ের স্থান।"
      />

      {/* OUR HISTORY */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our Story"
            title="Our History"
          />
          <div className="mx-auto max-w-3xl mt-8 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Al-Noor Mosque was established with the vision of creating a spiritual
              haven where Muslims can gather for prayer, seek knowledge, and strengthen
              the bonds of brotherhood and sisterhood in the community.
            </p>
            <p>
              Since its founding, the mosque has served as a beacon of light — hosting
              daily prayers, weekly Jumu&apos;ah gatherings, Ramadan programs, and a wide
              range of educational and social events for people of all ages.
            </p>
            <p>
              {settings?.mosque_name || "Al-Noor Mosque"} continues to grow as a
              center for faith, education, and charitable work — guided by the Quran
              and Sunnah, and supported by the generous contributions of our community
              members.
            </p>
          </div>
        </div>
      </section>

      {/* OUR MISSION */}
      <section className="py-16 bg-card islamic-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Purpose"
            title="Our Mission"
          />
          <div className="mx-auto max-w-3xl mt-8">
            <div className="bg-background rounded-2xl p-8 shadow-sm border text-center">
              <p className="text-lg text-foreground leading-relaxed italic">
                &ldquo;To serve as a house of Allah that nurtures faith through prayer,
                spreads knowledge through education, and builds a compassionate
                community through service and charity.&rdquo;
              </p>
              <div className="ornamental-separator my-6">
                <span className="text-lg">&#9776;</span>
              </div>
              <p className="text-sm text-muted-foreground">
                We are committed to providing a welcoming space for all Muslims, regardless
                of background, and to being a positive force in the wider society.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FACILITIES */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our Space"
            title="Facilities"
          />
          <div className="mx-auto max-w-4xl mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Landmark,
                title: "Prayer Hall",
                desc: "A spacious main hall with separate sections for men and women, accommodating hundreds of worshippers.",
              },
              {
                icon: BookOpen,
                title: "Islamic Library",
                desc: "A collection of Quran, Hadith, Fiqh, and other Islamic texts for study and research.",
              },
              {
                icon: Users,
                title: "Community Hall",
                desc: "A multipurpose hall for lectures, workshops, community gatherings, and educational programs.",
              },
              {
                icon: Landmark,
                title: "Wudu Area",
                desc: "Clean and well-maintained ablution facilities for men and women.",
              },
              {
                icon: BookOpen,
                title: "Children's Section",
                desc: "A dedicated area for children's Quran classes and Islamic education programs.",
              },
              {
                icon: Heart,
                title: "Charity Center",
                desc: "A hub for zakat collection, sadaqah distribution, and community welfare programs.",
              },
            ].map((facility) => (
              <div
                key={facility.title}
                className="bg-card rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <facility.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {facility.title}
                </h3>
                <p className="text-sm text-muted-foreground">{facility.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-16 bg-card islamic-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What We Offer"
            title="Services"
          />
          <div className="mx-auto max-w-4xl mt-8 grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Landmark,
                title: "Daily Prayers",
                desc: "Five daily prayers with adhan and jamaat. All are welcome to pray in congregation.",
              },
              {
                icon: BookOpen,
                title: "Islamic Education",
                desc: "Quran classes for children and adults, Hadith circles, Tafsir sessions, and Islamic workshops.",
              },
              {
                icon: Users,
                title: "Community Events",
                desc: "Regular programs including Ramadan activities, Eid celebrations, youth seminars, and family gatherings.",
              },
              {
                icon: Heart,
                title: "Charity & Welfare",
                desc: "Zakat collection and distribution, sadaqah management, and support for those in need.",
              },
            ].map((service) => (
              <div
                key={service.title}
                className="flex items-start gap-4 bg-background rounded-2xl p-6 shadow-sm border"
              >
                <div className="h-10 w-10 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <service.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMITTEE PREVIEW */}
      {committee.length > 0 && (
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Leadership"
              title="Our Committee"
              description="The elected members who serve and guide our community."
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {committee.map((m) => (
                <div
                  key={m.id}
                  className="bg-card rounded-2xl p-6 text-center shadow-sm border"
                >
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{m.name}</h3>
                  <p className="text-sm text-accent font-medium mt-1">
                    {m.designation}
                  </p>
                  {m.committee_period && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {m.committee_period}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/committee"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-full hover:bg-primary-dark transition-colors"
              >
                <Users className="h-4 w-4" />
                View Full Committee
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
