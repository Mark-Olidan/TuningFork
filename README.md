# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## ACRCloud local wiring

This project uses a local server to keep ACRCloud secrets off the client.

1. Add ACRCloud secrets to `.env.backend.local`:

   ```bash
   ACR_HOST=identify-us-west-2.acrcloud.com
   ACR_ACCESS_KEY=your_access_key
   ACR_ACCESS_SECRET=your_access_secret
   ```

2. In `.env.local`, set your API base URL:

   ```bash
   # Android emulator
   EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8787
   ```

   For a physical device, use your machine LAN IP instead of `10.0.2.2`.

3. Start the identify server:

   ```bash
   npm run identify:server
   ```

4. In another terminal, start Expo:

   ```bash
   npx expo start -c
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
