// Un pedido básico: quién lo pidió y cuántas galletas
export type Pedido = { cliente: string; cantidad: number };

// Lo que devuelve cada algoritmo: cuántas galletas usa y cuáles pedidos aceptó
// (la "T" significa: sirve para cualquier pedido que tenga una cantidad)
type Resultado<T> = { usadas: number; elegidos: T[] };

// GREEDY: acepta primero los pedidos más grandes, si caben
export function greedy<T extends { cantidad: number }>(
  pedidos: T[],
  inventario: number
): Resultado<T> {
  const ordenados = [...pedidos].sort((a, b) => b.cantidad - a.cantidad); // de mayor a menor
  let restante = inventario;
  const elegidos: T[] = [];

  for (const pedido of ordenados) {
    if (pedido.cantidad <= restante) {
      restante = restante - pedido.cantidad; // lo acepto
      elegidos.push(pedido);                 // lo anoto en la lista
    }
  }
  return { usadas: inventario - restante, elegidos };
}

// PROGRAMACIÓN DINÁMICA: prueba aceptar y no aceptar cada pedido
// y se queda con la mejor opción
export function programacionDinamica<T extends { cantidad: number }>(
  pedidos: T[],
  inventario: number
): Resultado<T> {
  const libreta: Record<string, Resultado<T>> = {}; // aquí anota lo que ya calculó

  function mejor(i: number, restante: number): Resultado<T> {
    if (i === pedidos.length) return { usadas: 0, elegidos: [] }; // ya no hay más pedidos

    const clave = i + "-" + restante;
    if (libreta[clave]) return libreta[clave]; // ya lo calculé

    // Opción 1: NO acepto este pedido
    let resultado = mejor(i + 1, restante);

    // Opción 2: SÍ lo acepto (si cabe)
    const pedido = pedidos[i];
    if (pedido.cantidad <= restante) {
      const resto = mejor(i + 1, restante - pedido.cantidad);
      const usadas = pedido.cantidad + resto.usadas;
      if (usadas > resultado.usadas) {
        resultado = { usadas, elegidos: [pedido, ...resto.elegidos] };
      }
    }

    libreta[clave] = resultado; // lo anoto
    return resultado;
  }

  return mejor(0, inventario);
}