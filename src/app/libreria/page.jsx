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

export default function LibreriaPage() {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [libroIdSeleccionado, setLibroIdSeleccionado] = useState(null);
  const router = useRouter();

  // 1) Cargamos categorías desde tu API
  const {
    data: categoriasRaw,
    cargando: cargandoCats,
    error: errorCats,
  } = useFetch("/api/categorias");

  // 2) Construimos la URL de productos (tipo LIBRO), usando la categoría seleccionada si existe
  const urlProductos = categoriaSeleccionada
    ? `/api/productos?categoria=${encodeURIComponent(categoriaSeleccionada)}`
    : `/api/productos`;

  const {
    data: productosRaw,
    cargando: cargandoProductos,
    error: errorProductos,
  } = useFetch(urlProductos);

  // Estado global de carga: mostramos spinner mientras haya requests en curso
  // o mientras aún no tengamos respuestas (defensivo)
  const isLoading =
    cargandoCats ||
    cargandoProductos ||
    (
      (categoriasRaw === undefined || categoriasRaw === null) &&
      (productosRaw === undefined || productosRaw === null) &&
      !errorCats &&
      !errorProductos
    );

  // Mostrar spinner mientras cargan
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // Mostrar errores si existen y ya no estamos cargando
  if (errorProductos || errorCats) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {errorProductos || errorCats || "Error al conectar con el servidor"}
        </Alert>
      </Container>
    );
  }

  // Acomodamos categorías (soporta array, { data: [...] }, o { data: { ... } })
  const categoriasSource = (() => {
    if (!categoriasRaw) return [];
    if (Array.isArray(categoriasRaw)) return categoriasRaw;
    if (Array.isArray(categoriasRaw.data)) return categoriasRaw.data;
    // Si viniera un objeto con campos de categoría individual
    if (categoriasRaw.data && typeof categoriasRaw.data === "object") return [categoriasRaw.data];
    return [];
  })();

  // Normalizamos categorías: garantizamos `id` y `nombre`
  const categorias = (categoriasSource || []).map((c, idx) => ({
    id: c.id_categoria ?? c.id ?? c.categoria_id ?? `cat-${idx}`,
    nombre: c.nombre ?? c.nombre_categoria ?? c.name ?? `Categoría ${idx + 1}`,
    descripcion: c.descripcion ?? c.desc ?? "",
    raw: c,
  }));

  // Acomodamos productos si vienen como array, { data: [...] } o { data: { ... } }
  const productosSource = (() => {
    if (!productosRaw) return [];
    if (Array.isArray(productosRaw)) return productosRaw;
    if (Array.isArray(productosRaw.data)) return productosRaw.data;
    if (productosRaw.data && typeof productosRaw.data === "object") return [productosRaw.data];
    return [];
  })();

  // 3) Normalización de productos para la UI (aseguramos id único, título, imagen, precio, autor)
  const libros = (productosSource || []).map((p, index) => ({
    id: p.id_producto ?? p.id ?? p.idProducto ?? `temp-id-${index}`,
    titulo: p.titulo ?? p.nombre ?? "Sin título",
    portada: p.imagen_url ?? p.portada ?? p.imagen ?? null,
    precio: p.precio ?? 0,
    autor: p.autor ?? p.nombre_autor ?? "Autor desconocido",
    stock: p.stock ?? 0,
    raw: p,
  }));

  // Toggle: si clicas la misma categoría, limpiamos la selección
  const seleccionarCategoria = (id) => {
    setCategoriaSeleccionada((prev) => (String(prev) === String(id) ? null : id));
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
    MySwal.fire({
      icon: "success",
      title: "Añadido al carrito",
      text: `${libro.titulo} se ha añadido a tu carrito.`,
      timer: 1500,
      showConfirmButton: false,
    });
    cerrarModal();
  };

  const verDetalle = (id) => {
    router.push(`/libro/${id}`);
  };

  return (
    <>
      <Container className="mb-5">
        <Row>
          {/* Columna de Categorías */}
          <Col md={3} className="mb-4">
            <h5 className="fw-bold mb-3">Categorías</h5>

            {categorias.length === 0 ? (
              <Alert variant="info">No hay categorías disponibles.</Alert>
            ) : (
              <ListGroup className="shadow-sm">
                <ListGroup.Item
                  action
                  active={categoriaSeleccionada === null}
                  onClick={() => setCategoriaSeleccionada(null)}
                  className="d-flex justify-content-between align-items-center"
                >
                  Todas las categorías
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

          {/* Columna de Libros */}
          <Col md={9}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold mb-0">
                {categoriaSeleccionada
                  ? categorias.find((c) => String(c.id) === String(categoriaSeleccionada))
                    ?.nombre ?? "Libros"
                  : "Todos los Libros"}
              </h3>
              <span className="text-muted">
                {libros.length} resultado{libros.length === 1 ? "" : "s"}
              </span>
            </div>

            {libros.length === 0 ? (
              <Alert variant="info">No hay libros para esta categoría.</Alert>
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
                            {Number(libro.precio).toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                            })}
                          </p>
                          <div className="d-grid gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => verDetalle(libro.id)}
                            >
                              Ver detalle
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => abrirModalCompra(libro.id)}
                            >
                              Comprar
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
          <Modal.Title>Comprar</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {libroIdSeleccionado && (
            <VistaLibro
              id={libroIdSeleccionado}
              modoCompleto={false}
              onAgregarCarrito={agregarAlCarrito}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}