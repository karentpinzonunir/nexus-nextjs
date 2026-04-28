"use client";

import React from "react";
import { useState } from "react";
import { Row, Col, Card, Spinner, Alert, Button, Modal } from "react-bootstrap";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/useFetch";
import VistaLibro from "@/components/VistaLibro";
import MySwal from "@/utils/swal";
import "@/css/Landing.css";

const bannerD = "/assets/banner-desktop.png";
const bannerM = "/assets/banner-mobile.png";

export default function LandingPage() {
  const {
    data: libros,
    cargando,
    error,
  } = useFetch(
    "https://mock.apidog.com/m1/1188124-1182752-default/api/libros/mas-vendidos"
  );

  const [showModal, setShowModal] = useState(false);
  const [libroIdSeleccionado, setLibroIdSeleccionado] = useState(null);
  const router = useRouter();

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
    });
    cerrarModal();
  };

  const verDetalle = (id) => {
    router.push(`/libro/${id}`);
  };

  return (
    <>
      {/* Banner */}
      <div className="banner mb-4">
        <picture>
          <source srcSet={bannerD} media="(min-width: 386px)" />
          <img src={bannerM} alt="Banner" className="img-fluid" />
        </picture>
      </div>
      <hr></hr>

      <h2 className="my-4 text-center">Top 10 libros más vendidos</h2>

      {cargando && (
        <div
          className="d-flex justify-content-center my-5"
          role="status"
        >
          <Spinner animation="border" variant="primary" />
          <span className="visually-hidden">Cargando...</span>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}

      {!cargando && !error && libros && (
        <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 g-4">
          {libros.map((libro) => (
            <Col key={libro.id}>
              <Card className="h-100 shadow-sm">
                {libro.portada && (
                  <Card.Img
                    variant="top"
                    src={libro.portada}
                    alt={libro.titulo}
                    className="landing__libro-portada"
                    onClick={() => verDetalle(libro.id)}
                  />
                )}
                <Card.Body className="d-flex flex-column">
                  <Card.Title
                    className="fs-6 text-truncate"
                    title={libro.titulo}
                  >
                    {libro.titulo}
                  </Card.Title>
                  {libro.autor && (
                    <Card.Subtitle className="mb-2 text-muted small">
                      {libro.autor}
                    </Card.Subtitle>
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
      )}

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