# Specify the base Docker image. You can read more about
# the available images at https://crawlee.dev/docs/guides/docker-images
FROM apify/actor-node-playwright-chrome:24

# Check preinstalled packages
RUN npm ls @crawlee/core apify playwright

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY --chown=myuser:myuser package*.json ./

# Install all dependencies (termasuk devDependencies, karena tsx
# dibutuhkan untuk menjalankan TypeScript langsung tanpa compile).
RUN npm --quiet set progress=false \
    && npm install --include=dev --audit=false \
    && echo "Installed NPM packages:" \
    && (npm list --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version

# Copy the remaining source files.
COPY --chown=myuser:myuser . ./

# Run the actor directly via tsx (no build step needed).
CMD ["npx", "tsx", "src/main.ts"]
