"use client";

export default function Login({ closeModal, dict = {}, locale = "es-ES" }) {
  const d = dict.login || {};

  const handleLogin = (e) => {
    e.preventDefault();

    // 1. Capturamos la ruta actual del navegador (ej: /es-ES/libreria)
    const currentPath = window.location.pathname;

    // 2. Construimos la URL de login con el returnTo dinámico
    const auth0LoginHref = `/auth/login?connection=google-oauth2&returnTo=${encodeURIComponent(currentPath)}`;

    // 3. Redirigimos
    window.location.href = auth0LoginHref;
  };

  return (
    <div>
      <button onClick={handleLogin} className="btn btn-primary w-100">
        {d.continue_with_google || "Continuar con Google"}
      </button>
    </div>
  );
}
