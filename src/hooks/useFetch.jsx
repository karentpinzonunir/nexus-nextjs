"use client";
import { useState, useEffect } from "react";

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        setCargando(true);
        setError(null);

        const fetchOptions = { ...options, signal };

        const respuesta = await fetch(url, fetchOptions);

        if (!respuesta.ok) {
          const text = await respuesta.text().catch(() => null);
          throw new Error(
            `Error: ${respuesta.status}${text ? " - " + text : ""}`
          );
        }

        const resultado = await respuesta.json().catch(() => null);

        if (resultado && typeof resultado === "object" && "data" in resultado) {
          setData(resultado.data);
        } else {
          setData(resultado);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Error desconocido");
      } finally {
        setCargando(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [url, JSON.stringify(options)]);

  return { data, cargando, error };
};

export default useFetch;