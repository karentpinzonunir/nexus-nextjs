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

  const {
    data: categorias,
    cargando: cargandoCats,
    error: errorCats,
  } = useFetch(
    "https://mock.apidog.com/m1/1188124-1182752-default/api/categorias"
  );

  const urlLibros = categoriaSeleccionada
    ? `https://mock.apidog.com/m1/1188124-1182752-default/api/libros?categoriaId=${categoriaSeleccionada}`
    : "https://mock.apidog.com/m1/1188124-1182752-default/api/libros";

  const {
    data: libros,
    cargando: cargandoLibros,
    error: errorLibros,
  } = useFetch(urlLibros);

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

  if (cargandoLibros || cargandoCats) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (errorLibros) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{errorLibros}</Alert>
      </Container>
    );
  }

  return (
    <>
      <Container className="mb-5">
        <Row>
          <Col md={3} className="mb-4">
            <h5 className="fw-bold mb-3">Categorías</h5>
            <ListGroup className="shadow-sm">
              <ListGroup.Item
                action
                active={categoriaSeleccionada === null}
                onClick={() => setCategoriaSeleccionada(null)}
                className="d-flex justify-content-between align-items-center"
              >
                Todas las categorías
              </ListGroup.Item>

              {categorias?.map((cat) => (
                <ListGroup.Item
                  key={cat.id}
                  action
                  active={categoriaSeleccionada === cat.id}
                  onClick={() => setCategoriaSeleccionada(cat.id)}
                >
                  {cat.nombre}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>

          <Col md={9}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold mb-0">
                {categoriaSeleccionada
                  ? categorias?.find((c) => c.id === categoriaSeleccionada)
                      ?.nombre || "Libros"
                  : "Todos los Libros"}
              </h3>
              <span className="text-muted">
                {libros?.length ?? 0} resultado
                {(libros?.length || 0) === 1 ? "" : "s"}
              </span>
            </div>

            {(!libros || libros.length === 0) && (
              <Alert variant="info">No hay libros para esta categoría.</Alert>
            )}

            <Row xs={1} sm={2} md={3} lg={4} className="g-4">
              {libros?.map((libro) => (
                <Col key={libro.id}>
                  <Card className="h-100 shadow-sm">
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
                      {libro.autor && (
                        <Card.Text className="small text-muted mb-2 text-truncate">
                          {libro.autor}
                        </Card.Text>
                      )}

                      <div className="mt-auto">
                        {libro.precio && (
                          <p className="fw-bold mb-2 text-primary">
                            {Number(libro.precio).toLocaleString("es-ES", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </p>
                        )}
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
