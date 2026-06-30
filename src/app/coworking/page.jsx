"use client";

import React from "react";
import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/useFetch";
import "@/css/Coworking.css";

const Coworking = () => {
  // Cambiamos a tu API interna
  const {
    data: dataRaw,
    cargando,
    error,
  } = useFetch("/api/espacios");

  const router = useRouter();

  // Normalizar datos de la API (id_espacio -> id, etc.)
  const espaciosOriginales = Array.isArray(dataRaw) ? dataRaw : dataRaw?.data ?? [];

  const espacios = espaciosOriginales.map(esp => ({
    id: esp.id_espacio ?? esp.id,
    nombre: esp.nombre,
    capacidad: esp.capacidad,
    precio: esp.precio_hora ?? esp.precio
  }));

  const irADetalle = (id) => {
    router.push(`/coworking/${id}`);
  };

  // Lógica de distribución: 2 arriba (col-6), 4 centro (col-3), 2 final (col-6)
  const obtenerAnchoColumna = (index) => {
    // index 0 y 1 (Los primeros 2) -> col-6 para que queden 2 arriba
    if (index < 2) return 6;
    // index 2, 3, 4, 5 (Los siguientes 4) -> col-3 para que queden 4 al centro
    if (index >= 2 && index < 6) return 3;
    // index 6 y 7 (Los últimos 2) -> col-6 para que queden 2 al final
    return 6;
  };

  if (cargando) {
    return (
      <div className="d-flex justify-content-center my-5" role="status">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger" className="text-center">{error}</Alert>
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
          {espacios.map((espacio, index) => (
            <Col
              key={espacio.id}
              xs={obtenerAnchoColumna(index)} // Distribución específica en pantallas medianas/grandes
            >
              <Card
                className="h-100 shadow-sm border-0 coworking__espacio-card coworking__espacio-card--interactivo"
                onClick={() => irADetalle(espacio.id)}
                style={{ cursor: "pointer", transition: "transform 0.2s" }}
              >
                <Card.Body className="d-flex flex-column justify-content-center text-center p-3">
                  <h5 className="fw-bold mb-2">{espacio.nombre}</h5>

                  {espacio.capacidad > 0 && (
                    <div className="small text-muted">
                      <i className="bi bi-people-fill text-primary me-1" />
                      Capacidad: {espacio.capacidad} pers.
                    </div>
                  )}

                  <div className="mt-2 fw-bold text-success small">
                    {Number(espacio.precio).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} / hr
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </>
  );
};

export default Coworking;