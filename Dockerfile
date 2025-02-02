# Base image
FROM public.ecr.aws/docker/library/node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

ARG ENV_FILE_CONTENT
RUN echo "${ENV_FILE_CONTENT}" > /usr/src/app/.env

# Ensure that the .env file has the correct permissions
RUN chmod 644 /usr/src/app/.env

# Creates a "dist" folder with the production build
RUN npm run build

# Expose the port on which the app will run
EXPOSE 8001

# Start the server using the production build
CMD ["npm", "run", "start:prod"]
