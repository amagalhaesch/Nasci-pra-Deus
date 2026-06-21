import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LogoutButton from "@/components/logout-button";

export default function SemMinisterioPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Sem ministério atribuído</CardTitle>
          <CardDescription>
            Sua conta ainda não foi vinculada a nenhum ministério. Peça ao master da
            plataforma para te atribuir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
