// cli/commands/generate.js
import fs from 'fs-extra';
import path from 'path';
import { vercel } from '../../src/templates/vercel.js';
import { netlify } from '../../src/templates/netlify.js';
import { githubActionsAndroid } from '../../src/templates/github-actions-android.js';
import { railway } from '../../src/templates/railway.js';
import { docker } from '../../src/templates/docker.js';
import { getAwsAmplifyConfig } from '../../src/templates/awsAmplify.js';
import { azure } from '../../src/templates/azure.js';
import { getPlatformKey } from '../../src/strategies/selection.js';

// Template generators for all platforms
const templates = {
  vercel,
  netlify,
  'github-actions-android': githubActionsAndroid,
  railway,
  docker,
  awsAmplify: getAwsAmplifyConfig,
  azure
};

export async function generateFiles(config) {
  const files = [];

  // Determine which templates to use
  const platformKey = getPlatformKey(config);

  // Get template generator
  const templateGenerator = templates[platformKey];
  if (!templateGenerator) {
    throw new Error(`No template found for: ${platformKey}`);
  }

  // Generate files
  const generatedFiles = templateGenerator(config);

  // Convert to array format with paths
  for (const [filename, content] of Object.entries(generatedFiles)) {
    files.push({
      path: filename,
      content: content,
      name: path.basename(filename)
    });
  }

  return files;
}

// Validation helper
export function validateProject() {
  const errors = [];

  // Check for package.json
  if (!fs.existsSync('package.json')) {
    errors.push('No package.json found. Is this a Node project?');
  }

  // Check for .git
  if (!fs.existsSync('.git')) {
    errors.push('Not a git repository. Run: git init');
  }

  return errors;
}

// Platform detection
export async function detectPlatform() {
  try {
    const packageJson = await fs.readJson('package.json');
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    if (dependencies.next) return 'Next.js';
    if (dependencies.react) return 'React';
    if (dependencies.vue) return 'Vue';
    if (packageJson.scripts?.flutter) return 'Flutter';

    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// Export all
export default {
  generateFiles,
  validateProject,
  detectPlatform,
  templates
};
