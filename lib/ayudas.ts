// ---------- Los tipos de datos de la app ----------

// Una bolsa del proveedor
export type Bolsa = { cantidad: number; vence: string };

// Un pedido de un cliente
export type PedidoGalleta = {
  cliente: string;
  telefono: string;
  cantidad: number;
  entrega: string; // fecha de entrega AAAA-MM-DD
};

// De qué bolsa salieron galletas (sirve para poder deshacer)
export type Parte = { vence: string; cantidad: number };

// Un pedido aceptado: guarda el precio y el costo de ese momento
export type Aceptado = PedidoGalleta & {
  precio: number;
  costo: number;
  fecha: string; // el día en que se aceptó
  partes: Parte[];
};

// Galletas que se vencieron, con lo que costaron
export type Perdida = { cantidad: number; vence: string; costo: number };

// ---------- Fechas (todas como texto AAAA-MM-DD) ----------

// Convierte una fecha a texto AAAA-MM-DD (se escribe así para poder comparar con < y >)
// Usamos la hora local para que en Colombia no se corra de día
function fechaATexto(d: Date) {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function fechaDeHoy() {
  return fechaATexto(new Date());
}

// Suma (o resta) días a una fecha
export function sumarDias(fecha: string, dias: number) {
  const d = new Date(fecha + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return fechaATexto(d);
}

// Cuántos días faltan para una fecha (0 = hoy, 1 = mañana, -1 = ayer)
export function diasHasta(fecha: string, hoy: string) {
  const a = new Date(hoy + "T00:00:00");
  const b = new Date(fecha + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// "2026-11-21" -> "21 nov"
export function fechaCorta(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });
}

// ---------- Dinero y mensajes ----------

// Escribe un número como pesos: 30000 -> $30.000
export function pesos(n: number) {
  return (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("es-CO");
}

// Link que abre WhatsApp con el mensaje ya escrito
export function enlaceWhatsApp(telefono: string, mensaje: string) {
  let numero = telefono.replace(/\D/g, ""); // deja solo los números
  if (numero.length === 10) numero = "57" + numero; // código de Colombia
  const base = numero ? `https://wa.me/${numero}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(mensaje)}`;
}

// ---------- Inventario ----------

// Saca galletas, empezando por las bolsas que vencen primero.
// Solo usa bolsas que todavía sirven ese día (vence >= desde).
export function descontar(bolsas: Bolsa[], cuantas: number, desde: string) {
  const ordenadas = [...bolsas].sort((a, b) => (a.vence < b.vence ? -1 : 1));
  let falta = cuantas;
  const partes: Parte[] = [];
  const resultado = ordenadas.map((b) => {
    if (b.vence < desde || falta === 0) return b; // no se toca
    const toma = Math.min(b.cantidad, falta);
    falta = falta - toma;
    partes.push({ vence: b.vence, cantidad: toma });
    return { ...b, cantidad: b.cantidad - toma };
  });
  return { bolsas: resultado.filter((b) => b.cantidad > 0), partes };
}

// Devuelve galletas a sus bolsas (para "Deshacer")
export function devolver(bolsas: Bolsa[], partes: Parte[]) {
  const resultado = [...bolsas];
  for (const p of partes) {
    const i = resultado.findIndex((b) => b.vence === p.vence);
    if (i >= 0) {
      resultado[i] = { ...resultado[i], cantidad: resultado[i].cantidad + p.cantidad };
    } else {
      resultado.push({ cantidad: p.cantidad, vence: p.vence });
    }
  }
  return resultado;
}