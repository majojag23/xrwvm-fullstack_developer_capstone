import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./Dealers.css";
import "../assets/style.css";
import Header from "../Header/Header";

const PostReview = () => {
  const { id } = useParams();

  const [dealer, setDealer] = useState({});
  const [review, setReview] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [carmodels, setCarmodels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [dealerResponse, carsResponse] = await Promise.all([
          fetch(`/djangoapp/dealer/${id}`, {
            signal: controller.signal,
          }),
          fetch("/djangoapp/get_cars", {
            signal: controller.signal,
          }),
        ]);

        if (!dealerResponse.ok || !carsResponse.ok) {
          throw new Error("No se pudieron cargar los datos.");
        }

        const [dealerData, carsData] = await Promise.all([
          dealerResponse.json(),
          carsResponse.json(),
        ]);

        if (
          dealerData.status !== 200 ||
          !Array.isArray(dealerData.dealer) ||
          !dealerData.dealer.length ||
          !Array.isArray(carsData.CarModels)
        ) {
          throw new Error("La respuesta del servidor no es válida.");
        }

        if (!controller.signal.aborted) {
          setDealer(dealerData.dealer[0]);
          setCarmodels(carsData.CarModels);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || "Error al cargar el formulario.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => controller.abort();
  }, [id]);

  const postReview = async (event) => {
    event.preventDefault();

    if (submitting) return;

    const username = sessionStorage.getItem("username");

    if (!username) {
      setError("Inicia sesión antes de publicar una reseña.");
      return;
    }

    const selectedCar = carmodels[Number(model)];
    const carYear = Number(year);

    if (
      model === "" ||
      !selectedCar ||
      !review.trim() ||
      !date ||
      !Number.isInteger(carYear) ||
      carYear < 2015 ||
      carYear > 2023
    ) {
      setError("Completa todos los campos. El año debe ser de 2015 a 2023.");
      return;
    }

    const firstName = sessionStorage.getItem("firstname");
    const lastName = sessionStorage.getItem("lastname");

    const validName = (value) =>
      value && value !== "null" && value !== "undefined";

    const name =
      validName(firstName) && validName(lastName)
        ? `${firstName} ${lastName}`
        : username;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/djangoapp/add_review", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          dealership: Number(id),
          review: review.trim(),
          purchase: true,
          purchase_date: date,
          car_make: selectedCar.CarMake,
          car_model: selectedCar.CarModel,
          car_year: carYear,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== 200) {
        throw new Error(
          data.message || "No se pudo publicar la reseña."
        );
      }

      window.location.href = `/dealer/${id}`;
    } catch (err) {
      setError(err.message || "Error al conectar con el servidor.");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header />

      <div style={{ margin: "5%" }}>
        <h1 style={{ color: "darkblue" }}>
          {dealer.full_name || "Escribir una reseña"}
        </h1>

        {error && (
          <p role="alert" style={{ color: "darkred" }}>
            {error}
          </p>
        )}

        {loading ? (
          <p>Cargando formulario...</p>
        ) : (
          <form onSubmit={postReview}>
            <fieldset
              disabled={submitting}
              style={{ border: 0, padding: 0, minWidth: 0 }}
            >
              <label htmlFor="review">Review</label>
              <textarea
                id="review"
                rows="7"
                value={review}
                onChange={(event) => setReview(event.target.value)}
                required
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "600px",
                }}
              />

              <div className="input_field">
                <label htmlFor="purchase-date">Purchase Date</label>
                <input
                  id="purchase-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>

              <div className="input_field">
                <label htmlFor="cars">Car Make and Model</label>
                <select
                  id="cars"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Choose Car Make and Model
                  </option>

                  {carmodels.map((car, index) => (
                    <option
                      key={`${car.CarMake}-${car.CarModel}-${index}`}
                      value={index}
                    >
                      {car.CarMake} {car.CarModel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input_field">
                <label htmlFor="car-year">Car Year</label>
                <input
                  id="car-year"
                  type="number"
                  min="2015"
                  max="2023"
                  step="1"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  required
                />
              </div>

              <button className="postreview" type="submit">
                {submitting ? "Posting..." : "Post Review"}
              </button>
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );
};

export default PostReview;