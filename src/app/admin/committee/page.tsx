import { requirePermission } from "@/lib/access";
import { Metadata } from "next";
import { getCommittee } from "@/lib/queries/admin";
import { CommitteeClient } from "./committee-client";

export const metadata: Metadata = {
  title: "Committee",
};

export const dynamic = "force-dynamic";

export default async function CommitteePage() {
  await requirePermission("committee.view");

  const data = await getCommittee();

  return <CommitteeClient data={data} />;
}
