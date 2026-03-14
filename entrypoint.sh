#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until php -r "new PDO('mysql:host=db;port=3306;dbname=hackathon', 'admin', 'secret');" > /dev/null 2>&1; do
    echo "Database not ready yet, sleeping..."
    sleep 2
done

echo "Database is up! Running migrations..."
php artisan migrate --force

# Seed only if users table is empty
USER_COUNT=$(php artisan tinker --execute="echo \App\Models\User::count();" 2>/dev/null | tail -1)
if [ "$USER_COUNT" = "0" ]; then
    echo "Seeding database..."
    php artisan db:seed --force
fi

echo "Starting application..."
exec "$@"
