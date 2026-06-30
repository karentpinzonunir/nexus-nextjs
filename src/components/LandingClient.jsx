// src/components/LandingClient.jsx
"use client";

import React, { useState } from "react";
import { Row, Col, Card, Button, Modal, Spinner, Alert } from "react-bootstrap";
import { useRouter } from "next/navigation";
import VistaLibro from "@/components/VistaLibro";
import MySwal from "@/utils/swal";
import "@/css/Landing.css";

export default function LandingClient({ initialLibros = [] }) {
    const [libros] = useState(initialLibros);
    const [showModal, setShowModal] = useState(false);
    const [libroIdSeleccionado, setLibroIdSeleccionado] = useState(null);
    const [loadingExtra, setLoadingExtra] = useState(false); // por si quieres llamadas extra
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
        MySwal.fire({
            icon: "success",
            title: "Añadido al carrito",
            text: `${libro.titulo} se ha añadido a tu carrito.`,
        });
        cerrarModal();
    };

    const verDetalle = (id) => router.push(`/libro/${id}`);

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

    return (
        <>
            <div className="banner mb-4 text-center">
                <picture>
                    <source srcSet="/assets/banner-desktop.png" media="(min-width: 386px)" />
                    <img src="/assets/banner-mobile.png" alt="Banner" className="img-fluid" />
                </picture>
            </div>

            <h2 className="my-4 text-center">Top 10 libros más vendidos</h2>

            {(!libros || libros.length === 0) && (
                <Alert variant="info" className="text-center">
                    No hay datos de ventas disponibles.
                </Alert>
            )}

            {libros && libros.length > 0 && (
                <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 g-4">
                    {libros.map((libro) => (
                        <Col key={libro.id ?? libro.raw?.id_producto} className="d-flex">
                            <Card className="h-100 shadow-sm w-100">
                                <div style={{ cursor: "pointer" }} onClick={() => verDetalle(libro.id)}>
                                    <Card.Img
                                        variant="top"
                                        src={libro.portada || "/placeholder.png"}
                                        alt={libro.titulo}
                                        className="landing__libro-portada"
                                        onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                                    />
                                </div>

                                <Card.Body className="d-flex flex-column">
                                    <Card.Title className="fs-6 text-truncate" title={libro.titulo}>
                                        {libro.titulo}
                                    </Card.Title>

                                    {libro.autor && (
                                        <Card.Subtitle className="mb-2 text-muted small">{libro.autor}</Card.Subtitle>
                                    )}

                                    <div className="mt-auto">
                                        {typeof libro.total_vendido !== "undefined" && (
                                            <p className="mb-2 small text-secondary">
                                                Vendidos: <strong>{libro.total_vendido}</strong>
                                            </p>
                                        )}

                                        <div className="d-grid gap-2">
                                            <Button variant="outline-primary" size="sm" onClick={() => verDetalle(libro.id)}>
                                                Ver detalle
                                            </Button>
                                            <Button variant="success" size="sm" onClick={() => abrirModalCompra(libro.id)}>
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
                        <VistaLibro id={libroIdSeleccionado} modoCompleto={false} onAgregarCarrito={agregarAlCarrito} />
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}