// src/strategies/selection.js

export const deployStrategies = {
  'web-nextjs-free': {
    platform: 'Vercel',
    template: 'vercel',
    cost: '$0',
    time: '5 minutes',
    files: ['vercel.json', '.github/workflows/vercel-preview.yml']
  },
  'web-react-free': {
    platform: 'Netlify',
    template: 'netlify',
    cost: '$0',
    time: '5 minutes',
    files: ['netlify.toml', '.github/workflows/netlify-deploy.yml']
  },
  'web-nextjs-pro': {
    platform: 'AWS Amplify',
    template: 'awsAmplify',
    cost: '$5-15 (starts free)',
    time: '20 minutes',
    files: ['amplify.yml', 'README-DEPLOYMENT.md']
  },
  'web-nextjs-pro-azure': {
    platform: 'Azure Static Web Apps',
    template: 'azure',
    cost: '$5-20 (starts free)',
    time: '25 minutes',
    files: ['.github/workflows/azure-static-web-apps.yml', 'README-DEPLOYMENT.md']
  },
  'android-flutter-free': {
    platform: 'GitHub Actions',
    template: 'github-actions-android',
    cost: '$0',
    time: '30 minutes',
    files: ['.github/workflows/android-build.yml', 'fastlane/Fastfile']
  },
  'backend-node-free': {
    platform: 'Railway (Free Tier)',
    template: 'railway',
    cost: '$0 (5GB)',
    time: '10 minutes',
    files: ['railway.json', 'Dockerfile']
  },
  'backend-node-docker': {
    platform: 'Docker',
    template: 'docker',
    cost: 'Varies',
    time: '15 minutes',
    files: ['Dockerfile', 'docker-compose.yml']
  },
  'fullstack-medium': {
    platform: 'Railway + Vercel',
    template: 'fullstack', // This would need to be a combined template
    cost: '$25-50',
    time: '20 minutes',
    files: ['railway.json', 'vercel.json', 'docker-compose.yml']
  }
};

export function getStrategy(config) {
  const { projectType, framework, budget, technical } = config;

  if (projectType === 'backend' && technical === 'advanced') {
    return deployStrategies['backend-node-docker'];
  }

  // Simple key-based lookup for web frameworks
  if (projectType === 'web') {
    const key = `${projectType}-${framework}-${budget}`;
    if (deployStrategies[key]) {
      return deployStrategies[key];
    }
  }

  // More generic lookup for other types
  const genericKey = `${projectType}-${framework ? framework + '-' : ''}${budget}`;
  const fallbackKey = `${projectType}-${budget}`;

  return deployStrategies[genericKey] || deployStrategies[fallbackKey] || null;
}

export function getPlatformKey(config) {
  const { projectType, framework, technical, budget } = config;

  if (projectType === 'backend' && technical === 'advanced') {
    return 'docker';
  }

  if (projectType === 'web') {
    if (framework && framework.toLowerCase().includes('next.js')) {
      if (budget === 'pro-azure') {
        return 'azure';
      }
      if (budget === 'pro') {
        return 'awsAmplify';
      }
      return 'vercel';
    }
    return 'netlify';
  }
  if (projectType === 'android') {
    return 'github-actions-android';
  }
  if (projectType === 'backend' || projectType === 'fullstack') {
    return 'railway';
  }

  return null;
}
