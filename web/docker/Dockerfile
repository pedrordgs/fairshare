FROM node:24-alpine

USER node
WORKDIR /app

EXPOSE 5173

COPY --chown=node:node docker/entrypoint.sh /docker/entrypoint.sh
RUN chmod +x /docker/entrypoint.sh

ENTRYPOINT ["/docker/entrypoint.sh"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
