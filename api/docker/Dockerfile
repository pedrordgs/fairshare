FROM python:3.12-slim

RUN useradd -m fairshare
USER fairshare

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH="$PYTHONPATH:/home/fairshare/src"

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY --chown=fairshare:fairshare pyproject.toml uv.lock /home/fairshare/
COPY --chown=fairshare:fairshare docker/entrypoint.sh /home/fairshare/docker/entrypoint.sh

RUN chmod +x /home/fairshare/docker/entrypoint.sh

WORKDIR /home/fairshare

RUN uv sync

ENTRYPOINT ["/home/fairshare/docker/entrypoint.sh"]
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/home/fairshare/src"]
