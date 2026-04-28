"use client";

import React from "react";
import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/useFetch";
import "@/css/Coworking.css";

const Coworking = () => {
  const {
    data: espacios,
    cargando,
    error,
  } = useFetch(
    "https://mock.apidog.com/m1/1188124-1182752-default/api/espacios"
  );

  const router = useRouter();

  const irADetalle = (id) => {
    router.push(`/coworking/${id}`);
  };

  const obtenerAnchoColumna = (nombre) => {
    if (nombre === "Sala de Reuniones 1") return 6;
    if (nombre === "Sala de Reuniones 2") return 4;
    if (nombre === "Recepción") return 2;
    if (nombre.includes("Mesa")) return 2;
    if (nombre.includes("Cabina")) return 2;
    if (nombre.includes("Zona Compartida")) return 3;
    if (nombre === "Zona Lounge") return 6;
  };

  const esRecepcion = (nombre) => nombre === "Recepción";

  if (cargando) {
    return (
      <div
        className="d-flex justify-content-center my-5"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Spinner animation="border" variant="primary" />
        <span className="visually-hidden">Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <h2 className="mb-4 text-center">Espacios de Coworking</h2>
      <p>
        Explora nuestro mapa interactivo de espacios y encuentra el lugar ideal
        para tu productividad. Selecciona el espacio que mejor se adapte a tus
        necesidades en nuestra zona de estudio, salas de reuniones o áreas
        comunes para reservar el día y la hora que prefieras.
      </p>
      <div className="p-3 rounded-4 shadow-sm bg-info overflow-auto">
        <Row className="g-3 justify-content-center coworking__contenedor">
          {espacios?.map((espacio) => {
            const recepcion = esRecepcion(espacio.nombre);

            return (
              <Col key={espacio.id} xs={obtenerAnchoColumna(espacio.nombre)}>
                <Card
                  className={`h-100 shadow-sm border-0 coworking__espacio-card ${
                    !recepcion ? "coworking__espacio-card--interactivo" : ""
                  }`}
                  onClick={() => !recepcion && irADetalle(espacio.id)}
                >
                  <Card.Body className="d-flex flex-column justify-content-center text-center p-3">
                    <h5 className="fw-bold mb-2">{espacio.nombre}</h5>

                    <div className="small text-muted mb-2">
                      <i className="bi bi-geo-alt-fill text-danger me-1" />
                      {espacio.zona}
                    </div>

                    {espacio.capacidad > 0 && (
                      <div className="small text-muted">
                        <i className="bi bi-people-fill text-primary me-1" />
                        Capacidad: {espacio.capacidad}{" "}
                        {espacio.capacidad === 1 ? "persona" : "personas"}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </>
  );
};

export default Coworking;
