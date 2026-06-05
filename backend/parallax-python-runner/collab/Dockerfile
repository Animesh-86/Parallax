FROM python:3.12-slim

# Avoid buffering issues
ENV PYTHONUNBUFFERED=1

# Create workspace for live files
WORKDIR /workspace

# Install basic tools and LSPs
RUN apt-get update && apt-get install -y \
    bash \
    git \
    curl \
    clangd \
    nodejs \
    npm \
 && rm -rf /var/lib/apt/lists/*

RUN npm install -g typescript typescript-language-server
RUN pip install python-lsp-server

# Container stays alive
CMD ["tail", "-f", "/dev/null"]
