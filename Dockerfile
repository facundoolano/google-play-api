# Use the official Node.js image as base
FROM node:16-alpine

# Set metadata labels
LABEL maintainer="Srikanth <srikanth@cashlessconsumer.in>" \
      version="1.0" \
      description="Docker image for running Google Play API"

# Create and set the working directory
WORKDIR /home/node/app

# Copy only the package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm ci --quiet --only=production

# Copy the rest of the application code
COPY . .

RUN npm run generateoas

# Expose port 3000
EXPOSE 3000

# Set the user to 'node' and run the application using npm start
USER node
CMD [ "npm", "start" ]
