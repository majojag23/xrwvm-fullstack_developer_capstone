from django.db import transaction
from .models import CarMake, CarModel


@transaction.atomic
def initiate():
    catalog = [
        (
            "NISSAN",
            "Great cars. Japanese technology",
            [
                ("Pathfinder", "SUV"),
                ("Qashqai", "SUV"),
                ("XTRAIL", "SUV"),
            ],
        ),
        (
            "Mercedes",
            "Great cars. German technology",
            [
                ("A-Class", "SUV"),
                ("C-Class", "SUV"),
                ("E-Class", "SUV"),
            ],
        ),
        (
            "Audi",
            "Great cars. German technology",
            [
                ("A4", "SUV"),
                ("A5", "SUV"),
                ("A6", "SUV"),
            ],
        ),
        (
            "Kia",
            "Great cars. Korean technology",
            [
                ("Sorrento", "SUV"),
                ("Carnival", "SUV"),
                ("Cerato", "SEDAN"),
            ],
        ),
        (
            "Toyota",
            "Great cars. Japanese technology",
            [
                ("Corolla", "SEDAN"),
                ("Camry", "SEDAN"),
                ("Kluger", "SUV"),
            ],
        ),
    ]

    for make_name, description, models in catalog:
        car_make, _ = CarMake.objects.get_or_create(
            name=make_name,
            defaults={"description": description},
        )

        for model_name, car_type in models:
            CarModel.objects.get_or_create(
                car_make=car_make,
                name=model_name,
                year=2023,
                dealer_id=1,
                defaults={"type": car_type},
            )
