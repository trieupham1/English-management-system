FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Create necessary directories for uploads
RUN mkdir -p uploads/materials uploads/assignments uploads/reports

# Expose the port
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]