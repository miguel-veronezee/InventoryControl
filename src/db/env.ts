export function getDatabaseUrl(env: Record<string, string | undefined> = process.env): string {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não está definida. Copie .env.example para .env.local e ajuste o valor.",
    );
  }
  return url;
}
