import { PackageCheck, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 sm:px-8">
      <header className="flex items-center justify-between gap-4 border-b py-6">
        <span className="flex items-center gap-2 font-semibold">
          <PackageCheck aria-hidden className="size-5" />
          Controle de pedidos
        </span>
        <Badge variant="outline">Em desenvolvimento</Badge>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-10 py-16">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Controle de pedidos</h1>
          <p className="text-lg text-muted-foreground">
            Do momento da venda até o envio: veja o que precisa ser feito agora e o que está para
            atrasar.
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer aria-hidden className="size-5" />
              Estamos preparando o primeiro passo
            </CardTitle>
            <CardDescription>
              A fila de pedidos ainda não está disponível. As funcionalidades chegarão uma por vez.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
}
