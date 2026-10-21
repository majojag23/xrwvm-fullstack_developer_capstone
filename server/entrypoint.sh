#!/bin/sh
set -eu

echo "Applying migrations and collecting static files"
python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec "$@"
