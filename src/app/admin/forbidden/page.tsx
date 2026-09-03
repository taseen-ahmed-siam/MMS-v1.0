import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="rounded-full bg-destructive/10 p-6">
        <ShieldX className="h-12 w-12 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">403 Forbidden</h1>
        <p className="max-w-md text-muted-foreground">
          You do not have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>
      </div>
      <Button asChild>
        <Link href="/admin">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
