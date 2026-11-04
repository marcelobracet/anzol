import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireStudioUser } from "@/features/auth/require-studio-user";
import { deleteTemplateAction } from "@/features/templates/actions";
import { templateService } from "@/features/templates/server";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function TemplatesPage() {
  await requireStudioUser();
  const templates = await templateService().list();

  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Salve um quiz como template em Configurações do quiz. Para usar, escolha em “Novo quiz → Começar de”.
        </p>
      </div>
      <ul className="grid gap-2">
        {templates.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3">
            <div className="grid flex-1">
              <span className="font-medium">
                {t.name} {t.builtIn && <Badge variant="secondary" className="ml-1">Padrão</Badge>}
              </span>
              <span className="text-xs text-muted-foreground">
                {t.builtIn ? "Incluído no Anzol" : `${dateFormat.format(new Date(t.createdAt))} · ${t.createdBy}`}
              </span>
            </div>
            {!t.builtIn && (
              <form action={deleteTemplateAction.bind(null, t.id)}>
                <Button type="submit" variant="ghost" size="sm">Excluir</Button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
