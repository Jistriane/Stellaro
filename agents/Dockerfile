# Dockerfile para os Agentes Python (ElizaOS/Agent Framework)
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY requirements.txt .

# Instalar dependências Python (Microsoft Agent Framework requer --pre)
RUN pip install --no-cache-dir -r requirements.txt --pre

# Copiar código fonte
COPY . .

# Variáveis de ambiente padrão
ENV BACKEND_URL=http://stellaro-backend-service:3001
ENV REDIS_URL=redis://stellaro-redis:6379

# Expor porta se houver API server (api_server.py)
EXPOSE 8000

# Comando para rodar o orquestrador por padrão
CMD ["python", "orchestrator.py"]
