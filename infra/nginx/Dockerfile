FROM nginx:alpine

# Install apache2-utils for htpasswd command
RUN apk add --no-cache apache2-utils

# Create basic auth credentials
RUN htpasswd -cb /etc/nginx/.htpasswd admin admin123

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create directory for error pages
RUN mkdir -p /usr/share/nginx/html

# Copy custom error pages (these will be created if needed)
COPY error-pages/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 