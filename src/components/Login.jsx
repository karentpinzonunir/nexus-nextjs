// src/components/Login.jsx
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import useLogin from "@/hooks/useLogin";

export default function Login({ closeModal, dict = {}, locale = "es-ES" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login: loginContext } = useAuth();

  const { login, cargando, error } = useLogin();

  const d = dict.login || {};

  const iniciarSesion = async (e) => {
    e.preventDefault();

    // Validación mínima (puedes extender)
    if (!email || !password) {
      // Puedes usar MySwal si prefieres un modal en vez de alerta inline
      return;
    }

    try {
      const result = await login(email, password);
      if (result) {
        loginContext(result);
        if (typeof closeModal === "function") closeModal();
      }
    } catch (err) {
      // useLogin ya expone `error`; aquí no re-lanzamos
      // console.error("login error", err);
    }
  };

  return (
    <>
      <Form onSubmit={iniciarSesion}>
        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label>{d.email_label || "Email"}</Form.Label>
          <Form.Control
            type="email"
            placeholder={d.email_placeholder || "Ingresa tu email"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formPassword">
          <Form.Label>{d.password_label || "Contraseña"}</Form.Label>
          <Form.Control
            type="password"
            placeholder={d.password_placeholder || "Ingresa tu contraseña"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          className="w-100"
          disabled={cargando}
          aria-disabled={cargando}
        >
          {cargando ? (
            <>
              <Spinner
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />{" "}
              {d.logging_in || "Iniciando sesión..."}
            </>
          ) : (
            d.submit_button || "Entrar"
          )}
        </Button>
      </Form>

      {error && (
        <Alert className="mt-3" variant="danger">
          {typeof error === "string"
            ? error
            : d.error_generic || "Error al iniciar sesión"}
        </Alert>
      )}
    </>
  );
}
