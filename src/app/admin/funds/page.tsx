import { requirePermission } from "@/lib/access";
import { Metadata } from "next";
import { getFunds } from "@/lib/queries/admin";
import { FundsClient } from "./funds-client";

export const metadata: Metadata = {
  title: "Funds",
};

export const dynamic = "force-dynamic";

export default async function FundsPage() {
  await requirePermission("fund.view");

  const funds = await getFunds();
  return <FundsClient funds={funds} />;
}
