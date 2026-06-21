import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo — identidade visual */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 flex-col justify-between bg-primary p-10 text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded bg-primary-foreground/20 text-[11px] font-bold">
            ng
          </div>
          <span className="text-sm font-bold">Nasci pra Deus</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold leading-snug">
            Transformando sua gestão ministerial.
          </h1>
          <p className="text-sm leading-relaxed text-primary-foreground/70">
            Um espaço dedicado para líderes gerenciarem, crescerem e nutrirem
            suas comunidades com propósito.
          </p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-10 bg-card">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center">
            <span className="text-xl font-bold">Nasci pra Deus</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">
              Acesse seu painel administrativo.
            </p>
          </div>

          <LoginForm redirectTo={params.redirect} />

          <p className="text-center text-xs text-muted-foreground">
            Precisa de ajuda?{" "}
            <a
              href="mailto:suporte@nascipradeus.com.br"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Fale conosco
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
