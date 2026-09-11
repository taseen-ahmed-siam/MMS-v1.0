import { Metadata } from "next";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMoon,
  faClock,
  faHandHoldingHeart,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Ramadan",
};

export default function AdminRamadanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#064E3B]/10">
          <FontAwesomeIcon icon={faMoon} className="h-5 w-5 text-[#064E3B]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ramadan</h1>
          <p className="text-sm text-muted-foreground">
            Plan and manage Ramadan programs, iftar, suhoor, and special schedules.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border border-black/5 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#064E3B]/10">
            <FontAwesomeIcon icon={faMoon} className="h-8 w-8 text-[#064E3B]" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Ramadan module coming soon</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            The Ramadan module is not built yet. This will allow you to manage daily iftar and
            suhoor schedules, special nightly prayer (Taraweeh) timings, Ramadan programs, and
            donation campaigns during the holy month.
          </p>
          <Button asChild className="mt-6">
            <Link href="/admin/prayer-times">Configure Prayer Times</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: faClock,
            title: "Iftar & Suhoor",
            description: "Schedule daily iftar preparation and suhoor times.",
            accent: "from-emerald-500 to-teal-600",
          },
          {
            icon: faHandHoldingHeart,
            title: "Ramadan Campaigns",
            description: "Launch special donation drives and fundraisers.",
            accent: "from-amber-500 to-orange-600",
          },
          {
            icon: faUtensils,
            title: "Community Meals",
            description: "Organize iftar meals for the community and volunteers.",
            accent: "from-sky-500 to-blue-600",
          },
        ].map((f) => (
          <Card key={f.title} className="group relative overflow-hidden border-black/5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-50 blur-2xl group-hover:opacity-80 bg-gradient-to-br ${f.accent}`} />
            <CardHeader>
              <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${f.accent}`}>
                <FontAwesomeIcon icon={f.icon} className="h-4 w-4" />
              </div>
              <CardTitle className="relative mt-2 text-base">{f.title}</CardTitle>
              <CardDescription className="relative">{f.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
