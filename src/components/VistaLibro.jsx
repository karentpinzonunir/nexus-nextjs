// src/components/VistaLibro.jsx
"use client";
import React from "react";
import { Spinner, Alert, Row, Col, Button } from "react-bootstrap";
import useFetch from "@/hooks/useFetch";
import { useCarrito } from "@/context/CarritoContext";
import MySwal from "@/utils/swal";
import "@/css/VistaLibro.css";

/**
 * Props:
 * - id (string|number)
 * - modoCompleto (boolean)
 * - initialLibro (obj|null)
 * - onAgregarCarrito (fn)
 * - locale (string)  -> p.ej. "es-ES"
 * - dict (object)    -> diccionario de traducción
 */
const currencyByLocale = {
  "en-US": "USD",
  "es-ES": "EUR",
  "fr-FR": "EUR",
  "it-IT": "EUR",
  "de-DE": "EUR",
};

const VistaLibro = ({
  id,
  modoCompleto = false,
  initialLibro = null,
  onAgregarCarrito,
  locale = "es-ES",
  dict = {},
}) => {
  const { agregarAlCarrito } = useCarrito();

  const fetchUrl = initialLibro
    ? null
    : id
      ? `/api/productos/${encodeURIComponent(id)}`
      : null;

  if (!initialLibro && !id) {
    return (
      <Alert variant="warning">
        {dict.errors?.no_product_id || "ID de producto no especificado."}
      </Alert>
    );
  }

  const {
    data: libroFetchRaw,
    cargando: cargandoLibro,
    error: errorLibro,
  } = useFetch(fetchUrl);

  const libroRaw = initialLibro ?? libroFetchRaw;

  const {
    data: categoriasRaw,
    cargando: cargandoCats,
    error: errorCats,
  } = useFetch("/api/categorias");

  const isLoading =
    (!initialLibro &&
      (cargandoLibro || libroRaw === undefined || libroRaw === null)) ||
    cargandoCats;

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (errorLibro || errorCats) {
    return (
      <Alert variant="danger" className="text-center">
        {errorLibro || errorCats}
      </Alert>
    );
  }

  const resolvedLibro = (() => {
    if (!libroRaw) return null;
    if (Array.isArray(libroRaw)) return libroRaw[0] ?? null;
    if (libroRaw.data && Array.isArray(libroRaw.data))
      return libroRaw.data[0] ?? null;
    if (libroRaw.data && typeof libroRaw.data === "object")
      return libroRaw.data;
    return libroRaw;
  })();

  if (!resolvedLibro) {
    return (
      <Alert variant="warning">
        {dict.errors?.not_found || "No se encontró el libro"}
      </Alert>
    );
  }

  const libroData = {
    id: resolvedLibro.id_producto ?? resolvedLibro.id ?? null,
    categoriaId:
      resolvedLibro.categoria_id ?? resolvedLibro.categoriaId ?? null,
    titulo:
      resolvedLibro.titulo ??
      resolvedLibro.nombre ??
      (dict.book_labels?.no_title || "Sin título"),
    descripcion: resolvedLibro.descripcion ?? "",
    tipo: resolvedLibro.tipo_producto ?? resolvedLibro.tipo ?? "",
    autor:
      resolvedLibro.autor ??
      resolvedLibro.author ??
      (dict.book_labels?.unknown_author || "Autor desconocido"),
    editorial: resolvedLibro.editorial ?? "",
    year: resolvedLibro.fecha_publicacion
      ? new Date(resolvedLibro.fecha_publicacion).getFullYear()
      : (resolvedLibro.year ?? null),
    precio: Number(resolvedLibro.precio ?? 0),
    stock: Number(resolvedLibro.stock ?? 0),
    portada:
      resolvedLibro.imagen_url ?? resolvedLibro.portada ?? "/placeholder.png",
  };

  const categorias = (() => {
    if (!categoriasRaw) return [];
    if (Array.isArray(categoriasRaw)) return categoriasRaw;
    if (categoriasRaw.data && Array.isArray(categoriasRaw.data))
      return categoriasRaw.data;
    return [];
  })();

  const categoriaEncontrada = categorias.find((cat) => {
    const catId = cat.id ?? cat.id_categoria ?? cat.categoria_id ?? null;
    return String(catId) === String(libroData.categoriaId);
  });

  const nombreCategoria = categoriaEncontrada
    ? (categoriaEncontrada.nombre ??
      categoriaEncontrada.nombre_categoria ??
      (dict.book_labels?.category_label || "Categoría"))
    : dict.book_labels?.no_category || "Sin categoría";

  const manejarAgregarCarrito = () => {
    if (!libroData) return;

    const item = {
      id: libroData.id,
      titulo: libroData.titulo,
      precio: libroData.precio,
      cantidad: 1,
      portada: libroData.portada,
      stock: libroData.stock,
      autor: libroData.autor,
    };

    agregarAlCarrito(item);

    MySwal.fire({
      icon: "success",
      title: dict.toasts?.added_title || "Añadido al carrito",
      text:
        (dict.toasts?.added_text &&
          dict.toasts.added_text.replace("{title}", libroData.titulo)) ||
        `${libroData.titulo} ${dict.toasts?.default_added_text || "se ha añadido a tu carrito de compras."}`,
      confirmButtonText: dict.buttons?.ok || "Aceptar",
      timer: 2000,
      timerProgressBar: true,
    });

    if (onAgregarCarrito) {
      onAgregarCarrito(item);
    }
  };

  const currency = currencyByLocale[locale] ?? "USD";
  const formattedPrice =
    typeof libroData.precio === "number"
      ? new Intl.NumberFormat(locale, { style: "currency", currency }).format(
          libroData.precio,
        )
      : null;

  return (
    <Row>
      <Col md={4} className="mb-4">
        {libroData.portada ? (
          <img
            src={libroData.portada}
            alt={libroData.titulo}
            className={`img-fluid rounded detalle-libro__portada ${modoCompleto ? "detalle-libro__portada--completo" : ""}`}
            onError={(e) => (e.currentTarget.src = "/placeholder.png")}
          />
        ) : (
          <div
            className="bg-light d-flex align-items-center justify-content-center"
            style={{ height: 300 }}
          >
            <span className="text-muted">
              {dict.book_labels?.no_image || "Sin imagen"}
            </span>
          </div>
        )}
      </Col>

      <Col md={8}>
        <h2 className={modoCompleto ? "" : "h4"}>{libroData.titulo}</h2>
        {libroData.autor && <h5 className="text-muted">{libroData.autor}</h5>}

        {libroData.descripcion && (
          <p className="mt-3 detalle-libro__descripcion">
            {libroData.descripcion}
          </p>
        )}

        {modoCompleto && (
          <div className="mt-3 p-3 bg-light rounded shadow-sm">
            <p className="mb-1">
              <strong>
                {dict.book_labels?.category_label || "Categoría"}:
              </strong>{" "}
              {nombreCategoria}
            </p>
            <p className="mb-1">
              <strong>{dict.book_labels?.type_label || "Tipo"}:</strong>{" "}
              {libroData.tipo || "—"}
            </p>
            <p className="mb-1">
              <strong>{dict.book_labels?.year_label || "Año"}:</strong>{" "}
              {libroData.year ?? "—"}
            </p>
            <p className="mb-1">
              <strong>
                {dict.book_labels?.editorial_label || "Editorial"}:
              </strong>{" "}
              {libroData.editorial || "—"}
            </p>
            <p className="mb-0">
              <strong>
                {dict.book_labels?.stock_label || "Stock disponible"}:
              </strong>{" "}
              {libroData.stock} {dict.book_labels?.units_label || "unidades"}
            </p>
          </div>
        )}

        {formattedPrice && (
          <h4 className="mt-3 text-success fw-bold">{formattedPrice}</h4>
        )}

        <Button
          variant="success"
          size={modoCompleto ? "lg" : "md"}
          className="mt-3 px-4"
          onClick={manejarAgregarCarrito}
          disabled={libroData.stock <= 0}
        >
          {libroData.stock > 0
            ? dict.buttons?.add_to_cart || "Añadir al carrito"
            : dict.buttons?.out_of_stock || "Agotado"}
        </Button>
      </Col>
    </Row>
  );
};

export default VistaLibro;
