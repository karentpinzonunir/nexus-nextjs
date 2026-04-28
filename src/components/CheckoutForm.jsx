import { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import MySwal from "../utils/swal";

const CheckoutForm = ({ totalPrecio, onPagoExitoso }) => {
  const [form, setForm] = useState({
    titular: "",
    tarjeta: "",
    exp: "",
    cvv: "",
    direccion: "",
  });

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const pagar = async (e) => {
    e.preventDefault();

    if (!form.titular || !form.tarjeta || !form.exp || !form.cvv) {
      await MySwal.fire({
        icon: "warning",
        title: "Faltan datos",
        text: "Completa los campos obligatorios para continuar.",
      });
      return;
    }

    await MySwal.fire({
      icon: "success",
      title: "Pago aprobado",
      text: `Se procesó el pago por ${totalPrecio.toLocaleString("es-ES", {
        style: "currency",
        currency: "EUR",
      })}.`,
      confirmButtonText: "Aceptar",
    });

    onPagoExitoso?.();
  };

  return (
    <Form onSubmit={pagar} className="mt-3">
      <h5 className="mb-3">Datos de pago</h5>

      <Form.Group className="mb-3">
        <Form.Label>Titular</Form.Label>
        <Form.Control
          name="titular"
          value={form.titular}
          onChange={onChange}
          placeholder="Nombre como aparece en la tarjeta"
          required
        />
      </Form.Group>

      <Row>
        <Col md={8}>
          <Form.Group className="mb-3">
            <Form.Label>Número de tarjeta</Form.Label>
            <Form.Control
              name="tarjeta"
              value={form.tarjeta}
              onChange={onChange}
              placeholder="4111111111111111"
              inputMode="numeric"
              required
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>Exp</Form.Label>
            <Form.Control
              name="exp"
              value={form.exp}
              onChange={onChange}
              placeholder="MM/AA"
              required
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>CVV</Form.Label>
            <Form.Control
              name="cvv"
              value={form.cvv}
              onChange={onChange}
              placeholder="123"
              inputMode="numeric"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Dirección (opcional)</Form.Label>
        <Form.Control
          name="direccion"
          value={form.direccion}
          onChange={onChange}
          placeholder="Calle, número, ciudad"
        />
      </Form.Group>

      <Button type="submit" variant="success" size="lg" className="w-100">
        Pagar ahora
      </Button>
    </Form>
  );
};

export default CheckoutForm;