// src/components/LandingClient.jsx
"use client";

import React, { useState } from "react";
import { Row, Col, Card, Button, Modal, Spinner, Alert } from "react-bootstrap";
import { useRouter } from "next/navigation";
import VistaLibro from "@/components/VistaLibro";
import MySwal from "@/utils/swal";
import "@/css/Landing.css";

export default function LandingClient({
  initialLibros = [],
  locale = "es-ES",
  dict = {},
}) {
  const [libros] = useState(initialLibros);
  const [showModal, setShowModal] = useState(false);
  const [libroIdSeleccionado, setLibroIdSeleccionado] = useState(null);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [error, setError] = useState(null);

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
    const title = libro?.titulo ?? dict.book_labels?.no_title ?? "Sin título";

    // Preferimos claves específicas: primero libreria.*, luego toasts.*, luego botones genéricos
    const addedTitle =
      dict.libreria?.added_to_cart_title ||
      dict.toasts?.added_title ||
      dict.toasts?.title ||
      "Añadido al carrito";

    const addedTextTemplate =
      dict.libreria?.added_to_cart_text ||
      dict.toasts?.added_text ||
      dict.toasts?.default_added_text ||
      "{title} se ha añadido a tu carrito.";

    const addedText = addedTextTemplate.replace("{title}", title);

    MySwal.fire({
      icon: "success",
      title: addedTitle,
      text: addedText,
    });
    cerrarModal();
  };

  const verDetalle = (id) => router.push(`/${locale}/libro/${id}`);

  if (loadingExtra) {
    return (
      <div className="d-flex justify-content-center my-5" role="status">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-center my-4">
        {error}
      </Alert>
    );
  }

  const landingTitle =
    dict.landing?.title ||
    `Top ${libros?.length || 10} libros más vendidos` ||
    "Top 10 libros más vendidos";

  return (
    <>
      <h2 className="mb-4 text-center">{landingTitle}</h2>

      {(!libros || libros.length === 0) && (
        <Alert variant="info" className="text-center">
          {dict.landing?.no_sales || "No hay datos de ventas disponibles."}
        </Alert>
      )}

      {libros && libros.length > 0 && (
        <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 g-4">
          {libros.map((libro) => (
            <Col key={libro.id ?? libro.raw?.id_producto} className="d-flex">
              <Card className="h-100 shadow-sm w-100">
                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => verDetalle(libro.id)}
                >
                  <Card.Img
                    variant="top"
                    src={libro.portada || "/placeholder.png"}
                    alt={libro.titulo}
                    className="landing__libro-portada"
                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                  />
                </div>

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
                    {typeof libro.total_vendido !== "undefined" && (
                      <p className="mb-2 small text-secondary">
                        {(dict.book_labels?.sold_label &&
                          `${dict.book_labels.sold_label}: `) ||
                          (dict.libreria?.sold_label &&
                            `${dict.libreria.sold_label}: `) ||
                          "Vendidos: "}
                        <strong>{libro.total_vendido}</strong>
                      </p>
                    )}

                    <div className="d-grid gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => verDetalle(libro.id)}
                      >
                        {dict.libreria?.view_detail_btn ||
                          dict.buttons?.view_detail ||
                          dict.buttons?.view_detail_btn ||
                          "Ver detalle"}
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => abrirModalCompra(libro.id)}
                      >
                        {dict.libreria?.buy_btn ||
                          dict.buttons?.buy ||
                          dict.buttons?.buy_btn ||
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

      <Modal show={showModal} onHide={cerrarModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{dict.modal?.buy_title || "Comprar"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {libroIdSeleccionado && (
            <VistaLibro
              id={libroIdSeleccionado}
              modoCompleto={false}
              onAgregarCarrito={agregarAlCarrito}
              locale={locale}
              dict={dict}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
