import React, { useState } from "react";
import "../assets/style.css";
import "../assets/bootstrap.min.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const username = sessionStorage.getItem("username");

  const logout = async (event) => {
    event.preventDefault();
    setLoggingOut(true);

    try {
      const response = await fetch("/djangoapp/logout", {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      sessionStorage.removeItem("username");
      window.location.href = "/";
    } catch (error) {
      alert("No se pudo cerrar la sesión. Inténtalo nuevamente.");
      setLoggingOut(false);
    }
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-light"
      style={{
        backgroundColor: "darkturquoise",
        minHeight: "1in",
        padding: "16px",
      }}
    >
      <div className="container-fluid">
        <h2 style={{ margin: 0, paddingRight: "5%" }}>
          Dealerships
        </h2>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-controls="navbarText"
          aria-expanded={menuOpen}
          aria-label="Abrir o cerrar menú"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          className={`collapse navbar-collapse${menuOpen ? " show" : ""}`}
          id="navbarText"
        >
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link" href="/">
                Home
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/about/">
                About Us
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/contact/">
                Contact Us
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/dealers/">
                View Reviews
              </a>
            </li>
          </ul>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            {username ? (
              <>
                <span style={{ fontWeight: "bold" }}>
                  {username}
                </span>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={logout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <a href="/login/">Login</a>
                <a href="/register/">Register</a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;