import { Metadata } from "next";
import { getUsers } from "@/lib/queries/admin";
import { UsersClient } from "./users-client";

export const metadata: Metadata = {
  title: "Users",
};

export default async function UsersPage() {
  const data = await getUsers();

  return <UsersClient data={data} />;
}
