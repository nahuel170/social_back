# Etapa base: usamos Node.js Alpine para ligereza
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos package.json y package-lock.json e instalamos dependencias en producción
COPY package*.json ./
RUN npm ci --production

# Copiamos el resto de la aplicación
COPY . .

# Exponemos el puerto en el que corre tu API (ajusta si es otro)
EXPOSE 3000

# Comando por defecto: arranca tu servidor Node
CMD ["node", "index.js"]
