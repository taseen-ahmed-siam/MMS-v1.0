"use client";

import { useRouter } from "next/navigation";
import { PaginationBar } from "@/components/admin/pagination-bar";

export function MyDonationsPagination({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total: number;
}) {
  const router = useRouter();
  return (
    <PaginationBar
      page={page}
      totalPages={totalPages}
      total={total}
      onPageChange={(p) => router.push(`/admin/my-donations?page=${p}`)}
    />
  );
}