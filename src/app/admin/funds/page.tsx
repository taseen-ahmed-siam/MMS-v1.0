import { Metadata } from "next";
import { getFunds } from "@/lib/queries/admin";
import { FundsClient } from "./funds-client";

export const metadata: Metadata = {
  title: "Funds",
};

export default async function FundsPage() {
  const funds = await getFunds();
  return <FundsClient funds={funds} />;
}
