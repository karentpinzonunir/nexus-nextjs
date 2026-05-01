'use client';
import React from "react";
import { Spinner, Alert, Row, Col, Button } from "react-bootstrap";
import useFetch from "../hooks/useFetch";
import { useCarrito } from "../context/CarritoContext";
import MySwal from "../utils/swal";
import "../css/VistaLibro.css";

const VistaLibro = ({ id, modoCompleto = false, onAgregarCarrito }) => {
  const { agregarAlCarrito } = useCarrito();

  const {
    data: libro,
    cargando: cargandoLibro,
    error: errorLibro,
  } = useFetch(
    `https://mock.apidog.com/m1/1188124-1182752-default/api/libros/${id}`
  );

  const {
    data: categorias,
    cargando: cargandoCats,
    error: errorCats,
  } = useFetch(
    `https://mock.apidog.com/m1/1188124-1182752-default/api/categorias`
  );
  

  if (cargandoLibro || cargandoCats) {
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

  if (!libro || libro.length === 0) {
    return <Alert variant="warning">No se encontró el libro</Alert>;
  }

  const libroData = libro[0];
  const categoriaEncontrada = categorias?.find(
    (cat) => cat.id === libroData.categoriaId
  );
  const nombreCategoria = categoriaEncontrada
    ? categoriaEncontrada.nombre
    : "Sin categoría";

  const manejarAgregarCarrito = () => {
    agregarAlCarrito(libroData);

    MySwal.fire({
      icon: "success",
      title: "Añadido al carrito",
      text: `${libroData.titulo} se ha añadido a tu carrito de compras.`,
      confirmButtonText: "Aceptar",
      timer: 2000,
      timerProgressBar: true,
    });

    if (onAgregarCarrito) {
      onAgregarCarrito(libroData);
    }
  };

  return (
    <Row>
      <Col md={4} className="mb-4">
        {libroData.portada && (
          <img
            src={libroData.portada}
            alt={libroData.titulo}
            className={`img-fluid rounded detalle-libro__portada ${
              modoCompleto ? "detalle-libro__portada--completo" : ""
            }`}
          />
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
              <strong>Categoría:</strong> {nombreCategoria}
            </p>
            <p className="mb-1">
              <strong>Tipo:</strong> {libroData.tipo}
            </p>
            <p className="mb-1">
              <strong>Año:</strong> {libroData.year}
            </p>
            <p className="mb-1">
              <strong>Editorial:</strong> {libroData.editorial}
            </p>
            <p className="mb-0">
              <strong>Stock disponible:</strong> {libroData.stock} unidades
            </p>
          </div>
        )}

        {libroData.precio && (
          <h4 className="mt-3 text-success fw-bold">
            {Number(libroData.precio).toLocaleString("es-ES", {
              style: "currency",
              currency: "EUR",
            })}
          </h4>
        )}

        <Button
          variant="success"
          size={modoCompleto ? "lg" : "md"}
          className="mt-3 px-4"
          onClick={manejarAgregarCarrito}
        >
          Añadir al carrito
        </Button>
      </Col>
    </Row>
  );
};

export default VistaLibro;
