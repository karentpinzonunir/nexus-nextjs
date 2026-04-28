"use client";
import { useState, useEffect } from "react";

const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    const fetchData = async () => {
      try {
        setCargando(true);
        setError(null);

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
          throw new Error(`Error: ${respuesta.status}`);
        }

        const resultado = await respuesta.json();
        setData(resultado);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, cargando, error };
};

export default useFetch;
