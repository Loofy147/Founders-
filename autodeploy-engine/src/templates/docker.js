export const docker = (config) => ({
  'Dockerfile': `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]`,

  'docker-compose.yml': `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production`,

  'README-DEPLOYMENT.md': `# Docker Deployment Guide - ${config.projectName}

## Docker Setup (15 minutes)

### Step 1: Install Docker
Make sure you have Docker and Docker Compose installed on your machine.

### Step 2: Build the Image
\`\`\`bash
docker-compose build
\`\`\`

### Step 3: Run the Container
\`\`\`bash
docker-compose up -d
\`\`\`

Your application will be running on http://localhost:3000.

## Pushing to a Registry
To share your image, you can push it to a Docker registry like Docker Hub or GitHub Container Registry.

### Step 1: Tag the Image
\`\`\`bash
docker tag ${config.projectName.toLowerCase()}_app your-registry/your-image-name:latest
\`\`\`

### Step 2: Push the Image
\`\`\`bash
docker push your-registry/your-image-name:latest
\`\`\`

## Running in Production
To run this in production, you can use a cloud provider like AWS, Google Cloud, or Azure, or a service like Railway or Render that supports Docker deployments.
`
});
