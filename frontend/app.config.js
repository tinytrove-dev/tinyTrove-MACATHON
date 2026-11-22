// app.json can't read .env, so the Maps key is added here to keep it out of git
module.exports = ({ config }) => {
  const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!mapsApiKey) {
    console.warn("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set, so maps will be blank");
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      [
        "react-native-maps",
        { iosGoogleMapsApiKey: mapsApiKey, androidGoogleMapsApiKey: mapsApiKey },
      ],
    ],
  };
};
