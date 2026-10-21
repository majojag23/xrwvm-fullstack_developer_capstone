import os
from pathlib import Path
from urllib.parse import quote

import requests
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent / ".env")

backend_url = os.getenv(
    "backend_url",
    "http://localhost:3030"
).rstrip("/")

sentiment_analyzer_url = os.getenv(
    "sentiment_analyzer_url",
    "http://localhost:5000/"
).rstrip("/") + "/"


def get_request(endpoint, **kwargs):
    request_url = backend_url + "/" + endpoint.lstrip("/")

    response = requests.get(
        request_url,
        params=kwargs,
        timeout=30
    )
    response.raise_for_status()
    return response.json()


def analyze_review_sentiments(text):
    request_url = (
        sentiment_analyzer_url
        + "analyze/"
        + quote(str(text), safe="")
    )

    response = requests.get(request_url, timeout=60)
    response.raise_for_status()
    return response.json()


def post_review(data_dict):
    request_url = backend_url + "/insert_review"

    response = requests.post(
        request_url,
        json=data_dict,
        timeout=30
    )
    response.raise_for_status()
    return response.json()
