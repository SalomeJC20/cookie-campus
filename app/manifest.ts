// Este archivo le dice al celular cómo instalar la app:
// el nombre, los colores y el ícono que se ve en la pantalla de inicio.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cookie Campus",
    short_name: "Cookie Campus", // el nombre debajo del ícono
    description: "Organiza tus pedidos e inventario de galletas",
    start_url: "/", // la página que se abre al tocar el ícono
    display: "standalone", // se abre como app, sin la barra del navegador
    background_color: "#FBF4E8", // color de la pantalla mientras carga
    theme_color: "#C8694F", // color de la barra superior del celular
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}