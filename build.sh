#!/usr/bin/env bash
set -o errexit

cd frontend
npm install
npm run build
cd ..

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate