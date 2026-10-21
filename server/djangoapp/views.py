import json
import logging

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import CarMake, CarModel
from .populate import initiate


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


# Las vistas de concesionarios y reseñas se añadirán
# en el laboratorio de integración con los servicios backend.