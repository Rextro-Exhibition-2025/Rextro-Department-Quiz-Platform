# 🐳 Docker Setup Instructions - Rextro Department Quiz Platform

### IMPORTANT : FRONTEND RUN IN DEV MODE

## 🔧 **Backend Docker Commands**

### **Production Mode** 

#### Linux/Mac (Bash)

```bash
# Build production image
docker build --target production -t rextro-backend-prod ./backend

# Run production container with env file
docker run -d -p 5000:5000 \
  --env-file ./backend/.env.docker \
  --restart unless-stopped \
  --name backend-prod \
  rextro-backend-prod
```

#### Windows (PowerShell) ⚡

```powershell
# Build production image
docker build --target production -t rextro-backend-prod ./backend

# Run production container with env file
docker run -d -p 5000:5000 `
  --env-file .\backend\.env.docker `
  --restart unless-stopped `
  --name backend-prod `
  rextro-backend-prod
```

**🔒 Security Note:** Never pass secrets via `-e` flags in production. Always use `--env-file`.

---

## 🎨 **Frontend Docker Commands**

### **Production Mode**
#### Linux/Mac (Bash)

```bash
# Build production image
docker build --target production -t rextro-frontend-prod ./frontend

# Run production container with env file
docker run -d -p 3000:3000 \
  --env-file ./frontend/.env.docker \
  --restart unless-stopped \
  --name frontend-prod \
  rextro-frontend-prod
```

#### Windows (PowerShell) ⚡

```powershell
# Build production image
docker build --target production -t rextro-frontend-prod ./frontend

# Run production container with env file
docker run -d -p 3000:3000 `
  --env-file .\frontend\.env.docker `
  --restart unless-stopped `
  --name frontend-prod `
  rextro-frontend-prod
```

**🔒 Security Note:** Always use `--env-file` in production. Never expose secrets in command line.

---

## 🔐 **Environment Variables Setup**

just use .env or whatever env like .env.docker,
but in this line in run cmd, --env-file .\frontend\.env.docker set it properly


## 🐳 **Docker Compose (Full Stack)**

create docker-compose.yml in root directory, and uses env as you set before, .env or env.docker for both front n backends

### **Docker Compose Commands**

```bash
# Start all services in production mode
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Rebuild images
docker-compose build

# Rebuild and restart
docker-compose up -d --build
```

---

## 🔍 **Troubleshooting**

### **View Container Logs**

```bash
# Backend logs
docker logs backend-prod

# Frontend logs
docker logs frontend-prod

# Follow logs (real-time)
docker logs -f backend-prod
```


---

## 🚀 **Production Deployment**

### **Best Practices**

1. **Always use production target**

   ```bash
   docker build --target production -t app-name .
   ```

``


``` 
**Last Updated:**12th December 2025
