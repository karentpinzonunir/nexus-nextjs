"use client";
import { createContext, useContext, useState } from "react";

const ComprasContext = createContext();

export const useCompras = () => {
  const context = useContext(ComprasContext);
  if (!context) {
    throw new Error("useCompras debe usarse dentro de ComprasProvider");
  }
  return context;
};

export const ComprasProvider = ({ children }) => {
  const [comprasLocales, setComprasLocales] = useState([]);

  const agregarCompra = (itemsCarrito, usuarioId) => {
    const nuevaCompra = {
      id: Date.now(),
      usuarioId: usuarioId,
      fecha: new Date().toISOString(),
      items: itemsCarrito.map((item) => ({
        libroId: item.id,
        titulo: item.titulo,
        autor: item.autor,
        portada: item.portada,
        cantidad: item.cantidad,
        precio: item.precio,
      })),
      precioTotal: itemsCarrito.reduce(
        (total, item) => total + item.precio * item.cantidad,
        0
      ),
    };

    setComprasLocales((prev) => [nuevaCompra, ...prev]);
    return nuevaCompra;
  };

  return (
    <ComprasContext.Provider value={{ comprasLocales, agregarCompra }}>
      {children}
    </ComprasContext.Provider>
  );
};
