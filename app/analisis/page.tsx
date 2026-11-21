"use client";

import { useState } from "react";
import Link from "next/link";
import { greedy, programacionDinamica, type Pedido } from "@/lib/algoritmos";

// Los 5 tamaños de prueba (cantidad de pedidos)
const TAMANOS = [10, 50, 100, 200, 400];

// Una fila de la tabla de resultados
type Fila = {
  n: number;
  inventario: number;
  msGreedy: number;
  msDinamica: number;
  usoGreedy: number;
  usoDinamica: number;
};

// Crea n pedidos con cantidades al azar entre 1 y 30
function crearPedidos(n: number): Pedido[] {
  return Array.from({ length: n }, (_, i) => ({
    cliente: "Cliente " + (i + 1),
    cantidad: 1 + Math.floor(Math.random() * 30),
  }));
}

export default function Analisis() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [casos, setCasos] = useState<{ total: number; greedyPierde: number } | null>(null);
  const [calculando, setCalculando] = useState(false);

  function correr() {
    setCalculando(true);
    // setTimeout deja que la pantalla muestre "Calculando..." antes de empezar
    setTimeout(() => {
      const nuevas: Fila[] = [];

      for (const n of TAMANOS) {
        const pedidos = crearPedidos(n);
        const total = pedidos.reduce((suma, p) => suma + p.cantidad, 0);
        const inventario = Math.floor(total / 2); // hay la mitad de lo que piden

        // Medimos cuánto tarda cada algoritmo
        const t1 = performance.now();
        const g = greedy(pedidos, inventario);
        const t2 = performance.now();
        const d = programacionDinamica(pedidos, inventario);
        const t3 = performance.now();

        nuevas.push({
          n,
          inventario,
          msGreedy: t2 - t1,
          msDinamica: t3 - t2,
          usoGreedy: (g.usadas / inventario) * 100,
          usoDinamica: (d.usadas / inventario) * 100,
        });
      }
      setFilas(nuevas);

      // 1000 casos pequeños: ¿cuántas veces Greedy NO encuentra lo mejor?
      let greedyPierde = 0;
      for (let i = 0; i < 1000; i++) {
        const pedidos = crearPedidos(2 + Math.floor(Math.random() * 7)); // 2 a 8 pedidos
        const inventario = 10 + Math.floor(Math.random() * 31); // 10 a 40 galletas
        const g = greedy(pedidos, inventario);
        const d = programacionDinamica(pedidos, inventario);
        if (g.usadas < d.usadas) greedyPierde++;
      }
      setCasos({ total: 1000, greedyPierde });
      setCalculando(false);
    }, 50);
  }

  // El tiempo más largo, para dibujar las barras en proporción
  const maxMs = Math.max(...filas.map((f) => f.msDinamica), 1);

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <Link href="/" className="text-sm underline text-gray-500">
        ← Volver a la app
      </Link>
      <h1 className="text-3xl font-bold mt-2 mb-2">Modo análisis</h1>
      <p className="mb-4 text-gray-500">
        Compara Greedy y Programación Dinámica con 5 tamaños de entrada.
        Esta pantalla es solo para la sustentación.
      </p>

      <button
        className="bg-amber-600 text-white rounded px-4 py-3 w-full mb-6 disabled:bg-gray-300"
        onClick={correr}
        disabled={calculando}
      >
        {calculando ? "Calculando..." : "Correr la prueba"}
      </button>

      {filas.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-2">Resultados</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-1 pr-3">Pedidos</th>
                  <th className="py-1 pr-3">Inventario</th>
                  <th className="py-1 pr-3">Greedy</th>
                  <th className="py-1 pr-3">P. Dinámica</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.n} className="border-b">
                    <td className="py-1 pr-3">{f.n}</td>
                    <td className="py-1 pr-3">{f.inventario}</td>
                    <td className="py-1 pr-3">
                      {f.msGreedy.toFixed(2)} ms · usa {f.usoGreedy.toFixed(1)}%
                    </td>
                    <td className="py-1 pr-3">
                      {f.msDinamica.toFixed(1)} ms · usa {f.usoDinamica.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-semibold mb-2">Gráfica: tiempo según el número de pedidos</h2>
          {filas.map((f) => (
            <div key={f.n} className="mb-3">
              <p className="text-sm font-semibold">{f.n} pedidos</p>
              <div className="flex items-center gap-2">
                <div
                  className="bg-gray-400 h-4"
                  style={{ width: Math.max((f.msGreedy / maxMs) * 100, 0.5) + "%" }}
                />
                <span className="text-xs">Greedy {f.msGreedy.toFixed(2)} ms</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="bg-amber-600 h-4"
                  style={{ width: Math.max((f.msDinamica / maxMs) * 100, 0.5) + "%" }}
                />
                <span className="text-xs">P. Dinámica {f.msDinamica.toFixed(1)} ms</span>
              </div>
            </div>
          ))}
        </>
      )}

      {casos && (
        <p className="my-6 p-3 border rounded">
          En {casos.total} casos pequeños al azar, Greedy no encontró la mejor
          solución en <b>{casos.greedyPierde}</b> (
          {((casos.greedyPierde / casos.total) * 100).toFixed(1)}%). La Programación
          Dinámica siempre la encontró.
        </p>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">Complejidad (Big O)</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <b>Greedy:</b> O(n log n), por ordenar los pedidos. Casi no tarda,
          aunque haya muchos pedidos.
        </li>
        <li>
          <b>Programación Dinámica:</b> O(n · C), con n pedidos y C galletas de
          inventario. Tarda más cuando crecen los pedidos y el inventario, y
          además gasta más memoria.
        </li>
      </ul>
    </main>
  );
}ssssss