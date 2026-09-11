import { getMosqueSettings } from "@/lib/queries/public";
import { getCurrentUser } from "@/lib/auth/session";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getMosqueSettings();
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar settings={settings} isLoggedIn={!!user} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
