import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.subham.workout",
  appName: "Workout",
  webDir: "dist",
  android: {
    allowMixedContent: true,
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
      androidBiometric: { biometricAuth: false },
    },
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#1a1b1e",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
