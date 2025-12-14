#!/bin/bash

# AutoDeploy Engine - Quick Setup Script
# This script creates the entire project structure

set -e

PROJECT_NAME="autodeploy-engine"
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}🚀 AutoDeploy Engine Setup${NC}\n"

# Create project directory
echo -e "${GREEN}Creating project structure...${NC}"
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Create directory structure
mkdir -p src/{templates,strategies,utils,styles}
mkdir -p cli/{commands,utils}
mkdir -p docs/{SETUP_GUIDES,TEMPLATES}
mkdir -p examples/{nextjs-vercel,react-netlify,flutter-github-actions,node-railway}
mkdir -p .github/workflows

# Create package.json
echo -e "${GREEN}Creating package.json...${NC}"
cat > package.json << 'EOF'
{
  "name": "autodeploy-engine",
  "version": "1.0.0",
  "description": "Generate production-ready CI/CD configurations in minutes",
  "type": "module",
  "main": "cli/index.js",
  "bin": {
    "autodeploy": "./cli/index.js"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "cli": "node cli/index.js"
  },
  "keywords": [
    "ci-cd",
    "deployment",
    "devops",
    "automation",
    "github-actions"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1",
    "commander": "^11.0.0",
    "inquirer": "^9.2.0",
    "chalk": "^5.3.0",
    "ora": "^7.0.0",
    "simple-git": "^3.19.0",
    "fs-extra": "^11.1.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.4.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
EOF

# Create vite.config.js
echo -e "${GREEN}Creating Vite config...${NC}"
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
});
EOF

# Create tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Create postcss.config.js
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create index.html
echo -e "${GREEN}Creating index.html...${NC}"
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AutoDeploy Engine - Generate CI/CD Config in Minutes</title>
    <meta name="description" content="Generate production-ready deployment configurations for Vercel, Netlify, GitHub Actions, and more.">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# Create src/main.jsx
echo -e "${GREEN}Creating React app...${NC}"
cat > src/main.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOF

# Create src/styles/main.css
cat > src/styles/main.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF

# Create .gitignore
echo -e "${GREEN}Creating .gitignore...${NC}"
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor
.vscode/
.idea/
*.swp
*.swo
*~
EOF

# Create README.md
echo -e "${GREEN}Creating README.md...${NC}"
cat > README.md << 'EOF'
# 🚀 AutoDeploy Engine

**Stop configuring. Start shipping.**

Generate production-ready CI/CD configurations in 5 minutes. No DevOps knowledge required.

## Quick Start

### Web Interface
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

### CLI Tool
```bash
npm install
npm link
autodeploy init
```

## Features

- ✅ 4-Question Setup
- ✅ 10+ Platforms Supported
- ✅ Free Options Available
- ✅ Production-Ready Templates
- ✅ Complete Documentation

## Supported Platforms

- Vercel (Next.js, React)
- Netlify (Static sites, SPAs)
- GitHub Actions (Android, CI/CD)
- Railway (Backend, Full-stack)
- Docker (Any platform)

## Development

```bash
# Install dependencies
npm install

# Run web interface
npm run dev

# Build for production
npm run build

# Test CLI locally
node cli/index.js init
```

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## License

MIT - See [LICENSE](LICENSE)

## Support

- [Documentation](https://docs.autodeploy-engine.dev)
- [Discord](https://discord.gg/autodeploy)
- [Issues](https://github.com/yourusername/autodeploy-engine/issues)
EOF

# Create LICENSE
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 AutoDeploy Engine Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# Create GitHub Actions workflow
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Test CLI
      run: |
        npm link
        autodeploy --version
EOF

# Initialize git
echo -e "${GREEN}Initializing git repository...${NC}"
git init
git add .
git commit -m "Initial commit: AutoDeploy Engine setup"

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install

echo -e "\n${BOLD}${GREEN}✨ Setup Complete!${NC}\n"
echo -e "Next steps:"
echo -e "  ${BLUE}cd $PROJECT_NAME${NC}"
echo -e "  ${BLUE}npm run dev${NC}     # Start web interface"
echo -e "  ${BLUE}npm link${NC}        # Install CLI globally"
echo -e "  ${BLUE}autodeploy init${NC} # Test CLI\n"

echo -e "To deploy:"
echo -e "  1. Create GitHub repository"
echo -e "  2. ${BLUE}git remote add origin <your-repo-url>${NC}"
echo -e "  3. ${BLUE}git push -u origin main${NC}"
echo -e "  4. Deploy to Vercel: ${BLUE}vercel${NC}\n"

echo -e "📖 Full documentation: README.md"
echo -e "🚀 Happy deploying!\n"
EOF