import { Metadata } from "next";
import Link from "next/link";
import { Moon, CalendarClock, HeartHandshake, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Ramadan",
};

export default function AdminRamadanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Moon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ramadan</h1>
          <p className="text-sm text-muted-foreground">
            Plan and manage Ramadan programs, iftar, suhoor, and special schedules.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Moon className="h-8 w-8 text-primary" />
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
            icon: CalendarClock,
            title: "Iftar & Suhoor",
            description: "Schedule daily iftar preparation and suhoor times.",
          },
          {
            icon: HeartHandshake,
            title: "Ramadan Campaigns",
            description: "Launch special donation drives and fundraisers.",
          },
          {
            icon: UtensilsCrossed,
            title: "Community Meals",
            description: "Organize iftar meals for the community and volunteers.",
          },
        ].map((f) => (
          <Card key={f.title} className="rounded-2xl border shadow-sm">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
