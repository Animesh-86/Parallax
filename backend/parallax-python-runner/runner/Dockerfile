FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
RUN pip install python-lsp-server
WORKDIR /workspace

# No ENTRYPOINT — RunCodeService provides the full command
# (python3 __runner__.py safePath)
CMD ["python3"]
