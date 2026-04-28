"use client";
import { createContext, useContext, useState } from "react";

const CarritoContext = createContext();

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  }
  return context;
};

export const CarritoProvider = ({ children }) => {
  const [itemsCarrito, setItemsCarrito] = useState([]);

  const agregarAlCarrito = (libro) => {
    setItemsCarrito((prevItems) => {
      const libroExistente = prevItems.find((item) => item.id === libro.id);

      if (libroExistente) {
        return prevItems.map((item) =>
          item.id === libro.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
        return [...prevItems, { ...libro, cantidad: 1 }];
      }
    });
  };

  const eliminarDelCarrito = (libroId) => {
    setItemsCarrito((prevItems) =>
      prevItems.filter((item) => item.id !== libroId)
    );
  };

  const actualizarCantidad = (libroId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(libroId);
      return;
    }
    setItemsCarrito((prevItems) =>
      prevItems.map((item) =>
        item.id === libroId ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  };

  const vaciarCarrito = () => {
    setItemsCarrito([]);
  };

  const totalItems = itemsCarrito.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  const totalPrecio = itemsCarrito.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0
  );

  return (
    <CarritoContext.Provider
      value={{
        itemsCarrito,
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidad,
        vaciarCarrito,
        totalItems,
        totalPrecio,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};
