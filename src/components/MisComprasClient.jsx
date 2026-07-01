// src/components/MisComprasClient.jsx
"use client";

import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "@/context/AuthContext";
import "@/css/MisCompras.css";

const currencyByLocale = {
  "en-US": "USD",
  "es-ES": "EUR",
  "fr-FR": "EUR",
  "it-IT": "EUR",
  "de-DE": "EUR",
};

export default function MisComprasClient({ locale = "es-ES", dict = {} }) {
  const { usuario } = useAuth();

  const [comprasEnriquecidas, setComprasEnriquecidas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [procesandoProductos, setProcesandoProductos] = useState(false);
  const [error, setError] = useState(null);

  const d = dict.mis_compras || {};
  const bookLabels = dict.book_labels || {};

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchCompras = async () => {
      if (!usuario?.id) {
        setComprasEnriquecidas([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = `/api/compras?usuario_id=${encodeURIComponent(usuario.id)}`;
        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `HTTP ${res.status}`);
        }

        const json = await res.json().catch(() => ({}));
        const comprasRaw = Array.isArray(json) ? json : (json?.data ?? []);

        if (!mounted) return;

        if (comprasRaw.length === 0) {
          setComprasEnriquecidas([]);
          return;
        }

        // Enriquecer productos (cache simple)
        setProcesandoProductos(true);
        const productCache = new Map();

        const getInfoLibro = async (id) => {
          const key = String(id);
          if (productCache.has(key)) return productCache.get(key);

          try {
            const r = await fetch(`/api/productos/${encodeURIComponent(id)}`);
            if (!r.ok) {
              const fallback = {
                titulo: `${d.product_fallback_title || "Producto"} #${id}`,
                portada: "/placeholder.png",
                autor: bookLabels.unknown_author || "Desconocido",
              };
              productCache.set(key, fallback);
              return fallback;
            }
            const j = await r.json().catch(() => ({}));
            const info = j?.data ?? j;
            const item = Array.isArray(info) ? (info[0] ?? {}) : info;
            const data = {
              titulo:
                item?.titulo ??
                item?.nombre ??
                `${d.product_fallback_title || "Producto"} #${id}`,
              portada: item?.imagen_url ?? item?.portada ?? "/placeholder.png",
              autor:
                item?.autor ??
                item?.author ??
                (bookLabels.unknown_author || "Autor desconocido"),
            };
            productCache.set(key, data);
            return data;
          } catch (err) {
            const fallback = {
              titulo: `${d.product_fallback_title || "Producto"} #${id}`,
              portada: "/placeholder.png",
              autor: bookLabels.unknown_author || "Desconocido",
            };
            productCache.set(key, fallback);
            return fallback;
          }
        };

        const procesadas = await Promise.all(
          comprasRaw.map(async (compra) => {
            const detalles = Array.isArray(compra.detalle_compra)
              ? compra.detalle_compra
              : (compra.detalles ?? []);
            const detallesConInfo = await Promise.all(
              detalles.map(async (det) => {
                const productoId =
                  det.producto_id ?? det.productoId ?? det.id ?? null;
                const info = productoId
                  ? await getInfoLibro(productoId)
                  : {
                      titulo: d.unknown_product_title || "Producto desconocido",
                      portada: "/placeholder.png",
                      autor: bookLabels.unknown_author || "Desconocido",
                    };
                return {
                  ...det,
                  titulo: info.titulo,
                  portada: info.portada,
                  autor: info.autor,
                };
              }),
            );

            return {
              ...compra,
              detallesConInfo,
            };
          }),
        );

        if (mounted) setComprasEnriquecidas(procesadas);
      } catch (err) {
        if (mounted) {
          if (err.name !== "AbortError") {
            console.error("Error cargando compras:", err);
            setError(String(err.message ?? err));
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setProcesandoProductos(false);
        }
      }
    };

    fetchCompras();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [usuario, dict, d, bookLabels]);

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyByLocale[locale] || "EUR",
    }).format(Number(value || 0));

  if (!usuario) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="info">
          {d.login_prompt || "Inicia sesión para ver tu historial de compras."}
        </Alert>
      </Container>
    );
  }

  if (loading || procesandoProductos) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">
          {d.loading_text || "Cargando tu historial..."}
        </p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          {d.fetch_error || "Error al conectar con el servidor"}: {error}
        </Alert>
      </Container>
    );
  }

  if (!comprasEnriquecidas || comprasEnriquecidas.length === 0) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="info">
          <h4>
            {d.no_purchases_title ||
              "No tienes compras registradas en la base de datos"}
          </h4>
          {d.no_purchases_text && <p className="mb-0">{d.no_purchases_text}</p>}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h2 className="mb-4 text-center">
        {d.page_title || "Mi Historial de Compras"}
      </h2>
      <Row className="justify-content-center">
        <Col lg={10}>
          {comprasEnriquecidas.map((compra) => (
            <Card
              key={compra.id_compra ?? compra.id}
              className="shadow-sm mb-4 border-0"
            >
              <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3 border-bottom">
                <div>
                  <span className="fw-bold text-primary">
                    {d.order_label || "Pedido"} #{compra.id_compra ?? compra.id}
                  </span>
                  <div className="text-muted small">
                    {compra.fecha_compra ? formatDate(compra.fecha_compra) : ""}
                  </div>
                </div>
                <div className="text-end">
                  <span className="text-muted small d-block">
                    {d.total_paid_label || "Total pagado"}
                  </span>
                  <span className="h5 mb-0 text-success fw-bold">
                    {formatCurrency(compra.total ?? compra.total_pagado ?? 0)}
                  </span>
                </div>
              </Card.Header>

              <Card.Body>
                {compra.detallesConInfo.map((item, idx) => (
                  <div
                    key={item.id_detalle ?? item.id ?? idx}
                    className={`d-flex align-items-center ${idx !== 0 ? "mt-4" : ""}`}
                  >
                    <img
                      src={item.portada}
                      alt={item.titulo}
                      className="rounded shadow-sm"
                      style={{
                        width: "70px",
                        height: "100px",
                        objectFit: "cover",
                      }}
                      onError={(e) =>
                        (e.currentTarget.src = "/placeholder.png")
                      }
                    />
                    <div className="ms-3 flex-grow-1">
                      <h6 className="mb-1 fw-bold">{item.titulo}</h6>
                      <p className="mb-1 text-muted small">{item.autor}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-secondary">
                          {d.quantity_label || "Cantidad"}:{" "}
                          <strong>{item.cantidad}</strong>
                        </small>
                        <span className="fw-bold">
                          {d.subtotal_label || "Subtotal"}:{" "}
                          {formatCurrency(item.subtotal ?? item.precio ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          ))}
        </Col>
      </Row>
    </Container>
  );
}
