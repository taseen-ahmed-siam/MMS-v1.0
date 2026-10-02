import { requirePermission } from "@/lib/access";
import { Metadata } from "next";
import {
  getZakatCollections,
  getZakatBeneficiaries,
  getZakatDistributions,
} from "@/lib/queries/admin";
import { ZakatClient } from "./zakat-client";

export const metadata: Metadata = {
  title: "Zakat",
};

export const dynamic = "force-dynamic";

export default async function ZakatPage() {
  await requirePermission("zakat.view");

  const [collections, beneficiaries, distributions] = await Promise.all([
    getZakatCollections(),
    getZakatBeneficiaries(),
    getZakatDistributions(),
  ]);

  return (
    <ZakatClient
      collections={collections}
      beneficiaries={beneficiaries}
      distributions={distributions}
    />
  );
}
