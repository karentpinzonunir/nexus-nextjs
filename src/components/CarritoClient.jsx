// src/components/CarritoClient.jsx
"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  ListGroup,
  Alert,
  Modal,
  Spinner,
} from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/context/CarritoContext";
import { useAuth } from "@/context/AuthContext";
import { useCompras } from "@/context/ComprasContext";
import Login from "@/components/Login";
import CheckoutForm from "@/components/CheckoutForm";
import MySwal from "@/utils/swal";

const currencyByLocale = {
  "en-US": "USD",
  "es-ES": "EUR",
  "fr-FR": "EUR",
  "it-IT": "EUR",
  "de-DE": "EUR",
};

export default function CarritoClient({ locale = "es-ES", dict = {} }) {
  const { usuario } = useAuth();
  const {
    itemsCarrito,
    eliminarDelCarrito,
    actualizarCantidad,
    vaciarCarrito,
    totalPrecio,
  } = useCarrito();
  const { agregarCompra } = useCompras();
  const router = useRouter();

  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [checkoutPendiente, setCheckoutPendiente] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);

  const onProcederPago = async () => {
    if (!usuario) {
      setCheckoutPendiente(true);
      const res = await MySwal.fire({
        icon: "info",
        title: dict.cart?.login_to_pay || "Inicia sesión para pagar",
        text:
          dict.cart?.need_account ||
          "Necesitas una cuenta para procesar tu pedido.",
        confirmButtonText: dict.menu?.login || "Iniciar sesión",
        showCancelButton: true,
        cancelButtonText: dict.buttons?.cancel || "Cancelar",
      });

      if (res.isConfirmed) setMostrarLogin(true);
      return;
    }
    setMostrarPago(true);
  };

  useEffect(() => {
    if (usuario && checkoutPendiente) {
      setMostrarLogin(false);
      setCheckoutPendiente(false);
      setMostrarPago(true);
    }
  }, [usuario, checkoutPendiente]);

  const onPagoExitoso = async () => {
    try {
      setProcesandoPago(true);

      const promesas = itemsCarrito.map((item) =>
        fetch("/api/compras", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: usuario.id,
            libroId: item.id,
            cantidad: item.cantidad,
          }),
        }),
      );

      const resultados = await Promise.all(promesas);
      const algunError = resultados.some((res) => !res.ok);
      if (algunError) {
        const errores = await Promise.all(
          resultados.map(async (res) => {
            if (res.ok) return null;
            try {
              const json = await res.json().catch(() => null);
              return json?.error || json?.message || `Status ${res.status}`;
            } catch {
              return `Status ${res.status}`;
            }
          }),
        );
        const mensaje =
          errores.filter(Boolean).join("; ") ||
          dict.cart?.some_orders_error ||
          "Error en alguno de los pedidos";
        throw new Error(mensaje);
      }

      agregarCompra(itemsCarrito, usuario.id);
      vaciarCarrito();
      setMostrarPago(false);
      setProcesandoPago(false);

      await MySwal.fire({
        icon: "success",
        title: dict.cart?.purchase_success_title || "¡Compra exitosa!",
        text:
          dict.cart?.purchase_success_text ||
          "Tu pedido ha sido procesado correctamente.",
        confirmButtonText: dict.cart?.view_purchases || "Ver mis compras",
      });

      router.push(`/${locale}/mis-compras`);
    } catch (error) {
      setProcesandoPago(false);
      await MySwal.fire({
        icon: "error",
        title: dict.cart?.payment_error_title || "Error en el pago",
        text:
          error?.message ||
          dict.cart?.payment_error_text ||
          "Hubo un error procesando la compra.",
      });
    }
  };

  const isLoading = itemsCarrito === undefined || itemsCarrito === null;
  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (!itemsCarrito || itemsCarrito.length === 0) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="info">
          <h4>{dict.cart?.empty_title || "Tu carrito está vacío"}</h4>
          <p>
            {dict.cart?.empty_text ||
              "Explora nuestra librería y añade libros a tu carrito."}
          </p>
          <Button as={Link} href={`/${locale}`} variant="primary">
            {dict.cart?.shop_btn || "Ir a la tienda"}
          </Button>
        </Alert>
      </Container>
    );
  }

  const totalFinal = Number.isFinite(Number(totalPrecio))
    ? Number(totalPrecio)
    : 0;
  const currency = currencyByLocale[locale] ?? "USD";
  const formatCurrency = (value) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      value,
    );

  return (
    <>
      <Container className="mt-4">
        <h2 className="mb-4">{dict.cart?.title || "Mi Carrito de Compras"}</h2>
        <Row>
          <Col md={8}>
            <ListGroup variant="flush" className="shadow-sm rounded">
              {itemsCarrito.map((item, idx) => {
                const key = item.id ?? `item-${idx}`;
                const autor =
                  item.autor ??
                  item.author ??
                  (dict.book_labels?.unknown_author || "Autor desconocido");
                return (
                  <ListGroup.Item key={key} className="py-3">
                    <Row className="align-items-center">
                      <Col xs={3} md={2}>
                        <img
                          src={item.portada || "/placeholder.png"}
                          alt={item.titulo}
                          className="img-fluid rounded"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.png";
                          }}
                        />
                      </Col>
                      <Col xs={9} md={4}>
                        <h6 className="mb-0">{item.titulo}</h6>
                        <small className="text-muted">{autor}</small>
                      </Col>
                      <Col xs={4} md={2} className="text-center fw-bold">
                        {formatCurrency(Number(item.precio || 0))}
                      </Col>
                      <Col xs={4} md={2} className="text-center">
                        <div className="d-flex align-items-center justify-content-center border rounded">
                          <Button
                            size="sm"
                            variant="link"
                            className="text-decoration-none"
                            onClick={() =>
                              actualizarCantidad(
                                item.id,
                                Math.max(1, item.cantidad - 1),
                              )
                            }
                          >
                            -
                          </Button>
                          <span className="mx-2">{item.cantidad}</span>
                          <Button
                            size="sm"
                            variant="link"
                            className="text-decoration-none"
                            onClick={() =>
                              actualizarCantidad(item.id, item.cantidad + 1)
                            }
                          >
                            +
                          </Button>
                        </div>
                      </Col>
                      <Col xs={4} md={2} className="text-center">
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => eliminarDelCarrito(item.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
            <Button
              variant="link"
              className="text-danger mt-3 p-0"
              onClick={vaciarCarrito}
            >
              {dict.cart?.empty_cart_btn || "Vaciar Carrito"}
            </Button>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title className="mb-4">
                  {dict.cart?.summary_title || "Resumen del Pedido"}
                </Card.Title>
                <div className="d-flex justify-content-between mb-2">
                  <span>{dict.cart?.subtotal_label || "Subtotal:"}</span>
                  <span>{formatCurrency(totalFinal)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <span className="h5">
                    {dict.cart?.total_label || "Total:"}
                  </span>
                  <span className="h5 text-success fw-bold">
                    {formatCurrency(totalFinal)}
                  </span>
                </div>
                <Button
                  variant="success"
                  size="lg"
                  className="w-100"
                  onClick={onProcederPago}
                >
                  {dict.cart?.checkout_btn || "Proceder al Pago"}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal
        show={mostrarLogin}
        onHide={() => {
          setMostrarLogin(false);
          setCheckoutPendiente(false);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{dict.login?.title || "Iniciar Sesión"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Login
            closeModal={() => setMostrarLogin(false)}
            dict={dict}
            locale={locale}
          />
        </Modal.Body>
      </Modal>

      <Modal
        show={mostrarPago}
        onHide={() => setMostrarPago(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {dict.cart?.checkout_title || "Finalizar Compra"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="mb-4 p-3 bg-light rounded d-flex justify-content-between align-items-center">
            <span>{dict.cart?.amount_to_pay || "Monto total a pagar:"}</span>
            <span className="h4 mb-0 text-success fw-bold">
              {formatCurrency(totalFinal)}
            </span>
          </div>

          {procesandoPago ? (
            <div className="text-center my-4">
              <Spinner animation="border" />
              <div className="mt-2 text-muted">
                {dict.cart?.processing_payment || "Procesando pago..."}
              </div>
            </div>
          ) : (
            <CheckoutForm
              totalPrecio={totalFinal}
              onPagoExitoso={onPagoExitoso}
              dict={dict}
              locale={locale}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
