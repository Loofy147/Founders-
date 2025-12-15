export const githubActionsAndroid = (config) => ({
  '.github/workflows/android-release.yml': `name: Android Release Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        distribution: 'zulu'
        java-version: '17'

    - name: Set up Flutter
      uses: subosito/flutter-action@v2
      with:
        flutter-version: '3.24.0'
        channel: 'stable'
        cache: true

    - name: Decode Keystore
      run: |
        echo "\${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > android/app/upload-keystore.jks

    - name: Create key.properties
      run: |
        echo "storeFile=upload-keystore.jks" > android/key.properties
        echo "storePassword=\${{ secrets.KEY_STORE_PASSWORD }}" >> android/key.properties
        echo "keyAlias=\${{ secrets.KEY_ALIAS }}" >> android/key.properties
        echo "keyPassword=\${{ secrets.KEY_PASSWORD }}" >> android/key.properties

    - name: Install dependencies
      run: flutter pub get

    - name: Run tests
      run: flutter test

    - name: Build APK
      run: flutter build apk --release

    - name: Build App Bundle
      run: flutter build appbundle --release

    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-release
        path: build/app/outputs/flutter-apk/app-release.apk

    - name: Create GitHub Release
      if: github.ref == 'refs/heads/main'
      uses: ncipollo/release-action@v1
      with:
        artifacts: "build/app/outputs/flutter-apk/app-release.apk"
        token: \${{ secrets.GITHUB_TOKEN }}
        tag: "v1.0.\${{ github.run_number }}"
        name: "Release v1.0.\${{ github.run_number }}"
        body: "Automated Android release"`,

    'README-DEPLOYMENT.md': `# Android Deployment Guide - ${config.projectName}

## GitHub Actions Setup (30 minutes)

### Step 1: Generate Keystore (One-time)
\`\`\`bash
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
\`\`\`

Save these values:
- Keystore password
- Key alias
- Key password

### Step 2: Convert Keystore to Base64
\`\`\`bash
base64 -i upload-keystore.jks | pbcopy
# On Linux: base64 upload-keystore.jks | xclip -selection clipboard
\`\`\`

### Step 3: Add GitHub Secrets
Go to your repo → Settings → Secrets and variables → Actions

Add these secrets:
- \`KEYSTORE_BASE64\` = (paste the base64 string)
- \`KEY_STORE_PASSWORD\` = your keystore password
- \`KEY_ALIAS\` = your key alias (usually "upload")
- \`KEY_PASSWORD\` = your key password

### Step 4: Configure Gradle (Already done if using this config)
The workflow handles this automatically.

### Step 5: Push and Deploy
\`\`\`bash
git add .
git commit -m "Add GitHub Actions"
git push origin main
\`\`\`

### Step 6: Download APK
1. Go to Actions tab in your repo
2. Click latest workflow run
3. Download artifact: "app-release"

## Automatic Builds
✅ Every push to \`main\` → APK built
✅ PRs → APK preview (optional)
✅ Releases → Tagged with version

## Play Store Upload (Optional)
To auto-upload to Play Store:
1. Get Play Store API credentials
2. Add to secrets
3. Uncomment upload step in workflow

## Troubleshooting
- Build fails: Check Flutter/Java versions
- Signing fails: Verify keystore secrets are correct
- Upload fails: Check artifact path

## Security Notes
⚠️ NEVER commit your keystore to Git
⚠️ Keep passwords in GitHub Secrets only
✅ Keystore is temporarily created during build
`
});
