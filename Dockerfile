FROM php:8.3-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    unzip \
    git \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql bcmath
RUN pecl install redis && docker-php-ext-enable redis

# Install OpenTelemetry specific extensions
RUN pecl install opentelemetry \
    && docker-php-ext-enable opentelemetry

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
