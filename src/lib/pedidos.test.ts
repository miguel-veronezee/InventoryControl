import { expect, test } from "vitest";
import {
  gerarPedidos,
  ordenarPorUrgencia,
  proximaEtapa,
  textoPrazo,
  urgencia,
  type Pedido,
} from "./pedidos";

const agora = new Date(2026, 9, 28, 10, 0);
const pedido = (etapa: Pedido["etapa"], prazo: Date): Pedido => ({
  id: "#1",
  produto: "x",
  quantidade: 1,
  comprador: "y",
  vendidoEm: agora.toISOString(),
  prazoEnvio: prazo.toISOString(),
  etapa,
});

test("urgência segue prazo e etapa", () => {
  expect(urgencia(pedido("novo", new Date(2026, 9, 27, 23, 59)), agora)).toBe("atrasado");
  expect(urgencia(pedido("novo", new Date(2026, 9, 28, 23, 59)), agora)).toBe("hoje");
  expect(urgencia(pedido("separado", new Date(2026, 9, 29, 23, 59)), agora)).toBe("normal");
  expect(urgencia(pedido("enviado", new Date(2026, 9, 27, 23, 59)), agora)).toBe("enviado");
});

test("ordena atrasados, depois hoje, depois o resto, enviados no fim", () => {
  const lista = [
    pedido("enviado", new Date(2026, 9, 27)),
    pedido("novo", new Date(2026, 9, 30, 23, 59)),
    pedido("novo", new Date(2026, 9, 28, 23, 59)),
    pedido("embalado", new Date(2026, 9, 26, 23, 59)),
  ];
  expect(ordenarPorUrgencia(lista, agora).map((p) => urgencia(p, agora))).toEqual([
    "atrasado",
    "hoje",
    "normal",
    "enviado",
  ]);
});

test("próxima etapa para em enviado", () => {
  expect(proximaEtapa("novo")).toBe("separado");
  expect(proximaEtapa("embalado")).toBe("enviado");
  expect(proximaEtapa("enviado")).toBe("enviado");
});

test("texto do prazo", () => {
  expect(textoPrazo(pedido("novo", new Date(2026, 9, 26, 23, 59)), agora)).toBe("atrasado 2 dias");
  expect(textoPrazo(pedido("novo", new Date(2026, 9, 29, 23, 59)), agora)).toBe("amanhã");
});

test("geração é determinística e tem de tudo um pouco", () => {
  const a = gerarPedidos(300, agora);
  expect(a).toEqual(gerarPedidos(300, agora));
  const contagem = new Set(a.map((p) => urgencia(p, agora)));
  expect([...contagem].sort()).toEqual(["atrasado", "enviado", "hoje", "normal"]);
});
