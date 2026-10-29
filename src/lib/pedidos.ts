export const ETAPAS = ["novo", "separado", "embalado", "enviado"] as const;
export type Etapa = (typeof ETAPAS)[number];

export const NOME_ETAPA: Record<Etapa, string> = {
  novo: "Novo",
  separado: "Separado",
  embalado: "Embalado",
  enviado: "Enviado",
};

export type Pedido = {
  id: string;
  produto: string;
  quantidade: number;
  comprador: string;
  vendidoEm: string; // ISO
  prazoEnvio: string; // ISO
  etapa: Etapa;
};

export type Urgencia = "atrasado" | "hoje" | "normal" | "enviado";

const PRODUTOS = [
  "Fone Bluetooth TWS",
  "Capinha iPhone 15",
  "Smartwatch D20",
  "Ring light 26cm",
  "Mini drone dobrável",
  "Teclado mecânico RGB",
  "Mouse gamer sem fio",
  "Carregador turbo 20W",
  "Cabo USB-C 2m",
  "Luminária LED de mesa",
  "Caixa de som portátil",
  "Suporte de celular veicular",
  "Película 3D",
  "Power bank 10000mAh",
  "Webcam Full HD",
  "Hub USB 4 portas",
];
const NOMES = [
  "Ana S.",
  "Bruno L.",
  "Carla M.",
  "Diego R.",
  "Elisa F.",
  "Felipe A.",
  "Gabriela P.",
  "Henrique T.",
  "Isabela C.",
  "João V.",
  "Karen B.",
  "Lucas N.",
  "Mariana O.",
  "Rafael D.",
];

// PRNG com semente: a demo gera sempre os mesmos pedidos.
function aleatorio(semente: number) {
  return () => {
    semente = (semente + 0x6d2b79f5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fimDoDia(base: Date, diasAFrente: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + diasAFrente);
  d.setHours(23, 59, 0, 0);
  return d;
}

export function gerarPedidos(
  quantidade: number,
  agora: Date,
  primeiroNumero = 2100,
  semente = 42,
): Pedido[] {
  const rand = aleatorio(semente);
  const escolher = <T>(lista: readonly T[]) => lista[Math.floor(rand() * lista.length)];
  return Array.from({ length: quantidade }, (_, i) => {
    const r = rand();
    // Mistura parecida com um dia real: poucos atrasados, ~15% vencendo hoje, ~28% já enviados.
    const etapa: Etapa =
      r < 0.28 ? "enviado" : r < 0.65 ? "novo" : r < 0.85 ? "separado" : "embalado";
    const p = rand();
    const dias =
      etapa === "enviado" ? -Math.floor(rand() * 2) : p < 0.01 ? -1 : p < 0.2 ? 0 : p < 0.7 ? 1 : 2;
    const prazo = fimDoDia(agora, dias);
    const vendidoEm = new Date(prazo.getTime() - (2 * 24 + Math.floor(rand() * 20)) * 3600_000);
    return {
      id: `#${primeiroNumero + i}${"ABCDEF"[Math.floor(rand() * 6)]}`,
      produto: escolher(PRODUTOS),
      quantidade: rand() < 0.8 ? 1 : 2 + Math.floor(rand() * 3),
      comprador: escolher(NOMES),
      vendidoEm: vendidoEm.toISOString(),
      prazoEnvio: prazo.toISOString(),
      etapa,
    };
  });
}

function mesmoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function urgencia(pedido: Pedido, agora: Date): Urgencia {
  if (pedido.etapa === "enviado") return "enviado";
  const prazo = new Date(pedido.prazoEnvio);
  if (prazo < agora) return "atrasado";
  if (mesmoDia(prazo, agora)) return "hoje";
  return "normal";
}

const ORDEM_URGENCIA: Record<Urgencia, number> = { atrasado: 0, hoje: 1, normal: 2, enviado: 3 };

export function ordenarPorUrgencia(pedidos: Pedido[], agora: Date): Pedido[] {
  return [...pedidos].sort(
    (a, b) =>
      ORDEM_URGENCIA[urgencia(a, agora)] - ORDEM_URGENCIA[urgencia(b, agora)] ||
      a.prazoEnvio.localeCompare(b.prazoEnvio),
  );
}

export function proximaEtapa(etapa: Etapa): Etapa {
  return ETAPAS[Math.min(ETAPAS.indexOf(etapa) + 1, ETAPAS.length - 1)];
}

export function textoPrazo(pedido: Pedido, agora: Date): string {
  const u = urgencia(pedido, agora);
  if (u === "enviado") return "—";
  if (u === "hoje") return "hoje";
  const prazo = new Date(pedido.prazoEnvio);
  const dias = Math.round(
    (fimDoDia(prazo, 0).getTime() - fimDoDia(agora, 0).getTime()) / 86_400_000,
  );
  if (u === "atrasado")
    return dias === 0 ? "atrasado" : `atrasado ${-dias} dia${dias === -1 ? "" : "s"}`;
  if (dias === 1) return "amanhã";
  return prazo.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
