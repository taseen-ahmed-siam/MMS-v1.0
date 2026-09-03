import { Metadata } from "next";
import { getCommittee } from "@/lib/queries/admin";
import { CommitteeClient } from "./committee-client";

export const metadata: Metadata = {
  title: "Committee",
};

export default async function CommitteePage() {
  const data = await getCommittee();

  return <CommitteeClient data={data} />;
}
