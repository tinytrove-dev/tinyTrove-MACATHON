import * as Location from "expo-location";

// The user's current position for a post check, or null if they declined location
// or it isn't available. The server decides whether it's close enough to the store.
export const getCheckLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy };
  } catch (err) {
    console.log("Location Error: ", err);
    return null;
  }
};
