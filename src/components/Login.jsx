"use client";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import useLogin from "../hooks/useLogin";

const Login = ({ closeModal }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login: loginContext } = useAuth();

  const { login, cargando, error } = useLogin();

  const iniciarSesion = async (e) => {
    e.preventDefault();

    const result = await login(email, password);
    if (result) {
      loginContext(result);
      closeModal();
    }
  };

  return (
    <>
      <Form onSubmit={iniciarSesion}>
        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Ingresa tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formPassword">
          <Form.Label>Contraseña</Form.Label>
          <Form.Control
            type="password"
            placeholder="Ingresa tu contraseña"
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
        >
          {cargando ? <Spinner animation="border" size="sm" /> : "Entrar"}
        </Button>
      </Form>
      {error && (
        <Alert className="mt-3" variant="danger">
          {error}
        </Alert>
      )}
    </>
  );
};

export default Login;
