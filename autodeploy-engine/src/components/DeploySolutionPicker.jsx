import React, { useState } from 'react';
import { ChevronRight, Check, X } from 'lucide-react';

const DeploySolutionPicker = () => {
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);

  const questions = [
    {
      id: 'types',
      question: 'What are you deploying?',
      options: [
        { value: 'web', label: 'Websites/Web Apps (React, Next.js, etc)' },
        { value: 'android', label: 'Android Apps (APK)' },
        { value: 'backend', label: 'Backend APIs (Node, Python, etc)' },
        { value: 'all', label: 'All of the above' }
      ]
    },
    {
      id: 'frequency',
      question: 'How often do you deploy?',
      options: [
        { value: 'daily', label: 'Daily or more' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly or less' }
      ]
    },
    {
      id: 'budget',
      question: 'Monthly budget for tools?',
      options: [
        { value: 'free', label: '$0 (free tier only)' },
        { value: 'low', label: '$20-50/month' },
        { value: 'med', label: '$50-200/month' }
      ]
    },
    {
      id: 'technical',
      question: 'Your comfort level?',
      options: [
        { value: 'low', label: 'I hate touching config files' },
        { value: 'med', label: 'I can follow tutorials' },
        { value: 'high', label: 'I understand Docker/YAML' }
      ]
    }
  ];

  const solutions = {
    web_free: {
      name: 'Vercel + GitHub',
      setup: '10 minutes',
      cost: '$0',
      steps: [
        'Push code to GitHub',
        'Connect repo to Vercel',
        'Auto-deploys on every push'
      ],
      pros: ['Zero config', 'Free tier generous', 'Fast'],
      cons: ['Vercel lock-in', 'Limited backend']
    },
    web_paid: {
      name: 'Railway/Render',
      setup: '15 minutes',
      cost: '$5-20/month',
      steps: [
        'Connect GitHub',
        'Select repo',
        'Configure environment variables',
        'Auto-deploy'
      ],
      pros: ['Full-stack support', 'Databases included', 'Simple'],
      cons: ['Costs scale with usage']
    },
    android_free: {
      name: 'GitHub Actions',
      setup: '30 minutes',
      cost: '$0',
      steps: [
        'Add .github/workflows/build.yml to repo',
        'Configure secrets for signing',
        'Push = auto APK build',
        'Download from Actions tab'
      ],
      pros: ['Free', 'Industry standard', 'Full control'],
      cons: ['Need to write YAML once']
    },
    android_paid: {
      name: 'Bitrise',
      setup: '20 minutes',
      cost: '$40/month',
      steps: [
        'Connect GitHub',
        'Choose Android workflow',
        'Upload signing key',
        'Auto-builds on push'
      ],
      pros: ['Visual workflow builder', 'No YAML', 'Support'],
      cons: ['Expensive for solo dev']
    },
    all_free: {
      name: 'GitHub Actions + Vercel',
      setup: '45 minutes',
      cost: '$0',
      steps: [
        'Vercel for web apps',
        'GitHub Actions for Android',
        'Separate workflows per project type'
      ],
      pros: ['Free', 'Best of both worlds'],
      cons: ['Two systems to learn']
    },
    all_paid: {
      name: 'Custom CI/CD Pipeline',
      setup: '40+ hours',
      cost: '$200+/month + your time',
      steps: [
        'Set up Jenkins/GitLab CI',
        'Configure Docker',
        'Write build scripts',
        'Set up artifact storage',
        'Maintain forever'
      ],
      pros: ['Full control', 'Any workflow'],
      cons: ['Massive time sink', 'You become DevOps']
    }
  };

  const getRecommendation = () => {
    const { types, budget, technical } = answers;

    if (technical === 'low') {
      if (types === 'web') return 'web_free';
      if (types === 'android') return 'android_paid';
      return 'all_paid'; // Ironic recommendation
    }

    if (budget === 'free') {
      if (types === 'web') return 'web_free';
      if (types === 'android') return 'android_free';
      return 'all_free';
    }

    if (types === 'web') return budget === 'med' ? 'web_paid' : 'web_free';
    if (types === 'android') return 'android_paid';
    return budget === 'med' ? 'all_paid' : 'all_free';
  };

  const handleAnswer = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const reset = () => {
    setAnswers({});
    setCurrentStep(0);
  };

  const isComplete = Object.keys(answers).length === questions.length;
  const recommendation = isComplete ? solutions[getRecommendation()] : null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <h2 className="text-xl font-bold text-red-900 mb-2">⚠️ Reality Check</h2>
        <p className="text-red-800">
          If you hate coding/config, building your own deployment system is the WORST solution.
          Use this tool to find what already exists for your needs.
        </p>
      </div>

      {!isComplete ? (
        <div>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentStep + 1} of {questions.length}</span>
              <span>{Math.round((currentStep / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-6">{questions[currentStep].question}</h3>
            <div className="space-y-3">
              {questions[currentStep].options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(questions[currentStep].id, option.value)}
                  className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
                >
                  <span className="font-medium">{option.label}</span>
                  <ChevronRight className="text-gray-400 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </div>

          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="mt-4 text-blue-600 hover:underline"
            >
              ← Back
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-green-600">Your Solution</h2>
            <button
              onClick={reset}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Start Over
            </button>
          </div>

          <div className="mb-6 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h3 className="text-2xl font-bold mb-2">{recommendation.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-600">Setup Time:</span>
                <span className="ml-2 font-bold">{recommendation.setup}</span>
              </div>
              <div>
                <span className="text-gray-600">Cost:</span>
                <span className="ml-2 font-bold">{recommendation.cost}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-lg mb-3">Setup Steps:</h4>
            <ol className="space-y-2">
              {recommendation.steps.map((step, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-bold text-green-700 mb-2 flex items-center">
                <Check className="w-5 h-5 mr-2" /> Pros
              </h4>
              <ul className="space-y-1">
                {recommendation.pros.map((pro, idx) => (
                  <li key={idx} className="text-sm text-gray-700">• {pro}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-red-700 mb-2 flex items-center">
                <X className="w-5 h-5 mr-2" /> Cons
              </h4>
              <ul className="space-y-1">
                {recommendation.cons.map((con, idx) => (
                  <li key={idx} className="text-sm text-gray-700">• {con}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <p className="text-sm text-yellow-800">
              <strong>Time to value:</strong> You can have this running TODAY.
              Building custom infrastructure would take weeks and cost more to maintain.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploySolutionPicker;