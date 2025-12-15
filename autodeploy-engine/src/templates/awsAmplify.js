export const getAwsAmplifyConfig = (config) => ({
  'amplify.yml': `version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
`,
  'README-DEPLOYMENT.md': `# Deploying to AWS Amplify

This guide walks you through deploying your Next.js application to AWS Amplify.

## Prerequisites

- An AWS account.
- A GitHub account.
- Node.js and the Next.js CLI installed.

## Deployment Steps

### 1. Push to GitHub

Push your project to a GitHub repository. AWS Amplify will connect to this repository to deploy your application.

### 2. Configure AWS Amplify

1.  Go to the [AWS Amplify console](https://console.aws.amazon.com/amplify/).
2.  Click **New app** > **Host web app**.
3.  Select **GitHub** as your source provider and connect your repository.
4.  Select the repository and branch you want to deploy.
5.  Amplify will auto-detect your Next.js project and apply the correct build settings.
6.  Review the settings and click **Save and deploy**.

### 3. (Optional) Custom Domain

To configure a custom domain, go to **Domain management** in the Amplify console and follow the instructions.

Congratulations! Your Next.js application is now deployed to AWS Amplify.
`,
});
