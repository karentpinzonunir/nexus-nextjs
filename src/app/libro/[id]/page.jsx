"use client";

import { use } from "react";
import VistaLibro from "@/components/VistaLibro";
import MySwal from "@/utils/swal";

export default function LibroDetallePage(props) {
  const params = use(props.params);
  const { id } = params;

  const agregarAlCarrito = (libro) => {
    MySwal.fire({
      icon: "success",
      title: "Añadido al carrito",
      text: `${libro.titulo} se ha añadido a tu carrito.`,
    });
  };

  return (
    <VistaLibro
      id={id}
      modoCompleto={true}
      onAgregarCarrito={agregarAlCarrito}
    />
  );
}
