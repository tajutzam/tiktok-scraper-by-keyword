FROM apify/actor-node-playwright-chrome:22-1.61.1 AS builder

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY --chown=myuser package*.json ./

RUN npm ci --include=dev --audit=false

COPY --chown=myuser . ./

RUN npm run build

FROM apify/actor-node-playwright-chrome:22-1.61.1

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV APIFY_ACTOR_PRICING_INFO={}
ENV APIFY_CHARGED_ACTOR_EVENT_COUNTS={}

COPY --from=builder --chown=myuser /home/myuser/dist ./dist
COPY --chown=myuser package*.json ./

RUN npm --quiet set progress=false \
    && npm ci --omit=dev --audit=false

COPY --chown=myuser . ./


CMD ./start_xvfb_and_run_cmd.sh && npm run start:prod --silent
