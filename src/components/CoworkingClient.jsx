// src/components/CoworkingClient.jsx
"use client";

import React from "react";
import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/useFetch";
import "@/css/Coworking.css";

const CoworkingClient = ({ locale = "es-ES", dict = {} }) => {
  // Mantenemos tu ruta original de API
  const { data: dataRaw, cargando, error } = useFetch("/api/espacios");

  const router = useRouter();

  // Lógica de mapeo exacta a la tuya
  const espaciosOriginales = Array.isArray(dataRaw)
    ? dataRaw
    : (dataRaw?.data ?? []);

  const espacios = espaciosOriginales.map((esp) => ({
    id: esp.id_espacio ?? esp.id,
    nombre: esp.nombre,
    capacidad: esp.capacidad,
    precio: esp.precio_hora ?? esp.precio,
  }));

  const irADetalle = (id) => {
    // Redirige al detalle manteniendo el idioma
    router.push(`/${locale}/coworking/${id}`);
  };

  const obtenerAnchoColumna = (index) => {
    if (index < 2) return 6;
    if (index >= 2 && index < 6) return 3;
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
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      </Container>
    );
  }

  // Configuración de moneda según locale
  const currency = locale === "en-US" ? "USD" : "EUR";
  const formatCurrency = (value) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      value,
    );

  // Extraemos los labels con fallbacks limpios para evitar errores de parsing
  const title = dict.coworking?.list_title ?? "Espacios de Coworking";
  const description =
    dict.coworking?.list_description ??
    "Explora nuestro mapa interactivo de espacios y encuentra el lugar ideal para tu productividad.";
  const capacityLabel = dict.coworking?.capacity_label ?? "Capacidad:";
  const personsShort = dict.coworking?.persons_short ?? "pers.";
  const hourShort = dict.coworking?.hour_short ?? "hr";

  return (
    <>
      <h2 className="mb-4 text-center">{title}</h2>
      <p>{description}</p>
      <div className="p-3 rounded-4 shadow-sm bg-info overflow-auto">
        <Row className="g-3 justify-content-center coworking__contenedor">
          {espacios.map((espacio, index) => (
            <Col
              key={espacio.id}
              xs={obtenerAnchoColumna(index)}
              md={obtenerAnchoColumna(index)}
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
                      {capacityLabel} {espacio.capacidad} {personsShort}
                    </div>
                  )}

                  <div className="mt-2 fw-bold text-success small">
                    {formatCurrency(Number(espacio.precio))} / {hourShort}
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

export default CoworkingClient;
