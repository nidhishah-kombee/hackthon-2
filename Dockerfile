FROM php:8.3-cli

# System dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev unzip git nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# PHP extensions
RUN docker-php-ext-install pdo pdo_mysql bcmath
RUN pecl install redis && docker-php-ext-enable redis
RUN pecl install opentelemetry && docker-php-ext-enable opentelemetry

# Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /app

# Copy everything first (needed for artisan + package discovery)
COPY . .

# Install PHP deps — cached unless composer.json/lock changes
RUN composer install --no-interaction --prefer-dist --optimize-autoloader \
    --ignore-platform-req=ext-grpc --ignore-platform-req=ext-opentelemetry

# Install & build frontend — cached unless package.json changes
RUN npm ci --prefer-offline && npm run build

COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
