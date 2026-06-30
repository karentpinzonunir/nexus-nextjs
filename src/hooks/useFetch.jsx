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
          // intentamos leer body para dar más contexto al error
          const text = await respuesta.text().catch(() => null);
          throw new Error(
            `Error: ${respuesta.status}${text ? " - " + text : ""}`
          );
        }

        // intentamos parsear JSON (si la respuesta está vacía no romperá)
        const resultado = await respuesta.json().catch(() => null);

        // Si la API responde { data: ... } devolvemos resultado.data para mantener compatibilidad
        if (resultado && typeof resultado === "object" && "data" in resultado) {
          setData(resultado.data);
        } else {
          setData(resultado);
        }
      } catch (err) {
        // ignorar AbortError (desmontaje)
        if (err.name === "AbortError") return;
        setError(err.message || "Error desconocido");
      } finally {
        setCargando(false);
      }
    };

    fetchData();

    return () => controller.abort();
    // observamos url y options; stringify(options) para comparar objetos
  }, [url, JSON.stringify(options)]);

  return { data, cargando, error };
};

export default useFetch;