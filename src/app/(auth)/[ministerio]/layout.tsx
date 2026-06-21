import { requireMinisterio } from "@/lib/auth";
import MinisterioSidebar from "@/components/ministerio-sidebar";

export default async function MinisterioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ ministerio: string }>;
}) {
  const { ministerio: slug } = await params;
  const { session, ministerio } = await requireMinisterio(slug);

  return (
    <div className="flex h-screen overflow-hidden">
      <MinisterioSidebar
        ministerio={ministerio}
        profile={session.profile}
        isMaster={session.isMaster}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
