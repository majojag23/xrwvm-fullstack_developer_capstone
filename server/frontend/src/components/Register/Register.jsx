import React, { useState } from "react";
import "./Register.css";
import userIcon from "../assets/person.png";
import emailIcon from "../assets/email.png";
import passwordIcon from "../assets/password.png";

const Register = () => {
  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const register = async (event) => {
    event.preventDefault();
    setError("");
    setSending(true);

    try {
      const response = await fetch(
        window.location.origin + "/djangoapp/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userName,
            firstName,
            lastName,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "Authenticated") {
        sessionStorage.setItem("username", data.userName);
        window.location.href = window.location.origin;
        return;
      }

      setError(
        data.error === "Already Registered"
          ? "Ese nombre de usuario ya está registrado."
          : data.error || "No se pudo crear la cuenta."
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="register_container"
      style={{ width: "90%", maxWidth: "620px" }}
    >
      <div className="header">
        <h1 className="text">Crear cuenta</h1>
        <a href="/">Volver al inicio</a>
      </div>

      <form onSubmit={register}>
        <div className="inputs">
          <div className="input">
            <img src={userIcon} className="img_icon" alt="" />
            <input
              className="input_field"
              name="username"
              aria-label="Nombre de usuario"
              placeholder="Nombre de usuario"
              autoComplete="username"
              maxLength={150}
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              required
            />
          </div>

          <div className="input">
            <img src={userIcon} className="img_icon" alt="" />
            <input
              className="input_field"
              name="first_name"
              aria-label="Nombre"
              placeholder="Nombre"
              autoComplete="given-name"
              maxLength={150}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </div>

          <div className="input">
            <img src={userIcon} className="img_icon" alt="" />
            <input
              className="input_field"
              name="last_name"
              aria-label="Apellido"
              placeholder="Apellido"
              autoComplete="family-name"
              maxLength={150}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>

          <div className="input">
            <img src={emailIcon} className="img_icon" alt="" />
            <input
              className="input_field"
              type="email"
              name="email"
              aria-label="Correo electrónico"
              placeholder="Correo electrónico"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="input">
            <img src={passwordIcon} className="img_icon" alt="" />
            <input
              className="input_field"
              type="password"
              name="password"
              aria-label="Contraseña"
              placeholder="Contraseña"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
        </div>

        {error && <p role="alert">{error}</p>}

        <div className="submit_panel">
          <button className="submit" type="submit" disabled={sending}>
            {sending ? "Creando cuenta..." : "Registrarse"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;