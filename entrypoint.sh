#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until php -r "new PDO('mysql:host=db;port=3306;dbname=hackathon', 'admin', 'secret');" > /dev/null 2>&1; do
    echo "Database not ready yet, sleeping..."
    sleep 2
done

echo "Database is up! Running migrations..."
php artisan migrate:fresh --seed --force

echo "Starting application..."
exec "$@"