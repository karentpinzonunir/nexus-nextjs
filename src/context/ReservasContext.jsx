"use client";
import { createContext, useState, useContext } from "react";

const ReservasContext = createContext();

export const ReservasProvider = ({ children }) => {
  const [reservasLocales, setReservasLocales] = useState([]);

  const agregarReserva = (nuevaReserva) => {
    const reservaConId = {
      ...nuevaReserva,
      id: Date.now(),
      fecha: new Date().toISOString(),
    };
    setReservasLocales((prev) => [reservaConId, ...prev]);
  };

  return (
    <ReservasContext.Provider value={{ reservasLocales, agregarReserva }}>
      {children}
    </ReservasContext.Provider>
  );
};

export const useReservas = () => useContext(ReservasContext);
