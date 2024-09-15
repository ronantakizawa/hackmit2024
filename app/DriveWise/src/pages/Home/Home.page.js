import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  Button,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { FontAwesome5 } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import * as Location from "expo-location";
import { Accelerometer } from "expo-sensors";
import axios from "axios";
import Svg, { G, Path } from "react-native-svg";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const UPDATE_TIME = 100;
const OPENAI_API_KEY =
  "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"; // Replace with your OpenAI API key

const initialRegion = {
  latitude: 42.3581,
  longitude: -71.0964,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

const GOOGLE_MAPS_APIKEY = "AIzaSyAM9wBDTdoZsMKYAWCj-T35R_EnQlkigfg"; // Replace with your actual API key

const MapScreen = ({ navigation }) => {
  const [region, setRegion] = useState(initialRegion);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [route50Coordinates, setRoute50Coordinates] = useState([]);
  const [route75Coordinates, setRoute75Coordinates] = useState([]);
  const [dangerScore, setDangerScore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [startTracking, setStartTracking] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null); // Store current location
  const [locationSubscription, setLocationSubscription] = useState(null); // To track location updates
  const [heading, setHeading] = useState(0); // To track user's heading (compass)
  const [headingSubscription, setHeadingSubscription] = useState(null); // To track heading updates
  const [isActiveRoute, setIsActiveRoute] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [fullDrivingData, setFullDrivingData] = useState([]);
  const [intervalId, setIntervalId] = useState(null); // To store the interval ID
  const [{ x, y, z }, setData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const [accelerationSubscription, setAccelerationSubscription] =
    useState(null);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [loading, setLoading] = useState(false);
  const [suggestedDestination, setSuggestedDestination] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [speedData, setSpeedData] = useState([]);
  const [accidentCords, setAccidentCoords] = useState([]);

  const handleRegionChange = (region) => {
    // Assuming that a higher latitudeDelta implies a higher zoom level
    const newZoomLevel = Math.log2(360 / region.latitudeDelta);
    setZoomLevel(newZoomLevel);
  };
  const storeData = async () => {
    if (currentLocation) {
      setElapsedTime((prevTime) => prevTime + 100);
      const data = {
        timeStamp: new Date().toISOString(),
        location: currentLocation,
        acceleration: { x, y, z },
      };
      setFullDrivingData((prevData) => [...prevData, data]);
    }
  };
  const _subscribe = () => {
    Accelerometer.setUpdateInterval(UPDATE_TIME);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      setData({ x, y, z });
    });

    setAccelerationSubscription(subscription);
  };

  const _unsubscribe = () => {
    if (accelerationSubscription) {
      accelerationSubscription.remove();
      setAccelerationSubscription(null);
    }
  };

  useEffect(() => {
    _subscribe();
    return () => _unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: 1,
      });
      const headingPromise = Location.watchHeadingAsync((headingData) => {
        setHeading(headingData.trueHeading);
      });

      const [location] = await Promise.all([locationPromise, headingPromise]);

      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
      setStartLocation({ latitude, longitude });

      setRegion((prevRegion) => ({
        ...prevRegion,
        latitude,
        longitude,
      }));
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, []);

  const fetchRoutes = async (routeCoords) => {
    try {
      const routePromises = routeCoords.slice(0, -1).map((start, index) => {
        const end = routeCoords[index + 1];
        return fetchDirections(start, end);
      });
      const allRouteSegments = await Promise.all(routePromises);
      const allRouteCoordinates = allRouteSegments.flat(); // Combine all route segments into one array
      setRouteCoordinates(allRouteCoordinates);
      fitMapToCoordinates(allRouteCoordinates);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const fetch50Routes = async (routeCoords) => {
    try {
      const routePromises = routeCoords.slice(0, -1).map((start, index) => {
        const end = routeCoords[index + 1];
        return fetchDirections(start, end);
      });
      const allRouteSegments = await Promise.all(routePromises);
      const allRouteCoordinates = allRouteSegments.flat(); // Combine all route segments into one array
      setRoute50Coordinates(allRouteCoordinates);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };
  const fetch75Routes = async (routeCoords) => {
    try {
      const routePromises = routeCoords.slice(0, -1).map((start, index) => {
        const end = routeCoords[index + 1];
        return fetchDirections(start, end);
      });
      const allRouteSegments = await Promise.all(routePromises);
      const allRouteCoordinates = allRouteSegments.flat(); // Combine all route segments into one array
      setRoute75Coordinates(allRouteCoordinates);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const fetchDirections = async (start, end) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const data = await response.json();

      if (data.routes.length > 0) {
        return decodePolyline(data.routes[0].overview_polyline.points);
      }
      return [];
    } catch (error) {
      console.error("Error fetching directions:", error);
      return [];
    }
  };

  const handleBeginRoute = async () => {
    const locationSub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: UPDATE_TIME,
        distanceInterval: 0,
      },
      (location) => {
        const { latitude, longitude, speed } = location.coords;
        setCurrentLocation({ latitude, longitude });
        setRegion((prevRegion) => ({
          ...prevRegion,
          latitude,
          longitude,
          latitudeDelta: prevRegion.latitudeDelta, // Preserve the zoom level
          longitudeDelta: prevRegion.longitudeDelta, // Preserve the zoom level
        }));

        const speedInMph = (speed * 2.236).toFixed(0);

        if (speed >= 0) {
          const speedInMph = (speed * 2.23694).toFixed(0); // Convert from meters/second to mph
          setSpeed(speedInMph);
          setSpeedData((prevData) => [
            ...prevData,
            { speed: speedInMph, timeStamp: new Date().toISOString() },
          ]);
        } else {
          setSpeed(0); // If speed is negative, set it to 0
          setSpeedData((prevData) => [
            ...prevData,
            { speed: 0, timeStamp: new Date().toISOString() },
          ]);
        }
      }
    );

    setLocationSubscription(locationSub);
    if (currentLocation) {
      setIsActiveRoute(true);
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA / 40, // Adjust delta for zoom level
        longitudeDelta: LONGITUDE_DELTA / 40,
      });
      // Subscribe to accelerometer updates
      _subscribe();

      const id = setInterval(() => {
        storeData();
      }, 100);

      setIntervalId(id); // Save the interval ID to clear it later
    }
  };

  const handleEndRoute = () => {
    setIsActiveRoute(false);
    sendDataToBackend(fullDrivingData); // Send data to backend if needed
    if (intervalId) {
      clearInterval(intervalId); // Clear data collection interval
      setIntervalId(null); // Reset the interval ID
    }
    navigation.navigate("Summary", {
      elapsedTime,
      accelerationData: {
        x: x.toFixed(2),
        y: y.toFixed(2),
        z: z.toFixed(2),
      },
      speedData,
      ida: 0.75,
    });
    setElapsedTime(0);
  };

  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0,
      lat = 0,
      lng = 0;

    while (index < encoded.length) {
      let shift = 0,
        result = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  };

  const fitMapToCoordinates = (coordinates) => {
    const minLat = Math.min(...coordinates.map((c) => c.latitude));
    const maxLat = Math.max(...coordinates.map((c) => c.latitude));
    const minLng = Math.min(...coordinates.map((c) => c.longitude));
    const maxLng = Math.max(...coordinates.map((c) => c.longitude));

    const newRegion = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.2,
      longitudeDelta: (maxLng - minLng) * 1.2,
    };

    setRegion(newRegion);
  };

  const getDangerColor = () => {
    if (dangerScore !== null) {
      if (dangerScore <= 150) return "green";
      else if (dangerScore <= 320) return "yellow";
      else return "red";
    }
    return "gray";
  };

  const handleSetRoute = async () => {
    try {
      if (startLocation && endLocation) {
        const getRoute = await axios.post("http://127.0.0.1:5000/routes", {
          start_lat: currentLocation.latitude,
          start_long: currentLocation.longitude,
          end_lat: endLocation.latitude,
          end_long: endLocation.longitude,
          driver_skill: 1,
        });
        const get75Route = await axios.post("http://127.0.0.1:5000/routes", {
          start_lat: currentLocation.latitude,
          start_long: currentLocation.longitude,
          end_lat: endLocation.latitude,
          end_long: endLocation.longitude,
          driver_skill: 0.75,
        });
        const get50Route = await axios.post("http://127.0.0.1:5000/routes", {
          start_lat: currentLocation.latitude,
          start_long: currentLocation.longitude,
          end_lat: endLocation.latitude,
          end_long: endLocation.longitude,
          driver_skill: 0.5,
        });

        setDangerScore(get75Route.data.metrics[0].danger_score);

        const waypoints75 = get75Route.data.waypoints;
        const waypoints50 = get50Route.data.waypoints;
        const { waypoints, accidents } = getRoute.data;

        const everySeventhAccident = accidents.filter(
          (_, index) => (index + 1) % 53 === 0
        );
        // Change it to lat, long:
        const newSeventAccident = everySeventhAccident.map((point) => ({
          lat: point.latitude,
          long: point.longitude,
        }));
        setAccidentCoords(newSeventAccident);

        fetchRoutes(waypoints);
        fetch50Routes(waypoints50);
        fetch75Routes(waypoints75);

        handleBeginRoute();
      } else {
        Alert.alert("Please an end location.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendDataToBackend = async (data) => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/accel", {
        data: data,
      });
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <View style={styles.container}>
      {isLoading && (
        <View
          style={{
            backgroundColor: "rgba(0,0,0,0.75)",
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            zIndex: 1,
          }}
        />
      )}
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        region={region}
        onRegionChangeComplete={handleRegionChange}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {/* Show user's current location with a custom marker indicating heading */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={heading} // Apply heading value
          >
            <View
              style={[
                styles.arrowMarker,
                { transform: [{ rotate: `${heading}deg` }] }, // Apply heading rotation here
              ]}
            >
              <MaterialIcons
                name="arrow-forward-ios"
                size={36}
                color="white"
                style={{
                  transform: [{ rotate: `${-90}deg` }],
                }}
              />
            </View>
          </Marker>
        )}
        {accidentCords.map((coord, index) => {
          return (
            <Marker
              key={index}
              coordinate={{
                latitude: coord.lat,
                longitude: coord.long,
              }}
            >
              <View style={styles.redDot} />
            </Marker>
          );
        })}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={5}
            strokeColor="hotpink"
          />
        )}
        {route50Coordinates.length > 0 && (
          <Polyline
            coordinates={route50Coordinates}
            strokeWidth={5}
            strokeColor="blue"
          />
        )}
        {route75Coordinates.length > 0 && (
          <Polyline
            coordinates={route75Coordinates}
            strokeWidth={5}
            strokeColor="green"
          />
        )}
      </MapView>

      {isActiveRoute ? (
        <TouchableOpacity style={styles.completeRoute} onPress={handleEndRoute}>
          <Text style={styles.completeRouteText}>Complete Trip</Text>
          <MaterialIcons name="done" size={24} color="white" />
        </TouchableOpacity>
      ) : (
        <View style={styles.inputContainer}>
          <GooglePlacesAutocomplete
            placeholder="Search for end location"
            onPress={(data, details = null) => {
              if (details) {
                setEndLocation({
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                });
              }
            }}
            query={{
              key: GOOGLE_MAPS_APIKEY,
              language: "en",
            }}
            fetchDetails={true}
            styles={{
              textInput: styles.textInput,
            }}
          />
          <TouchableOpacity
            style={styles.setRouteButton}
            onPress={handleSetRoute}
          >
            <FontAwesome5 name="arrow-right" size={15} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {isLoading && (
        <View
          style={{
            width: "100%",
            height: "100%",
            zIndex: 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LottieView
            source={require("../../../assets/lottie/car-loading.json")}
            style={{
              width: "80%",
              height: "30%",
            }}
            autoPlay
            loop
          />
          <Text
            style={{
              color: "white",
              fontSize: 36,
            }}
          >
            Loading...
          </Text>
        </View>
      )}
      {dangerScore !== null && (
        <View style={styles.dangerPopup}>
          <View style={styles.row}>
            <FontAwesome5
              name="exclamation-triangle"
              size={24}
              color={getDangerColor()}
            />
            <Text style={styles.dangerText}>Danger Score: {dangerScore}</Text>
          </View>
        </View>
      )}
      {startTracking && startLocation && endLocation && (
        <View style={styles.trackingButton}></View>
      )}

      <Modal
        visible={loading || suggestedDestination !== null}
        transparent={true}
      >
        <View style={styles.modalContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>
                AI Generating driving route...
              </Text>
            </View>
          ) : (
            <View style={styles.suggestionContainer}>
              <ScrollView style={styles.scrollView}>
                <Text style={styles.suggestionText}>
                  {suggestedDestination}
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSuggestedDestination(null)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <View style={styles.outerContainer}>
        <View style={styles.innerContainer}>
          <Text style={styles.speed}>{speed}</Text>
          <Text style={styles.speedUnit}>MPH</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  arrowMarker: {
    backgroundColor: "#4CAF50",
    padding: 7.5,
    borderColor: "white",
    borderWidth: 2,
    borderRadius: 50,
  },

  dangerPopup: {
    position: "absolute",
    bottom: 100,
    left: 10,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  dangerText: {
    fontSize: 18,
    marginLeft: 10,
  },
  trackingButton: {
    position: "absolute",
  },
  row: {
    flexDirection: "row",
  },
  routeButton: {
    marginTop: 12,
  },
  routeButtonText: {
    color: "#4c76f5",
    fontSize: 18,
  },
  container: {
    flex: 1,
  },
  inputContainer: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 5,
    backgroundColor: "transparent",
  },
  textInput: {
    borderRadius: 10,
  },
  setRouteButton: {
    marginLeft: 10,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 3,
  },
  gptButton: {
    position: "absolute",
    bottom: 100,
    left: 10,
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  gptButtonText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16,
  },
  logo: {
    position: "absolute",
    bottom: 80,
    right: 0,
    width: 80,
    height: 60,
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 20,
    fontWeight: "bold",
  },
  suggestionContainer: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  scrollView: {
    maxHeight: 300,
  },
  suggestionText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  outerContainer: {
    backgroundColor: "black",
    padding: 5,
    position: "absolute",
    bottom: 100,
    right: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  innerContainer: {
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
  },
  speed: {
    fontSize: 32,
    fontWeight: "600",
  },
  speedUnit: {
    fontSize: 20,
  },
  completeRoute: {
    position: "absolute",
    top: 75,
    right: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingLeft: 10,
    paddingRight: 10,
  },
  completeRouteText: {
    color: "#ffffff",
    fontSize: 24,
    padding: 10,
  },
  redDot: {
    width: 15,
    height: 15,
    backgroundColor: "red",
    borderRadius: 100, // Half of the width and height to make it a circle
    borderWidth: 1,
    borderColor: "#fff",
  },
});

export default MapScreen;
