import json
import logging
from urllib.parse import quote

from requests.exceptions import RequestException

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import CarMake, CarModel
from .populate import initiate
from .restapis import (
    get_request,
    analyze_review_sentiments,
    post_review,
)


logger = logging.getLogger(__name__)


# Inicio de sesión
@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not isinstance(data, dict):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = data.get("userName")
    password = data.get("password")

    if (
        not isinstance(username, str)
        or not username.strip()
        or not isinstance(password, str)
        or not password
    ):
        return JsonResponse(
            {"error": "Username and password are required"},
            status=400,
        )

    username = username.strip()

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is not None:
        login(request, user)
        return JsonResponse({
            "userName": user.username,
            "status": "Authenticated",
        })

    return JsonResponse({"userName": username})


# Cierre de sesión según el endpoint GET del laboratorio
def logout_request(request):
    logout(request)
    return JsonResponse({"userName": ""})


# Registro con inicio de sesión automático
@csrf_exempt
def registration(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not isinstance(data, dict):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    fields = [
        "userName",
        "password",
        "firstName",
        "lastName",
        "email",
    ]

    if any(
        not isinstance(data.get(field), str)
        or not data[field].strip()
        for field in fields
    ):
        return JsonResponse(
            {"error": "All fields are required"},
            status=400,
        )

    username = data["userName"].strip()

    if User.objects.filter(username=username).exists():
        return JsonResponse({
            "userName": username,
            "error": "Already Registered",
        })

    user = User.objects.create_user(
        username=username,
        password=data["password"],
        first_name=data["firstName"].strip(),
        last_name=data["lastName"].strip(),
        email=data["email"].strip(),
    )

    login(request, user)

    return JsonResponse({
        "userName": user.username,
        "status": "Authenticated",
    })


# Consultar marcas y modelos de automóviles
def get_cars(request):
    if not CarMake.objects.exists():
        initiate()

    car_models = CarModel.objects.select_related("car_make")

    cars = [
        {
            "CarModel": car_model.name,
            "CarMake": car_model.car_make.name,
        }
        for car_model in car_models
    ]

    return JsonResponse({"CarModels": cars})


# Consultar todos los concesionarios o filtrar por estado
def get_dealerships(request, state="All"):
    if request.method != "GET":
        return JsonResponse(
            {"status": 405, "message": "Method not allowed"},
            status=405,
        )

    endpoint = "/fetchDealers"

    if state != "All":
        endpoint += "/" + quote(state, safe="")

    try:
        dealerships = get_request(endpoint)

        if not isinstance(dealerships, list):
            raise ValueError("Invalid dealerships response")

    except (RequestException, ValueError):
        logger.exception("Error fetching dealerships")
        return JsonResponse(
            {"status": 502, "message": "Error fetching dealerships"},
            status=502,
        )

    return JsonResponse({
        "status": 200,
        "dealers": dealerships,
    })


# Consultar los detalles de un concesionario
def get_dealer_details(request, dealer_id):
    if request.method != "GET":
        return JsonResponse(
            {"status": 405, "message": "Method not allowed"},
            status=405,
        )

    if dealer_id <= 0:
        return JsonResponse(
            {"status": 400, "message": "Bad Request"},
            status=400,
        )

    try:
        dealership = get_request(f"/fetchDealer/{dealer_id}")

        if not isinstance(dealership, list):
            raise ValueError("Invalid dealer response")

    except (RequestException, ValueError):
        logger.exception("Error fetching dealer details")
        return JsonResponse(
            {"status": 502, "message": "Error fetching dealer details"},
            status=502,
        )

    if not dealership:
        return JsonResponse(
            {"status": 404, "message": "Dealer not found"},
            status=404,
        )

    return JsonResponse({
        "status": 200,
        "dealer": dealership,
    })


# Consultar reseñas y añadir su sentimiento
def get_dealer_reviews(request, dealer_id):
    if request.method != "GET":
        return JsonResponse(
            {"status": 405, "message": "Method not allowed"},
            status=405,
        )

    if dealer_id <= 0:
        return JsonResponse(
            {"status": 400, "message": "Bad Request"},
            status=400,
        )

    try:
        reviews = get_request(f"/fetchReviews/dealer/{dealer_id}")

        if not isinstance(reviews, list):
            raise ValueError("Invalid reviews response")

        for review_detail in reviews:
            if (
                not isinstance(review_detail, dict)
                or not isinstance(review_detail.get("review"), str)
            ):
                raise ValueError("Invalid review")

            analysis = analyze_review_sentiments(
                review_detail["review"]
            )

            if (
                not isinstance(analysis, dict)
                or analysis.get("sentiment")
                not in {"positive", "neutral", "negative"}
            ):
                raise ValueError("Invalid sentiment response")

            review_detail["sentiment"] = analysis["sentiment"]

    except (RequestException, ValueError):
        logger.exception("Error fetching or analyzing reviews")
        return JsonResponse(
            {"status": 502, "message": "Error fetching or analyzing reviews"},
            status=502,
        )

    return JsonResponse({
        "status": 200,
        "reviews": reviews,
    })


# Publicar una reseña: requiere una sesión autenticada
@csrf_exempt
def add_review(request):
    if request.method != "POST":
        return JsonResponse(
            {"status": 405, "message": "Method not allowed"},
            status=405,
        )

    if not request.user.is_authenticated:
        return JsonResponse(
            {"status": 403, "message": "Unauthorized"},
            status=403,
        )

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"status": 400, "message": "Invalid JSON"},
            status=400,
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {"status": 400, "message": "Invalid JSON"},
            status=400,
        )

    review_text = data.get("review")
    dealership = data.get("dealership")

    if (
        not isinstance(review_text, str)
        or not review_text.strip()
    ):
        return JsonResponse(
            {"status": 400, "message": "Review is required"},
            status=400,
        )

    # Admite un ID entero o una cadena de dígitos enviada por el formulario.
    if isinstance(dealership, str):
        if dealership.isascii() and dealership.isdecimal():
            dealership = int(dealership)

    if (
        isinstance(dealership, bool)
        or not isinstance(dealership, int)
        or dealership <= 0
    ):
        return JsonResponse(
            {"status": 400, "message": "Valid dealership ID is required"},
            status=400,
        )

    data["dealership"] = dealership
    data["review"] = review_text.strip()

    try:
        response = post_review(data)

        if not isinstance(response, dict):
            raise ValueError("Invalid backend response")

    except (RequestException, ValueError):
        logger.exception("Error posting review")
        return JsonResponse(
            {"status": 502, "message": "Error in posting review"},
            status=502,
        )

    return JsonResponse({
        "status": 200,
        "message": "Review posted successfully",
    })