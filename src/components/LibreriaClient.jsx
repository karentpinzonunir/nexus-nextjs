// src/components/LibreriaClient.jsx
"use client";

import { useState } from "react";
import {
  Container,
  Row,
  Col,
  ListGroup,
  Card,
  Button,
  Spinner,
  Alert,
  Modal,
} from "react-bootstrap";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/useFetch";
import VistaLibro from "@/components/VistaLibro";
import MySwal from "@/utils/swal";
import "@/css/Libreria.css";

/**
 * Intenta varios campos localizados en un objeto según el locale.
 * bases: array de nombres base a probar, ej. ["titulo","title","nombre"]
 */
function getLocalizedField(obj = {}, bases = [], locale = "es-ES") {
  if (!obj || typeof obj !== "object") return null;
  const lang = (locale || "").split("-")[0]; // "es" de "es-ES"
  const candidates = [];

  for (const base of bases) {
    candidates.push(`${base}_${locale}`); // e.g. title_en-US (poco común)
    candidates.push(`${base}_${lang}`); // e.g. title_en
    // camel-case variant: base + Lang (TitleEn)
    candidates.push(`${base}${lang.charAt(0).toUpperCase() + lang.slice(1)}`);
    // common suffixes
    candidates.push(`${base}_en`);
    candidates.push(`${base}_es`);
    candidates.push(`${base}_fr`);
    candidates.push(`${base}_it`);
    candidates.push(`${base}_de`);
    candidates.push(base); // fallback sin sufijo
  }

  const extras = [
    "title",
    "titulo",
    "nombre",
    "name",
    "nombre_categoria",
    "description",
    "desc",
  ];
  for (const e of extras) {
    candidates.push(`${e}_${locale}`);
    candidates.push(`${e}_${lang}`);
    candidates.push(e);
  }

  for (const key of candidates) {
    if (!key) continue;
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (val !== null && val !== undefined && String(val).trim() !== "")
        return val;
    }
  }

  return null;
}

export default function LibreriaClient({ locale = "es-ES", dict = {} }) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [libroIdSeleccionado, setLibroIdSeleccionado] = useState(null);
  const router = useRouter();

  // Añadimos locale como parámetro para que el backend (si lo soporta) devuelva campos localizados.
  const categoriasUrl = `/api/categorias${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`;

  const {
    data: categoriasRaw,
    cargando: cargandoCats,
    error: errorCats,
  } = useFetch(categoriasUrl);

  const urlProductosBase = categoriaSeleccionada
    ? `/api/productos?categoria=${encodeURIComponent(categoriaSeleccionada)}`
    : `/api/productos`;

  const urlProductos = `${urlProductosBase}${urlProductosBase.includes("?") ? "&" : "?"}locale=${encodeURIComponent(locale)}`;

  const {
    data: productosRaw,
    cargando: cargandoProductos,
    error: errorProductos,
  } = useFetch(urlProductos);

  const isLoading =
    cargandoCats ||
    cargandoProductos ||
    ((categoriasRaw === undefined || categoriasRaw === null) &&
      (productosRaw === undefined || productosRaw === null) &&
      !errorCats &&
      !errorProductos);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (errorProductos || errorCats) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {errorProductos ||
            errorCats ||
            dict.libreria?.fetch_error ||
            "Error al conectar con el servidor"}
        </Alert>
      </Container>
    );
  }

  const categoriasSource = (() => {
    if (!categoriasRaw) return [];
    if (Array.isArray(categoriasRaw)) return categoriasRaw;
    if (Array.isArray(categoriasRaw.data)) return categoriasRaw.data;
    if (categoriasRaw.data && typeof categoriasRaw.data === "object")
      return [categoriasRaw.data];
    return [];
  })();

  // Mapear categorías intentando campos localizados
  const categorias = (categoriasSource || []).map((c, idx) => {
    const id = c.id_categoria ?? c.id ?? c.categoria_id ?? `cat-${idx}`;

    const nombreLocalizado =
      getLocalizedField(
        c,
        ["nombre", "name", "title", "titulo", "nombre_categoria"],
        locale,
      ) ||
      dict.libreria?.category_default_name ||
      `Categoría ${idx + 1}`;

    const descripcionLocalizada =
      getLocalizedField(c, ["descripcion", "desc", "description"], locale) ||
      "";

    return {
      id,
      nombre: nombreLocalizado,
      descripcion: descripcionLocalizada,
      raw: c,
    };
  });

  const productosSource = (() => {
    if (!productosRaw) return [];
    if (Array.isArray(productosRaw)) return productosRaw;
    if (Array.isArray(productosRaw.data)) return productosRaw.data;
    if (productosRaw.data && typeof productosRaw.data === "object")
      return [productosRaw.data];
    return [];
  })();

  // Mapear productos intentando campos localizados
  const libros = (productosSource || []).map((p, index) => {
    const id = p.id_producto ?? p.id ?? p.idProducto ?? `temp-id-${index}`;

    const tituloLocalizado =
      getLocalizedField(p, ["titulo", "title", "nombre", "name"], locale) ||
      dict.libreria?.untitled ||
      dict.book_labels?.no_title ||
      "Sin título";

    const autorLocalizado =
      getLocalizedField(
        p,
        ["autor", "author", "nombre_autor", "author_name"],
        locale,
      ) ||
      dict.book_labels?.unknown_author ||
      "Autor desconocido";

    return {
      id,
      titulo: tituloLocalizado,
      portada: p.imagen_url ?? p.portada ?? p.imagen ?? null,
      precio: p.precio ?? 0,
      autor: autorLocalizado,
      stock: p.stock ?? 0,
      raw: p,
    };
  });

  const seleccionarCategoria = (id) => {
    setCategoriaSeleccionada((prev) =>
      String(prev) === String(id) ? null : id,
    );
  };

  const abrirModalCompra = (libroId) => {
    setLibroIdSeleccionado(libroId);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setLibroIdSeleccionado(null);
  };

  const agregarAlCarrito = (libro) => {
    const addedTitle =
      dict.libreria?.added_to_cart_title ||
      dict.toasts?.added_title ||
      dict.toasts?.title ||
      "Añadido al carrito";

    const addedTextTemplate =
      dict.libreria?.added_to_cart_text ||
      dict.toasts?.added_text ||
      dict.libreria?.added_suffix ||
      dict.toasts?.default_added_text ||
      "{title} se ha añadido a tu carrito.";

    const addedText = addedTextTemplate.replace("{title}", libro.titulo);

    MySwal.fire({
      icon: "success",
      title: addedTitle,
      text: addedText,
      timer: 1500,
      showConfirmButton: false,
    });
    cerrarModal();
  };

  const verDetalle = (id) => {
    router.push(`/${locale}/libro/${id}`);
  };

  // Moneda por locale (ajusta a tus necesidades)
  const currency = locale === "en-US" ? "USD" : "EUR";
  const formatCurrency = (value) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      value,
    );

  return (
    <>
      <Container className="mb-5">
        <Row>
          <Col md={3} className="mb-4">
            <h5 className="fw-bold mb-3">
              {dict.libreria?.categories_title || "Categorías"}
            </h5>

            {categorias.length === 0 ? (
              <Alert variant="info">
                {dict.libreria?.no_categories ||
                  "No hay categorías disponibles."}
              </Alert>
            ) : (
              <ListGroup className="shadow-sm">
                <ListGroup.Item
                  action
                  active={categoriaSeleccionada === null}
                  onClick={() => setCategoriaSeleccionada(null)}
                  className="d-flex justify-content-between align-items-center"
                >
                  {dict.libreria?.all_categories || "Todas las categorías"}
                </ListGroup.Item>

                {categorias.map((cat) => (
                  <ListGroup.Item
                    key={cat.id}
                    action
                    active={String(categoriaSeleccionada) === String(cat.id)}
                    onClick={() => seleccionarCategoria(cat.id)}
                  >
                    {cat.nombre}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Col>

          <Col md={9}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold mb-0">
                {categoriaSeleccionada
                  ? (categorias.find(
                      (c) => String(c.id) === String(categoriaSeleccionada),
                    )?.nombre ??
                    (dict.libreria?.books_title || "Libros"))
                  : dict.libreria?.all_books_title || "Todos los Libros"}
              </h3>
              <span className="text-muted">
                {dict.libreria?.results_text
                  ? dict.libreria?.results_text.replace(
                      "{count}",
                      String(libros.length),
                    )
                  : `${libros.length} ${libros.length === 1 ? dict.libreria?.result_singular || "resultado" : dict.libreria?.result_plural || "resultados"}`}
              </span>
            </div>

            {libros.length === 0 ? (
              <Alert variant="info">
                {dict.libreria?.no_books ||
                  "No hay libros para esta categoría."}
              </Alert>
            ) : (
              <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                {libros.map((libro) => (
                  <Col key={libro.id}>
                    <Card className="h-100 shadow-sm border-0">
                      {libro.portada && (
                        <Card.Img
                          variant="top"
                          src={libro.portada}
                          alt={libro.titulo}
                          className="libreria__libro-portada"
                          onClick={() => verDetalle(libro.id)}
                        />
                      )}
                      <Card.Body className="d-flex flex-column">
                        <Card.Title
                          className="h6 fw-bold text-truncate"
                          title={libro.titulo}
                        >
                          {libro.titulo}
                        </Card.Title>
                        <Card.Text className="small text-muted mb-2 text-truncate">
                          {libro.autor}
                        </Card.Text>

                        <div className="mt-auto">
                          <p className="fw-bold mb-2 text-primary">
                            {formatCurrency(Number(libro.precio))}
                          </p>
                          <div className="d-grid gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => verDetalle(libro.id)}
                            >
                              {dict.libreria?.view_detail_btn ||
                                dict.buttons?.view_detail ||
                                "Ver detalle"}
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => abrirModalCompra(libro.id)}
                            >
                              {dict.libreria?.buy_btn ||
                                dict.buttons?.buy ||
                                "Comprar"}
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      </Container>

      <Modal show={showModal} onHide={cerrarModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {dict.libreria?.modal_buy_title || "Comprar"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {libroIdSeleccionado && (
            <VistaLibro
              id={libroIdSeleccionado}
              modoCompleto={false}
              onAgregarCarrito={agregarAlCarrito}
              dict={dict}
              locale={locale}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
