// src/components/CheckoutForm.jsx
"use client";

import React, { useState } from "react";
import { Form, Button, Row, Col, Spinner } from "react-bootstrap";
import MySwal from "../utils/swal";

const currencyByLocale = {
  "en-US": "USD",
  "es-ES": "EUR",
  "fr-FR": "EUR",
  "it-IT": "EUR",
  "de-DE": "EUR",
};

export default function CheckoutForm({
  totalPrecio = 0,
  onPagoExitoso,
  dict = {},
  locale = "es-ES",
  isSubmitting = false,
}) {
  const [form, setForm] = useState({
    titular: "",
    tarjeta: "",
    exp: "",
    cvv: "",
    direccion: "",
  });

  const d = dict.checkout || {};

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyByLocale[locale] || "EUR",
    }).format(value);

  const pagar = async (e) => {
    e.preventDefault();

    if (!form.titular || !form.tarjeta || !form.exp || !form.cvv) {
      await MySwal.fire({
        icon: "warning",
        title: d.missing_fields_title || "Faltan datos",
        text:
          d.missing_fields_text ||
          "Completa los campos obligatorios para continuar.",
      });
      return;
    }

    await MySwal.fire({
      icon: "success",
      title: d.payment_success_title || "Pago aprobado",
      text:
        (d.payment_success_text &&
          d.payment_success_text.replace(
            "{amount}",
            formatCurrency(totalPrecio),
          )) ||
        `Se procesó el pago por ${formatCurrency(totalPrecio)}.`,
      confirmButtonText: d.accept_button || "Aceptar",
    });

    onPagoExitoso?.();
  };

  return (
    <Form onSubmit={pagar} className="mt-3">
      <h5 className="mb-3">{d.title || "Datos de pago"}</h5>

      <Form.Group className="mb-3">
        <Form.Label>{d.name_label || "Titular"}</Form.Label>
        <Form.Control
          name="titular"
          value={form.titular}
          onChange={onChange}
          placeholder={
            d.name_placeholder || "Nombre como aparece en la tarjeta"
          }
          required
        />
      </Form.Group>

      <Row>
        <Col md={8}>
          <Form.Group className="mb-3">
            <Form.Label>{d.card_label || "Número de tarjeta"}</Form.Label>
            <Form.Control
              name="tarjeta"
              value={form.tarjeta}
              onChange={onChange}
              placeholder={d.card_placeholder || "4111111111111111"}
              inputMode="numeric"
              required
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>{d.exp_label || "Exp"}</Form.Label>
            <Form.Control
              name="exp"
              value={form.exp}
              onChange={onChange}
              placeholder={d.exp_placeholder || "MM/AA"}
              required
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>{d.cvv_label || "CVV"}</Form.Label>
            <Form.Control
              name="cvv"
              value={form.cvv}
              onChange={onChange}
              placeholder={d.cvv_placeholder || "123"}
              inputMode="numeric"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>{d.address_label || "Dirección (opcional)"}</Form.Label>
        <Form.Control
          name="direccion"
          value={form.direccion}
          onChange={onChange}
          placeholder={d.address_placeholder || "Calle, número, ciudad"}
        />
      </Form.Group>

      <Button
        type="submit"
        variant="success"
        size="lg"
        className="w-100"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />{" "}
            {d.processing_button || "Procesando..."}
          </>
        ) : (
          d.pay_button || "Pagar ahora"
        )}
      </Button>
    </Form>
  );
}
