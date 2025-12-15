import React, { useState } from 'react';
import { Download, Github, Terminal, CheckCircle, AlertCircle, Copy, FileText } from 'lucide-react';
import DeploySolutionPicker from './components/DeploySolutionPicker.jsx';
import { vercel } from './templates/vercel.js';
import { netlify } from './templates/netlify.js';
import { githubActionsAndroid } from './templates/github-actions-android.js';
import { railway } from './templates/railway.js';
import { docker } from './templates/docker.js';
import { getAwsAmplifyConfig } from './templates/awsAmplify.js';
import { azure } from './templates/azure.js';
import { getStrategy } from './strategies/selection.js';

const AutoDeployEngine = () => {
  const [view, setView] = useState('engine'); // 'engine' or 'picker'
  const [step, setStep] = useState('intro');
  const [config, setConfig] = useState({
    projectType: null,
    deployTargets: [],
    budget: null,
    technical: null,
    repoUrl: '',
    projectName: '',
    framework: null
  });
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [copied, setCopied] = useState(false);

  const questions = {
    projectType: {
      title: "What are you deploying?",
      options: [
        { value: 'web', label: 'Web Application', icon: '🌐', desc: 'React, Next.js, Vue, etc.' },
        { value: 'android', label: 'Android App', icon: '📱', desc: 'Flutter, React Native, Native' },
        { value: 'backend', label: 'Backend API', icon: '⚙️', desc: 'Node, Python, Go, etc.' },
        { value: 'fullstack', label: 'Full Stack', icon: '🔄', desc: 'Frontend + Backend + DB' }
      ]
    },
    framework: {
      web: [
        { value: 'nextjs', label: 'Next.js' },
        { value: 'react', label: 'React (Vite/CRA)' },
        { value: 'vue', label: 'Vue.js' },
        { value: 'static', label: 'Static HTML/JS' }
      ],
      android: [
        { value: 'flutter', label: 'Flutter' },
        { value: 'react-native', label: 'React Native' },
        { value: 'native', label: 'Native (Kotlin/Java)' }
      ],
      backend: [
        { value: 'node', label: 'Node.js' },
        { value: 'python', label: 'Python' },
        { value: 'go', label: 'Go' },
        { value: 'other', label: 'Other' }
      ]
    },
    budget: {
      title: "Monthly budget?",
      options: [
        { value: 'free', label: 'Free ($0)', icon: '💚' },
        { value: 'low', label: 'Low ($5-20)', icon: '💙' },
        { value: 'medium', label: 'Medium ($20-100)', icon: '💛' },
        { value: 'pro', label: 'Production (AWS)', icon: '🚀' },
        { value: 'pro-azure', label: 'Production (Azure)', icon: '🔷' }
      ]
    },
    technical: {
      title: "Your comfort level?",
      options: [
        { value: 'beginner', label: 'Beginner', icon: '🌱', desc: 'I avoid config files' },
        { value: 'intermediate', label: 'Intermediate', icon: '🔧', desc: 'I can follow tutorials' },
        { value: 'advanced', label: 'Advanced', icon: '⚡', desc: 'I know Docker/K8s' }
      ]
    }
  };

  const fileTemplates = {
    'vercel': vercel,
    'netlify': netlify,
    'github-actions-android': githubActionsAndroid,
    'railway': railway,
    'docker': docker,
    'awsAmplify': getAwsAmplifyConfig,
    'azure': azure
  };

  const getSelectedStrategy = (cfg) => {
    return getStrategy(cfg);
  };

  const generateSetupSteps = (cfg) => {
    if (cfg.projectType === 'android') {
      return `1. Push code to GitHub
2. Go to repository Settings → Secrets
3. Add these secrets:
   - \`KEYSTORE_BASE64\`: Your signing key (base64 encoded)
   - \`KEY_STORE_PASSWORD\`: Keystore password
   - \`KEY_ALIAS\`: Key alias
   - \`KEY_PASSWORD\`: Key password
4. Push to main branch - APK builds automatically
5. Download from Actions → Artifacts`;
    }

    if (cfg.projectType === 'web' && cfg.framework === 'nextjs') {
      return `1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Vercel auto-detects Next.js - click Deploy
6. Done! Your app is live`;
    }

    return `1. Push code to GitHub
2. Connect repository to ${getSelectedStrategy(cfg)?.platform}
3. Configure build settings
4. Add environment variables
5. Deploy`;
  };

  const generateEnvVars = (cfg) => {
    const vars = ['NODE_ENV=production'];

    if (cfg.projectType === 'backend' || cfg.projectType === 'fullstack') {
      vars.push('DATABASE_URL=your_database_url');
      vars.push('JWT_SECRET=your_jwt_secret');
    }

    if (cfg.projectType === 'web' || cfg.projectType === 'fullstack') {
      vars.push('NEXT_PUBLIC_API_URL=your_api_url');
    }

    return vars.join('\n');
  };

  const generateDeployCommand = (cfg) => {
    if (cfg.projectType === 'android') {
      return '```bash\ngit push origin main\n# GitHub Actions builds automatically\n```';
    }

    return '```bash\n# Automatic on git push to main\ngit push origin main\n```';
  };

  const getPlatformDocsUrl = (cfg) => {
    const strategy = getSelectedStrategy(cfg);
    if (!strategy) return 'https://docs.github.com';

    const urls = {
      'Vercel': 'https://vercel.com/docs',
      'Netlify': 'https://docs.netlify.com',
      'Railway': 'https://docs.railway.app',
      'GitHub Actions': 'https://docs.github.com/en/actions',
      'AWS Amplify': 'https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html'
    };

    return urls[strategy.platform] || 'https://docs.github.com';
  };

  const handleAnswer = (question, value) => {
    setConfig(prev => ({ ...prev, [question]: value }));

    const flowOrder = ['projectType', 'framework', 'budget', 'technical', 'projectInfo'];
    const currentIndex = flowOrder.indexOf(step);

    if (question === 'projectType' && value) {
      setStep('framework');
    } else if (currentIndex < flowOrder.length - 1) {
      setStep(flowOrder[currentIndex + 1]);
    } else {
      setStep('projectInfo');
    }
  };

  const generateFiles = () => {
    const strategy = getSelectedStrategy(config);
    if (!strategy) {
      return;
    }

    const templateGenerator = fileTemplates[strategy.template];
    if (!templateGenerator) {
      return;
    }

    const files = Object.entries(templateGenerator(config)).map(([name, content]) => ({ name, content }));

    setGeneratedFiles(files);
    setStep('download');
  };

  const downloadFile = (file) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    generatedFiles.forEach(file => {
      setTimeout(() => downloadFile(file), 100);
    });
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Terminal className="w-12 h-12 text-blue-500" />
            <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              AutoDeploy Engine
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Answer 4 questions → Get production-ready CI/CD config → Deploy in minutes
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setView('engine')}
            className={`px-6 py-2 rounded-l-lg font-bold ${view === 'engine' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            AutoDeploy Engine
          </button>
          <button
            onClick={() => setView('picker')}
            className={`px-6 py-2 rounded-r-lg font-bold ${view === 'picker' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            Deploy Solution Picker
          </button>
        </div>

        {view === 'picker' && <DeploySolutionPicker />}

        {view === 'engine' && (
          <>
            {/* Intro Screen */}
            {step === 'intro' && (
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                <h2 className="text-3xl font-bold mb-6">Stop configuring. Start shipping.</h2>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-900 p-6 rounded-xl border border-blue-500/20">
                    <div className="text-4xl mb-3">⚡</div>
                    <h3 className="font-bold mb-2">5-Minute Setup</h3>
                    <p className="text-gray-400 text-sm">No DevOps knowledge required</p>
                  </div>
                  <div className="bg-gray-900 p-6 rounded-xl border border-purple-500/20">
                    <div className="text-4xl mb-3">🎯</div>
                    <h3 className="font-bold mb-2">Production Ready</h3>
                    <p className="text-gray-400 text-sm">Battle-tested configurations</p>
                  </div>
                  <div className="bg-gray-900 p-6 rounded-xl border border-green-500/20">
                    <div className="text-4xl mb-3">💰</div>
                    <h3 className="font-bold mb-2">Free Options</h3>
                    <p className="text-gray-400 text-sm">Start at $0/month</p>
                  </div>
                </div>
                <button
                  onClick={() => setStep('projectType')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Start Setup (4 Questions) →
                </button>
              </div>
            )}

            {/* Question: Project Type */}
            {step === 'projectType' && (
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6">{questions.projectType.title}</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {questions.projectType.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer('projectType', option.value)}
                      className="bg-gray-900 p-6 rounded-xl border-2 border-gray-700 hover:border-blue-500 transition-all text-left group"
                    >
                      <div className="text-4xl mb-3">{option.icon}</div>
                      <h3 className="font-bold text-xl mb-2 group-hover:text-blue-400">{option.label}</h3>
                      <p className="text-gray-400 text-sm">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question: Framework */}
            {step === 'framework' && config.projectType && (
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6">Which framework/tool?</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {questions.framework[config.projectType]?.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer('framework', option.value)}
                      className="bg-gray-900 p-6 rounded-xl border-2 border-gray-700 hover:border-purple-500 transition-all text-left"
                    >
                      <h3 className="font-bold text-xl">{option.label}</h3>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question: Budget */}
            {step === 'budget' && (
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6">{questions.budget.title}</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {questions.budget.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer('budget', option.value)}
                      className="bg-gray-900 p-6 rounded-xl border-2 border-gray-700 hover:border-green-500 transition-all"
                    >
                      <div className="text-4xl mb-3">{option.icon}</div>
                      <h3 className="font-bold text-lg">{option.label}</h3>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question: Technical Level */}
            {step === 'technical' && (
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6">{questions.technical.title}</h2>
                <div className="space-y-4">
                  {questions.technical.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer('technical', option.value)}
                      className="w-full bg-gray-900 p-6 rounded-xl border-2 border-gray-700 hover:border-yellow-500 transition-all text-left flex items-center gap-4"
                    >
                      <div className="text-4xl">{option.icon}</div>
                      <div>
                        <h3 className="font-bold text-xl">{option.label}</h3>
                        <p className="text-gray-400">{option.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Project Info */}
            {step === 'projectInfo' && (
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6">Project Details</h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Name</label>
                    <input
                      type="text"
                      value={config.projectName}
                      onChange={(e) => setConfig(prev => ({ ...prev, projectName: e.target.value }))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                      placeholder="my-awesome-app"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">GitHub Repository URL (optional)</label>
                    <input
                      type="text"
                      value={config.repoUrl}
                      onChange={(e) => setConfig(prev => ({ ...prev, repoUrl: e.target.value }))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                </div>
                <button
                  onClick={generateFiles}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all"
                >
                  Generate Configuration Files →
                </button>
              </div>
            )}

            {/* Download Files */}
            {step === 'download' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-2xl p-8 border border-green-500/30">
                  <div className="flex items-center gap-4 mb-4">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                    <div>
                      <h2 className="text-2xl font-bold">Configuration Generated!</h2>
                      <p className="text-gray-300">Download files and follow the README</p>
                    </div>
                  </div>
                  <button
                    onClick={downloadAll}
                    className="w-full bg-green-600 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download All Files ({generatedFiles.length})
                  </button>
                </div>

                <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                  <h3 className="text-xl font-bold mb-4">Generated Files</h3>
                  <div className="space-y-3">
                    {generatedFiles.map((file, index) => (
                      <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" />
                            <span className="font-mono font-bold">{file.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(file.content)}
                              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-1"
                            >
                              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              {copied ? 'Copied' : 'Copy'}
                            </button>
                            <button
                              onClick={() => downloadFile(file)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        </div>
                        <pre className="text-xs text-gray-400 bg-black p-3 rounded overflow-x-auto max-h-40">
                          {file.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep('intro');
                    setConfig({
                      projectType: null,
                      deployTargets: [],
                      budget: null,
                      technical: null,
                      repoUrl: '',
                      projectName: '',
                      framework: null
                    });
                    setGeneratedFiles([]);
                  }}
                  className="w-full bg-gray-700 py-3 rounded-xl font-bold hover:bg-gray-600 transition-all"
                >
                  ← Start Over
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AutoDeployEngine;