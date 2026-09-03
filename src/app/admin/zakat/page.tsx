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

export default async function ZakatPage() {
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
