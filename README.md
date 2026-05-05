# Dayflow

Dayflow is an Expo app for logging daily wins, mood, and reflections. This project is configured for Expo Application Services (EAS) so you can generate the Android `.apk` needed for your final exam submission.

## Local development

```bash
npm install
npx expo start
```

## Environment variables

The app expects these public Expo variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GEMINI_API_KEY`

For local development, keep them in `.env.local`.

For EAS cloud builds, add the same values in your Expo project dashboard under Environment Variables before starting the build.

## Build the exam APK

1. Log in to Expo:

   ```bash
   npx eas-cli login
   ```

2. Initialize EAS for this project if you have not done it yet:

   ```bash
   npm run eas:configure
   ```

   If EAS asks to create or link a project, choose `Yes`.

3. Start the Android APK build:

   ```bash
   npm run build:apk
   ```

   This uses the `preview` build profile in `eas.json`, which is configured to generate an installable `.apk`.

4. Wait for the build to finish in the Expo dashboard.

## What to submit for the final exam

Your instructor asked for:

1. A screenshot of your Expo dashboard in the Build module with the `Install` button visible.
2. The generated `.apk` file.

After the Android build finishes:

- Open your Expo project dashboard.
- Go to `Builds`.
- Open the successful Android `preview` build.
- Take a screenshot that clearly shows the `Install` button.
- Download the `.apk` from the same build page.

## Notes

- `preview` produces an `.apk`, which is what you need for direct installation and classroom submission.
- `production` is configured for an Android App Bundle (`.aab`) and is not the file your instructor asked for.
- If local Expo commands warn about Node, update Node.js to `20.19.4` or newer for the smoothest tooling experience.
