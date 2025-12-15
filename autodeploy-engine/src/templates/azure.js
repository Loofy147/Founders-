export const azure = (config) => ({
  '.github/workflows/azure-static-web-apps.yml': `
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: \${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: \${{ secrets.GITHUB_TOKEN }} # Used for GitHub integrations (i.e. PR comments)
          action: "upload"
          ###### Repository/Build Configurations - These values can be configured to match your app requirements. ######
          # For more information regarding Static Web App workflow configurations, please visit: https://aka.ms/swaworkflowconfig
          app_location: "/" # App source code path
          api_location: "" # Api source code path - optional
          output_location: "" # Built app content directory - optional
          ###### End of Repository/Build Configurations ######
        env: # Add environment variables here
          DB_HOST: \${{ secrets.DB_HOST }}
          DB_USER: \${{ secrets.DB_USER }}
          DB_DATABASE: \${{ secrets.DB_DATABASE }}
          DB_PASSWORD: \${{ secrets.DB_PASSWORD }}
          DB_PORT: \${{ secrets.DB_PORT }}

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: \${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
`,
  'README-DEPLOYMENT.md': `
# Deploying to Azure Static Web Apps

This guide walks you through deploying your Next.js application to Azure Static Web Apps.

## Prerequisites

- An Azure account with an active subscription.
- A GitHub account.
- Node.js and the Next.js CLI installed.

## Deployment Steps

### 1. Create an Azure Static Web App

1.  Go to the [Azure portal](https://portal.azure.com/).
2.  Click **Create a Resource**.
3.  Search for **Static Web Apps** and select it.
4.  Click **Create**.
5.  **Configure your new app:**
    -   **Subscription**: Select your Azure subscription.
    -   **Resource Group**: Create a new one (e.g., \`static-web-apps-test\`).
    -   **Name**: Give your app a unique name (e.g., \`my-first-static-web-app\`).
    -   **Plan type**: Select **Free**.
    -   **Source**: Select **GitHub** and sign in.
6.  **Connect your GitHub repository:**
    -   **Organization**: Select your GitHub organization.
    -   **Repository**: Select your repository.
    -   **Branch**: Select **main**.
7.  **Configure the build:**
    -   From the **Build Presets** dropdown, select **Next.js**.
    -   Keep the default values for **App location**, **Api location**, and **Output location**.
8.  Click **Review + create** and then **Create**.

### 2. Get the Deployment Token

1.  After the resource is created, go to your new Static Web App in the Azure portal.
2.  In the **Overview** tab, click on **Manage deployment token**.
3.  Copy the token.

### 3. Add the Token to GitHub Secrets

1.  Go to your GitHub repository.
2.  Go to **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret**.
4.  Name the secret \`AZURE_STATIC_WEB_APPS_API_TOKEN\`.
5.  Paste the deployment token you copied from the Azure portal.
6.  Click **Add secret**.

### 4. Push to GitHub

The GitHub Action workflow included in this template (\`.github/workflows/azure-static-web-apps.yml\`) will automatically trigger when you push to the \`main\` branch.

\`\`\`bash
git add .
git commit -m "Add Azure deployment configuration"
git push origin main
\`\`\`

### 5. View Your Website

1.  Go back to your Static Web App in the Azure portal.
2.  In the **Overview** tab, you'll see a URL for your application. Click on it to view your deployed site.

Congratulations! Your Next.js application is now deployed to Azure Static Web Apps.
`
});
