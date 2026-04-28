"use client";

import { use, useState, useEffect } from "react";
import { Container, Spinner, Alert, Modal } from "react-bootstrap";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthContext";
import { useReservas } from "@/context/ReservasContext";
import Login from "@/components/Login";
import CheckoutForm from "@/components/CheckoutForm";
import MySwal from "@/utils/swal";
import "@/css/CoworkingDetalle.css";

export default function CoworkingDetallePage(props) {
  const params = use(props.params);
  const { id } = params;

  const { usuario } = useAuth();
  const { agregarReserva, reservasLocales } = useReservas();
  const router = useRouter();

  const {
    data: espacioData,
    cargando,
    error,
  } = useFetch(
    `https://mock.apidog.com/m1/1188124-1182752-default/api/espacios?id=${id}`
  );

  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [checkoutPendiente, setCheckoutPendiente] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [horarioLocal, setHorarioLocal] = useState(null);
  const precioReserva =
    espacioData && espacioData.length > 0 ? espacioData[0].precio : 0;

  useEffect(() => {
    if (!espacioData || espacioData.length === 0) return;

    const espacio = espacioData[0];

    const nuevoHorario = JSON.parse(JSON.stringify(espacio.horario));

    const reservasEsteEspacio = reservasLocales.filter(
      (r) => String(r.espacioId) === String(id)
    );

    Object.keys(nuevoHorario).forEach((dia) => {
      Object.keys(nuevoHorario[dia]).forEach((hora) => {
        const reservasEnSlot = reservasEsteEspacio.filter(
          (r) => r.dia === dia && r.hora === hora
        ).length;

        const slotBase = nuevoHorario[dia][hora] || {
          estado: false,
          cupos: null,
        };

        if (espacio.tipo === "grupal") {
          const cuposBase = slotBase.cupos ?? 0;
          const cuposRestantes = Math.max(cuposBase - reservasEnSlot, 0);

          nuevoHorario[dia][hora] = {
            ...slotBase,
            cupos: cuposRestantes,
            estado: cuposRestantes === 0,
          };
        } else {
          if (reservasEnSlot > 0) {
            nuevoHorario[dia][hora] = {
              ...slotBase,
              estado: true,
              cupos: 0,
            };
          }
        }
      });
    });

    setHorarioLocal(nuevoHorario);
  }, [espacioData, reservasLocales, id]);

  const manejarReserva = async (dia, hora) => {
    if (!usuario) {
      setReservaSeleccionada({ dia, hora });
      setCheckoutPendiente(true);

      const res = await MySwal.fire({
        icon: "info",
        title: "Inicia sesión para reservar",
        text: "Necesitas una cuenta para realizar una reserva.",
        confirmButtonText: "Iniciar sesión",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
      });

      if (res.isConfirmed) setMostrarLogin(true);
      return;
    }

    setReservaSeleccionada({ dia, hora });
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
      const [tiempo, periodo] = reservaSeleccionada.hora.split(" ");
      let [horas, minutos] = tiempo.split(":").map(Number);

      let nuevasHoras = horas + 1;
      let nuevoPeriodo = periodo;

      if (nuevasHoras === 12) {
        nuevoPeriodo = periodo === "a.m." ? "p.m." : "a.m.";
      } else if (nuevasHoras > 12) {
        nuevasHoras = 1;
      }

      const horaFin = `${nuevasHoras}:${
        minutos < 10 ? "0" + minutos : minutos
      } ${nuevoPeriodo}`;

      const response = await fetch(
        "https://mock.apidog.com/m1/1188124-1182752-default/api/reservas",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            espacioId: parseInt(id),
            usuarioId: usuario.id,
            dia: reservaSeleccionada.dia,
            horaInicio: reservaSeleccionada.hora,
            horaFin: horaFin,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Hubo un problema registrando la reserva.");
      }

      const espacio = espacioData[0];

      setHorarioLocal((prevHorario) => {
        const nuevoHorario = JSON.parse(JSON.stringify(prevHorario));
        const dia = reservaSeleccionada.dia;
        const hora = reservaSeleccionada.hora;

        if (!nuevoHorario[dia]) return prevHorario;

        const slotActual = nuevoHorario[dia][hora];

        if (espacio.tipo === "grupal") {
          const cuposActuales = slotActual?.cupos ?? 0;
          const nuevosCupos = Math.max(cuposActuales - 1, 0);

          console.log(`Cupos antes: ${cuposActuales}, después: ${nuevosCupos}`);

          nuevoHorario[dia][hora] = {
            estado: nuevosCupos === 0,
            cupos: nuevosCupos,
          };
        } else {
          nuevoHorario[dia][hora] = {
            estado: true,
            cupos: 0,
          };
        }

        return nuevoHorario;
      });

      agregarReserva({
        usuarioId: usuario.id,
        espacioId: id,
        nombreEspacio: espacioData[0].nombre,
        dia: reservaSeleccionada.dia,
        hora: reservaSeleccionada.hora,
        horaFin: horaFin,
        precio: precioReserva,
      });

      setMostrarPago(false);
      setReservaSeleccionada(null);

      await MySwal.fire({
        icon: "success",
        title: "¡Reserva exitosa!",
        text: `Tu reserva para el ${reservaSeleccionada.dia} de ${reservaSeleccionada.hora} a ${horaFin} ha sido confirmada.`,
        confirmButtonText: "Ver mis reservas",
      });

      router.push("/mis-reservas");
    } catch (error) {
      await MySwal.fire({
        icon: "error",
        title: "Error en la reserva",
        text: error.message,
      });
    }
  };

  if (cargando) {
    return (
      <div className="d-flex justify-content-center my-5">
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

  if (!espacioData || espacioData.length === 0) {
    return (
      <Container className="mt-4">
        <Alert variant="warning" className="text-center">
          No se encontró el espacio solicitado.
        </Alert>
      </Container>
    );
  }

  const espacio = espacioData[0];
  const horario = horarioLocal || espacio.horario || {};

  const diasSemana = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];

  const diasNombres = {
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábado",
  };

  const horas = horario.lunes
    ? Object.keys(horario.lunes)
    : [
        "8:00 a.m.",
        "9:00 a.m.",
        "10:00 a.m.",
        "11:00 a.m.",
        "12:00 p.m.",
        "1:00 p.m.",
        "2:00 p.m.",
        "3:00 p.m.",
        "4:00 p.m.",
        "5:00 p.m.",
        "6:00 p.m.",
        "7:00 p.m.",
        "8:00 p.m.",
      ];

  return (
    <>
      <div className="d-flex">
        <div className="w-100 p-2">
          <div className="text-center mb-3 border-bottom pb-3">
            <h2>{espacio.nombre}</h2>
            <p>
              <i className="bi bi-geo-alt-fill text-danger me-1" />
              <span className="text-muted">{espacio.zona}</span>
            </p>
            {espacio.capacidad > 0 && (
              <p className="mb-3">
                <i className="bi bi-people-fill text-primary me-1" />
                <span className="text-muted">
                  Capacidad: {espacio.capacidad}{" "}
                  {espacio.capacidad === 1 ? "persona" : "personas"}
                </span>
              </p>
            )}

            {espacio.equipamiento && (
              <p className="mb-3 text-muted">
                <i className="bi bi-steam text-info me-1" />
                <span className="text-muted">Equipamiento: </span>
                {espacio.equipamiento.join(" · ")}
              </p>
            )}

            {espacio.precio > 0 && (
              <p>
                <i className="bi bi-currency-euro text-success me-1" />
                <span className="text-muted">
                  Precio:{" "}
                  {espacio.precio.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </p>
            )}
          </div>

          <div className="w-100">
            <h5 className="text-center mb-3">Selecciona día y hora</h5>

            <div className="calendario-semanal">
              <div className="hora-container">
                <div className="bg-primary text-white p-2 text-center fw-bold">
                  Hora
                </div>
                <div className="dia-slots">
                  {horas.map((hora) => (
                    <div key={hora} className="slot-row">
                      <div className="bg-secondary-subtle text-center fw-bold align-items-center justify-content-center hora-cell">
                        {hora}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {diasSemana.map((dia) => {
                const horarioDia = horario[dia] || {};

                return (
                  <div key={dia} className="dia-container">
                    <div className="bg-info text-white p-2 text-center fw-bold">
                      {diasNombres[dia]}
                    </div>
                    <div className="dia-slots">
                      {horas.map((hora) => {
                        const slot = horarioDia[hora] || {
                          estado: false,
                          cupos: null,
                        };
                        const disponible = slot.estado === false;

                        return (
                          <div key={hora} className="slot-row">
                            <div className="bg-secondary-subtle text-center fw-bold align-items-center justify-content-center hora-cell">
                              {hora}
                            </div>
                            <div className="estado-cell border d-flex align-items-center justify-content-center">
                              <div className="d-flex flex-column align-items-center">
                                {disponible ? (
                                  <>
                                    <button
                                      className="btn btn-sm btn-success"
                                      onClick={() => manejarReserva(dia, hora)}
                                    >
                                      Reservar
                                    </button>
                                    {slot.cupos != null && (
                                      <span className="text-danger small mt-1">
                                        {slot.cupos > 0 ? (
                                          <>
                                            Disponible: {slot.cupos}{" "}
                                            {slot.cupos === 1
                                              ? "cupo"
                                              : "cupos"}
                                          </>
                                        ) : (
                                          "Sin cupos"
                                        )}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="badge rounded-pill text-bg-secondary p-2">
                                    Ocupado
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={mostrarLogin}
        onHide={() => {
          setMostrarLogin(false);
          setCheckoutPendiente(false);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Iniciar Sesión</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Login closeModal={() => setMostrarLogin(false)} />
        </Modal.Body>
      </Modal>

      <Modal
        show={mostrarPago}
        onHide={() => setMostrarPago(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Finalizar Reserva</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {reservaSeleccionada && (
            <div className="mb-4 p-3 bg-light rounded">
              <h5 className="mb-3">Detalle de la reserva</h5>
              <p className="mb-1">
                <strong>Espacio:</strong> {espacio.nombre}
              </p>
              <p className="mb-1">
                <strong>Día:</strong> {diasNombres[reservaSeleccionada.dia]}
              </p>
              <p className="mb-3">
                <strong>Hora:</strong> {reservaSeleccionada.hora} (1 hora)
              </p>
              <div className="d-flex justify-content-between align-items-center border-top pt-3">
                <span>Monto total a pagar:</span>
                <span className="h4 mb-0 text-success fw-bold">
                  {espacio.precio.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </div>
            </div>
          )}
          <CheckoutForm
            totalPrecio={espacio.precio}
            onPagoExitoso={onPagoExitoso}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
