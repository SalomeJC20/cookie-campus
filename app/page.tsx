// "use client" = esta página corre en el celular de la persona (no en el servidor).
// Lo necesitamos porque usamos useState/useEffect y guardamos datos en el celular.
"use client";

// useState = "cajita" que recuerda un dato; useEffect = código que corre en un momento específico
import { useEffect, useState } from "react";
// El "motor" que decide qué pedidos aceptar (está en lib/algoritmos.ts)
import { programacionDinamica } from "@/lib/algoritmos";
// Tipos de datos y funciones de ayuda (están en lib/ayudas.ts)
import {
  type Bolsa,
  type PedidoGalleta,
  type Aceptado,
  type Perdida,
  fechaDeHoy,
  sumarDias,
  diasHasta,
  fechaCorta,
  pesos,
  enlaceWhatsApp,
  descontar,
  devolver,
} from "@/lib/ayudas";

// ---------- Estilos que se repiten (así no los escribimos muchas veces) ----------
// Colores de Cookie Campus: terracota #C8694F, crema #FBF4E8, salvia #7E9F76, café #4A3125
const tarjeta = "bg-white rounded-3xl shadow-sm border border-[#F0E3CC] p-4 mb-4";
const campo =
  "border border-[#E6D5B8] rounded-2xl p-3 text-base w-full bg-[#FFFCF7] text-[#4A3125] placeholder:text-[#B8A38A]";
const boton =
  "bg-[#C8694F] text-white font-bold rounded-2xl px-4 py-3 w-full active:bg-[#A9533C] disabled:bg-[#E6D5B8] disabled:text-[#9C876F]";
const botonVerde =
  "bg-[#7E9F76] text-white font-bold rounded-xl px-3 py-2 text-sm active:bg-[#678660]";
const titulo = "text-lg font-extrabold text-[#4A3125] mb-3";
const linkChico = "text-sm font-semibold underline";

// ---------- Iconos de la barra de abajo (dibujos simples) ----------
function Icono({ nombre }: { nombre: string }) {
  const rutas: Record<string, string> = {
    inicio: "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9z",
    pedidos: "M9 5h6M9 3h6a1 1 0 011 1v1h2a1 1 0 011 1v14a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1h2V4a1 1 0 011-1zm-1 9h8m-8 4h5",
    inventario: "M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5m0 0l9-5m-9 5v8",
    mas: "M5 12h.01M12 12h.01M19 12h.01",
  };
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={rutas[nombre]} />
    </svg>
  );
}

// Las 4 pestañas de la app
const pestanas = [
  { id: "inicio", texto: "Inicio" },
  { id: "pedidos", texto: "Pedidos" },
  { id: "inventario", texto: "Inventario" },
  { id: "mas", texto: "Más" },
];

export default function Home() {
  // Lo que la app recuerda (cada useState es una "cajita")
  const [pestana, setPestana] = useState("inicio"); // en cuál pestaña estamos
  const [hoy, setHoy] = useState("");
  // Los campos de texto se guardan como texto ("") y se convierten a número al usarlos
  const [precio, setPrecio] = useState(""); // a cómo vendes cada galleta
  const [costo, setCosto] = useState(""); // a cómo te la vende la proveedora
  // Las bolsas: cuántas galletas trae cada una y cuándo vence
  const [bolsas, setBolsas] = useState<Bolsa[]>([]);
  // Lo que se escribe en el formulario de "Agregar bolsa"
  const [cantidadBolsa, setCantidadBolsa] = useState("");
  const [venceBolsa, setVenceBolsa] = useState("");
  // Los pedidos que todavía no se aceptan
  const [pedidos, setPedidos] = useState<PedidoGalleta[]>([]);
  // Lo que se escribe en el formulario de "Agregar pedido"
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [entrega, setEntrega] = useState("");
  // Pedidos ya aceptados (guardan el precio y costo de ese momento)
  const [aceptados, setAceptados] = useState<Aceptado[]>([]);
  // Galletas que se vencieron sin venderse
  const [perdidas, setPerdidas] = useState<Perdida[]>([]);
  const [dia, setDia] = useState(""); // para qué día armamos la sugerencia
  const [cargado, setCargado] = useState(false); // ¿ya recuperamos lo guardado?

  // Al abrir la página (el [] del final significa "solo una vez"):
  // 1) averigua qué día es hoy  2) recupera lo que se guardó en el celular.
  // La fecha se pide aquí y no arriba porque Next no deja pedirla mientras arma la página.
  useEffect(() => {
    const h = fechaDeHoy();
    setHoy(h);
    setDia(h);
    try {
      // localStorage = pequeña memoria del navegador que no se borra al cerrar la página
      const guardado = localStorage.getItem("galletas-v2");
      if (guardado) {
        const datos = JSON.parse(guardado);
        setPrecio(datos.precio ?? "");
        setCosto(datos.costo ?? "");
        setBolsas(datos.bolsas ?? []);
        setPedidos(datos.pedidos ?? []);
        setAceptados(datos.aceptados ?? []);
        setPerdidas(datos.perdidas ?? []);
      }
    } catch {
      // si lo guardado está dañado, se empieza de cero
    }
    setCargado(true);
  }, []);

  // Cada vez que algo cambia, lo guarda (solo después de haber recuperado)
  useEffect(() => {
    if (!cargado) return;
    localStorage.setItem(
      "galletas-v2",
      JSON.stringify({ precio, costo, bolsas, pedidos, aceptados, perdidas })
    );
  }, [cargado, precio, costo, bolsas, pedidos, aceptados, perdidas]);

  // Convertimos el texto a número (si está vacío o mal escrito, queda en 0)
  const precioGalleta = Number(precio) || 0;
  const costoGalleta = Number(costo) || 0;
  // Ganancia por galleta = lo que cobras − lo que te cuesta
  const gananciaPorGalleta = precioGalleta - costoGalleta;

  // Las bolsas vencidas se pasan solas a "Pérdidas" (valoradas al costo)
  useEffect(() => {
    if (!cargado || hoy === "") return;
    const vencidas = bolsas.filter((b) => b.vence < hoy);
    if (vencidas.length === 0) return;
    setPerdidas([
      ...perdidas,
      ...vencidas.map((b) => ({ cantidad: b.cantidad, vence: b.vence, costo: costoGalleta })),
    ]);
    setBolsas(bolsas.filter((b) => b.vence >= hoy));
  }, [cargado, hoy, bolsas, perdidas, costoGalleta]);

  // ---------- Inventario ----------
  // Suma las galletas de las bolsas que todavía no han vencido
  const galletas = bolsas
    .filter((b) => b.vence >= hoy)
    .reduce((suma, b) => suma + b.cantidad, 0);

  function agregarBolsa() {
    const n = Number(cantidadBolsa);
    // Si falta un dato o la cantidad no es válida, no hace nada
    if (!(n > 0) || venceBolsa === "") return;
    // [...bolsas, nueva] = la lista de antes + la bolsa nueva al final
    setBolsas([...bolsas, { cantidad: n, vence: venceBolsa }]);
    setCantidadBolsa("");
    setVenceBolsa("");
  }

  // filter deja todas las bolsas menos la que está en la posición i
  function quitarBolsa(i: number) {
    setBolsas(bolsas.filter((_, k) => k !== i));
  }

  // Editar = pasar los datos al formulario y quitar la bolsa de la lista
  function editarBolsa(i: number) {
    setCantidadBolsa(String(bolsas[i].cantidad));
    setVenceBolsa(bolsas[i].vence);
    quitarBolsa(i);
  }

  // ---------- Pedidos ----------
  // Un pedido necesita cliente, galletas y fecha de entrega (el WhatsApp es opcional)
  function agregarPedido() {
    const n = Number(cantidad);
    if (cliente.trim() === "" || !(n > 0) || entrega === "") return;
    setPedidos([
      ...pedidos,
      { cliente: cliente.trim(), telefono: telefono.trim(), cantidad: n, entrega },
    ]);
    setCliente("");
    setTelefono("");
    setCantidad("");
    setEntrega("");
  }

  function quitarPedido(i: number) {
    setPedidos(pedidos.filter((_, k) => k !== i));
  }

  function editarPedido(i: number) {
    const p = pedidos[i];
    setCliente(p.cliente);
    setTelefono(p.telefono);
    setCantidad(String(p.cantidad));
    setEntrega(p.entrega);
    quitarPedido(i);
  }

  // "para hoy", "mañana", "atrasado"...
  function textoEntrega(fecha: string) {
    const d = diasHasta(fecha, hoy);
    if (d < 0) return "atrasado";
    if (d === 0) return "para hoy";
    if (d === 1) return "para mañana";
    return "para el " + fechaCorta(fecha);
  }

  // ---------- Sugerencia ----------
  // Esta es la parte "inteligente": entre todos los pedidos, busca los que
  // aprovechan mejor las galletas disponibles (la persona nunca ve cómo lo hace).
  // Solo cuentan los pedidos que hay que entregar hasta ese día,
  // y las galletas que todavía sirven ese día.
  const pedidosDelDia = pedidos.filter((p) => p.entrega <= dia);
  const disponibles = bolsas
    .filter((b) => b.vence >= dia)
    .reduce((suma, b) => suma + b.cantidad, 0);
  // d.elegidos = pedidos sugeridos; d.usadas = galletas que se usarían
  const d = programacionDinamica(pedidosDelDia, disponibles);

  // Mensaje cuando no hay nada que sugerir
  let mensaje = "";
  if (pedidosDelDia.length === 0) mensaje = "No tienes pedidos para ese día.";
  else if (disponibles === 0) mensaje = "No tienes galletas disponibles ese día.";
  else if (d.elegidos.length === 0) mensaje = "Ningún pedido cabe con tus galletas.";

  // Plata y ganancia que dejaría aceptar lo sugerido
  const ventaSugerida = d.usadas * precioGalleta;
  const gananciaSugerida = d.usadas * gananciaPorGalleta;

  // Escribe la lista de sugeridos: "Ana (7), Beto (6)"
  function nombres() {
    return d.elegidos.map((p) => `${p.cliente} (${p.cantidad})`).join(", ");
  }

  // Confirmar: saca las galletas de las bolsas y pasa los pedidos a "aceptados"
  function confirmar() {
    let nuevasBolsas = bolsas;
    const nuevos: Aceptado[] = [];
    for (const p of d.elegidos) {
      // descontar saca primero de las bolsas que vencen antes (r.partes recuerda de cuáles)
      const r = descontar(nuevasBolsas, p.cantidad, dia);
      nuevasBolsas = r.bolsas;
      nuevos.push({ ...p, precio: precioGalleta, costo: costoGalleta, fecha: hoy, partes: r.partes });
    }
    setBolsas(nuevasBolsas);
    setAceptados([...aceptados, ...nuevos]);
    setPedidos(pedidos.filter((p) => !d.elegidos.includes(p)));
  }

  // Deshacer: las galletas vuelven a sus bolsas y el pedido a la lista
  function deshacer(i: number) {
    const a = aceptados[i];
    setBolsas(devolver(bolsas, a.partes));
    setPedidos([
      ...pedidos,
      { cliente: a.cliente, telefono: a.telefono, cantidad: a.cantidad, entrega: a.entrega },
    ]);
    setAceptados(aceptados.filter((_, k) => k !== i));
  }

  // El texto que le llega al cliente por WhatsApp
  function mensajeWhatsApp(a: Aceptado) {
    return `Hola ${a.cliente}, tu pedido de ${a.cantidad} galletas (${pesos(
      a.cantidad * a.precio
    )}) está confirmado para el ${fechaCorta(a.entrega)}. ¡Gracias! 🍪`;
  }

  // ---------- Ventas y ganancia ----------
  // Suma ventas y ganancia de los pedidos aceptados desde cierta fecha en adelante
  function resumen(desde: string) {
    const lista = aceptados.filter((a) => a.fecha >= desde);
    return {
      pedidos: lista.length,
      ventas: lista.reduce((s, a) => s + a.cantidad * a.precio, 0),
      ganancia: lista.reduce((s, a) => s + a.cantidad * (a.precio - a.costo), 0),
    };
  }
  const deHoy = resumen(hoy); // solo hoy
  // (mientras no sabemos qué día es hoy, no contamos nada)
  const de7 = resumen(hoy === "" ? "9999-99-99" : sumarDias(hoy, -6));

  // Para la gráfica: las ventas de cada uno de los últimos 7 días
  const ultimos7 =
    hoy === ""
      ? []
      : [-6, -5, -4, -3, -2, -1, 0].map((n) => {
          const fecha = sumarDias(hoy, n);
          const total = aceptados
            .filter((a) => a.fecha === fecha)
            .reduce((s, a) => s + a.cantidad * a.precio, 0);
          // La inicial del día de la semana (L, M, M, J, V, S, D)
          const letra = new Date(fecha + "T00:00:00")
            .toLocaleDateString("es-CO", { weekday: "narrow" })
            .toUpperCase();
          return { fecha, total, letra };
        });
  const maximo = Math.max(1, ...ultimos7.map((x) => x.total)); // el día que más vendió

  // Totales de pérdidas (el dinero perdido se calcula con lo que costaron)
  const galletasPerdidas = perdidas.reduce((s, p) => s + p.cantidad, 0);
  const dineroPerdido = perdidas.reduce((s, p) => s + p.cantidad * p.costo, 0);

  // La fecha de hoy escrita bonita: "viernes, 20 de noviembre"
  const fechaBonita =
    hoy === ""
      ? ""
      : new Date(hoy + "T00:00:00").toLocaleDateString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

  // Borra todo (pregunta primero para evitar accidentes)
  function borrarTodo() {
    if (!confirm("¿Borrar todo y empezar de cero?")) return;
    setPrecio("");
    setCosto("");
    setBolsas([]);
    setPedidos([]);
    setAceptados([]);
    setPerdidas([]);
  }

  // ---------- Pedazos de pantalla que se usan en más de una pestaña ----------

  // La tarjeta de "¿Qué pedidos acepto?" con su botón de confirmar
  const tarjetaSugerencia = (
    <section className={tarjeta}>
      <h2 className={titulo}>¿Qué pedidos acepto?</h2>
      <label className="block text-sm text-[#8A7262] mb-1">Armar para el día</label>
      <input
        type="date"
        aria-label="Día de la sugerencia"
        className={`${campo} mb-3`}
        value={dia}
        onChange={(e) => setDia(e.target.value)}
      />
      {mensaje !== "" ? (
        <p className="text-[#8A7262] mb-3">{mensaje}</p>
      ) : (
        <div className="mb-3 bg-[#EEF3EC] rounded-2xl p-3">
          <p className="mb-1">
            Te sugerimos aceptar: <b>{nombres()}</b>
          </p>
          <p className="mb-1 text-sm text-[#8A7262]">
            Usas {d.usadas} de {disponibles} galletas.
          </p>
          {precioGalleta > 0 && (
            <p className="font-bold">
              Vendes {pesos(ventaSugerida)}
              {costoGalleta > 0 && (
                <span className="text-[#5E8456]"> · Ganancia {pesos(gananciaSugerida)}</span>
              )}
            </p>
          )}
        </div>
      )}
      <button className={boton} onClick={confirmar} disabled={d.elegidos.length === 0}>
        Confirmar pedidos
      </button>
    </section>
  );

  // La lista de pedidos por aceptar (cada uno con Editar y Quitar)
  const listaPedidos = (
    <ul>
      {[...pedidos]
        .map((p, i) => ({ p, i })) // guardamos la posición original para editar/quitar bien
        .sort((x, y) => (x.p.entrega < y.p.entrega ? -1 : 1)) // los más urgentes primero
        .map(({ p, i }) => (
          <li key={i} className="flex justify-between items-center bg-[#FBF4E8] rounded-2xl p-3 mb-2">
            <span>
              <b>{p.cliente}</b>: {p.cantidad} galletas
              {precioGalleta > 0 ? ` (${pesos(p.cantidad * precioGalleta)})` : ""}
              <span className={`block text-sm ${diasHasta(p.entrega, hoy) < 0 ? "text-red-600 font-semibold" : "text-[#8A7262]"}`}>
                {textoEntrega(p.entrega)}
              </span>
            </span>
            <span className="flex gap-3">
              <button className={`${linkChico} text-[#C8694F]`} onClick={() => editarPedido(i)}>
                Editar
              </button>
              <button className={`${linkChico} text-red-600`} onClick={() => quitarPedido(i)}>
                Quitar
              </button>
            </span>
          </li>
        ))}
    </ul>
  );

  // ---------- Lo que se ve en pantalla ----------
  // (HTML dentro de TypeScript. Lo que va entre llaves { } es código que se calcula.)
  return (
    <main className="min-h-screen bg-[#FBF4E8] text-[#4A3125]">
      {/* Encabezado terracota, centrado, a todo lo ancho de la pantalla */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#D4795F] to-[#C25F45] text-white px-5 pt-8 pb-7 rounded-b-[2.5rem] shadow-md text-center">
        {/* Dos círculos suaves de adorno */}
        <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#FBF4E8] shadow-lg ring-4 ring-white/30 flex items-center justify-center text-4xl">
            🍪
          </div>
          <h1 className="text-3xl font-extrabold tracking-wide mt-3">Cookie Campus</h1>
          {/* La fecha de hoy: solo la primera letra en mayúscula ("Viernes, 20 de noviembre") */}
          <p className="mt-3 inline-block bg-white/20 rounded-full px-4 py-1 text-sm font-semibold">
            {fechaBonita === "" ? "\u00a0" : fechaBonita.charAt(0).toUpperCase() + fechaBonita.slice(1)}
          </p>
        </div>
      </header>

      <div className="max-w-md mx-auto pb-28 pt-5">

        <div className="px-4">
          {/* ===================== PESTAÑA: INICIO ===================== */}
          {pestana === "inicio" && (
            <>
              {/* Resumen con gráfica de ventas de los últimos 7 días */}
              <section className={tarjeta}>
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-extrabold">Resumen diario</h2>
                  <div className="text-right">
                    <p className="text-xs text-[#8A7262]">Ganancia hoy</p>
                    <p className="text-lg font-extrabold text-[#5E8456]">{pesos(deHoy.ganancia)}</p>
                  </div>
                </div>
                <div className="flex items-end gap-2 h-28">
                  {ultimos7.map((x) => (
                    <div key={x.fecha} className="flex-1 flex flex-col items-center justify-end h-full">
                      {/* La altura de la barra depende de cuánto se vendió ese día */}
                      <div
                        className={`w-full rounded-t-lg ${x.fecha === hoy ? "bg-[#C8694F]" : "bg-[#E8B9A8]"}`}
                        style={{ height: `${Math.max(4, (x.total / maximo) * 100)}%` }}
                      />
                      <span className="text-xs text-[#8A7262] mt-1">{x.letra}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#8A7262] mt-2">
                  Últimos 7 días: <b className="text-[#4A3125]">{pesos(de7.ventas)}</b> vendidos
                </p>
              </section>

              {/* Tres datos rápidos */}
              <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                <div className="bg-white rounded-2xl border border-[#F0E3CC] p-3">
                  <p className="text-2xl font-extrabold text-[#C8694F]">{pedidos.length}</p>
                  <p className="text-xs text-[#8A7262]">Pedidos activos</p>
                </div>
                <div className="bg-white rounded-2xl border border-[#F0E3CC] p-3">
                  <p className="text-2xl font-extrabold text-[#C8694F]">{galletas}</p>
                  <p className="text-xs text-[#8A7262]">Galletas disponibles</p>
                </div>
                <div className="bg-white rounded-2xl border border-[#F0E3CC] p-3">
                  <p className="text-lg font-extrabold text-[#5E8456] leading-8">{pesos(de7.ganancia)}</p>
                  <p className="text-xs text-[#8A7262]">Ganancia 7 días</p>
                </div>
              </div>

              {tarjetaSugerencia}
            </>
          )}

          {/* ===================== PESTAÑA: PEDIDOS ===================== */}
          {pestana === "pedidos" && (
            <>
              <section className={tarjeta}>
                <h2 className={titulo}>Nuevo pedido</h2>
                <input
                  className={`${campo} mb-2`}
                  placeholder="Cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                />
                <input
                  className={`${campo} mb-2`}
                  inputMode="tel"
                  placeholder="WhatsApp (opcional)"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
                <div className="flex gap-2 mb-3">
                  <input
                    className={`${campo} w-28`}
                    inputMode="numeric"
                    placeholder="Galletas"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                  />
                  <input
                    type="date"
                    aria-label="Fecha de entrega"
                    className={campo}
                    value={entrega}
                    onChange={(e) => setEntrega(e.target.value)}
                  />
                </div>
                <button className={boton} onClick={agregarPedido}>
                  Agregar pedido
                </button>
              </section>

              <section className={tarjeta}>
                <h2 className={titulo}>Pedidos por aceptar</h2>
                {pedidos.length === 0 && <p className="text-[#8A7262]">No tienes pedidos.</p>}
                {listaPedidos}
              </section>

              {tarjetaSugerencia}

              <section className={tarjeta}>
                <h2 className={titulo}>Pedidos aceptados</h2>
                {aceptados.length === 0 ? (
                  <p className="text-[#8A7262]">Todavía no has aceptado ninguno.</p>
                ) : (
                  <ul>
                    {aceptados.map((a, i) => (
                      <li key={i} className="bg-[#EEF3EC] rounded-2xl p-3 mb-2">
                        <p>
                          <b>{a.cliente}</b>: {a.cantidad} galletas ({pesos(a.cantidad * a.precio)})
                        </p>
                        <p className="text-sm text-[#8A7262]">
                          Entrega {fechaCorta(a.entrega)} · Ganancia {pesos(a.cantidad * (a.precio - a.costo))}
                        </p>
                        <div className="flex gap-3 mt-2 items-center">
                          {/* Este link abre WhatsApp con el mensaje ya escrito */}
                          <a
                            className={botonVerde}
                            href={enlaceWhatsApp(a.telefono, mensajeWhatsApp(a))}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Avisar por WhatsApp
                          </a>
                          <button className={`${linkChico} text-red-600`} onClick={() => deshacer(i)}>
                            Deshacer
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {/* ===================== PESTAÑA: INVENTARIO ===================== */}
          {pestana === "inventario" && (
            <>
              <section className={`${tarjeta} text-center`}>
                <p className="text-[#8A7262]">Galletas disponibles</p>
                <p className="text-6xl font-extrabold text-[#C8694F]">{galletas}</p>
              </section>

              <section className={tarjeta}>
                <h2 className={titulo}>Bolsas</h2>
                {bolsas.length === 0 && <p className="text-[#8A7262] mb-3">No tienes bolsas.</p>}
                <ul className="mb-3">
                  {[...bolsas]
                    .map((b, i) => ({ b, i }))
                    .sort((x, y) => (x.b.vence < y.b.vence ? -1 : 1)) // las que vencen primero arriba
                    .map(({ b, i }) => {
                      const faltan = diasHasta(b.vence, hoy);
                      // Semáforo: rojo si vence hoy, naranja si vence mañana, gris si falta más
                      const color = faltan <= 0 ? "text-red-600" : faltan === 1 ? "text-orange-500" : "text-[#8A7262]";
                      return (
                        <li key={i} className="flex justify-between items-center bg-[#FBF4E8] rounded-2xl p-3 mb-2">
                          <span>
                            <b>{b.cantidad}</b> galletas
                            <span className={`block text-sm ${color}`}>
                              {faltan === 0 ? "vence hoy" : faltan === 1 ? "vence mañana" : "vence el " + fechaCorta(b.vence)}
                            </span>
                          </span>
                          <span className="flex gap-3">
                            <button className={`${linkChico} text-[#C8694F]`} onClick={() => editarBolsa(i)}>
                              Editar
                            </button>
                            <button className={`${linkChico} text-red-600`} onClick={() => quitarBolsa(i)}>
                              Quitar
                            </button>
                          </span>
                        </li>
                      );
                    })}
                </ul>
                <div className="flex gap-2 mb-3">
                  <input
                    className={`${campo} w-28`}
                    inputMode="numeric"
                    placeholder="Galletas"
                    value={cantidadBolsa}
                    onChange={(e) => setCantidadBolsa(e.target.value)}
                  />
                  <input
                    type="date"
                    aria-label="Fecha de vencimiento"
                    className={campo}
                    value={venceBolsa}
                    onChange={(e) => setVenceBolsa(e.target.value)}
                  />
                </div>
                <button className={boton} onClick={agregarBolsa}>
                  Agregar bolsa
                </button>
              </section>

              <section className={tarjeta}>
                <h2 className={titulo}>Pérdidas por vencimiento</h2>
                {perdidas.length === 0 ? (
                  <p className="text-[#8A7262]">No has perdido galletas por vencimiento.</p>
                ) : (
                  <>
                    <p className="font-bold text-red-600 mb-2">
                      {galletasPerdidas} galletas perdidas ({pesos(dineroPerdido)})
                    </p>
                    <ul>
                      {perdidas.map((p, i) => (
                        <li key={i} className="border-b border-[#F0E3CC] py-1 text-sm">
                          {p.cantidad} galletas, vencieron el {fechaCorta(p.vence)}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            </>
          )}

          {/* ===================== PESTAÑA: MÁS ===================== */}
          {pestana === "mas" && (
            <>
              <section className={tarjeta}>
                <h2 className={titulo}>Precios</h2>
                <label className="block text-sm text-[#8A7262] mb-1">Precio de venta ($)</label>
                <input
                  className={`${campo} mb-3`}
                  inputMode="numeric"
                  placeholder="Precio de venta"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
                <label className="block text-sm text-[#8A7262] mb-1">Lo que te cobra la proveedora ($)</label>
                <input
                  className={campo}
                  inputMode="numeric"
                  placeholder="Costo del proveedor"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                />
                {precioGalleta > 0 && costoGalleta > 0 && (
                  <p className="mt-3 text-[#5E8456] font-bold">
                    Ganas {pesos(gananciaPorGalleta)} por galleta
                  </p>
                )}
              </section>

              <section className={tarjeta}>
                <h2 className={titulo}>Ventas</h2>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-[#FBF4E8] rounded-2xl p-3">
                    <p className="text-sm text-[#8A7262]">Hoy</p>
                    <p className="text-xl font-extrabold">{pesos(deHoy.ventas)}</p>
                    <p className="text-sm text-[#5E8456]">Ganancia {pesos(deHoy.ganancia)}</p>
                  </div>
                  <div className="bg-[#FBF4E8] rounded-2xl p-3">
                    <p className="text-sm text-[#8A7262]">Últimos 7 días</p>
                    <p className="text-xl font-extrabold">{pesos(de7.ventas)}</p>
                    <p className="text-sm text-[#5E8456]">Ganancia {pesos(de7.ganancia)}</p>
                  </div>
                </div>
              </section>

              <button className="text-red-600 underline mb-4" onClick={borrarTodo}>
                Empezar de cero
              </button>
            </>
          )}
        </div>
      </div>

      {/* Barra de abajo para cambiar de pestaña (siempre pegada al fondo) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F0E3CC]">
        <div className="max-w-md mx-auto grid grid-cols-4">
          {pestanas.map((t) => (
            <button
              key={t.id}
              onClick={() => setPestana(t.id)}
              className={`flex flex-col items-center py-2 text-xs font-semibold ${
                pestana === t.id ? "text-[#C8694F]" : "text-[#A8957F]"
              }`}
            >
              <Icono nombre={t.id} />
              {t.texto}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}