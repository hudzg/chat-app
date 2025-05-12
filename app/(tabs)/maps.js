import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  Text,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useLocalSearchParams, router } from "expo-router";
import { doc, collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getRoomId } from "../../utils/common";
import { sendGroupMessage } from "../../components/GroupActions";
import { useAuth } from "../../context/authContext";
import { Feather } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

export default function Maps() {
  const { groupId, chatRoomId, latitude, longitude, viewOnly } = useLocalSearchParams();
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [sharedLocation, setSharedLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);

  // console.log("this is roomIddddddddddđ", chatRoomId);

  useEffect(() => {
    setupLocation();
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [latitude, longitude, viewOnly]);

  const setupLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable GPS in your device."
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentLocationData = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setCurrentLocation(currentLocationData);

      if (viewOnly === "true" && latitude && longitude) {
        const sharedLocationData = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setSharedLocation(sharedLocationData);
        const dist = calculateDistance(current.coords, sharedLocationData);
        setDistance(dist);
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          const updatedLocation = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setCurrentLocation(updatedLocation);

          if (viewOnly === "true" && sharedLocation) {
            const newDist = calculateDistance(newLocation.coords, sharedLocation);
            setDistance(newDist);
          }
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error("Error getting location:", error);
      setErrorMsg("Error getting location");
    }
  };

  const calculateDistance = (currentLocation, sharedLocation) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371;
    const dLat = toRad(sharedLocation.latitude - currentLocation.latitude);
    const dLon = toRad(sharedLocation.longitude - currentLocation.longitude);
    const lat1 = toRad(currentLocation.latitude);
    const lat2 = toRad(sharedLocation.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance.toFixed(2);
  };

  const handleSendLocation = async () => {
    if (!currentLocation) {
      Alert.alert("Error", "Location not available yet");
      return;
    }
    try {
      const locationData = {
        userId: user?.userId,
        type: "location",
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        text: "Shared a location",
        createdAt: Timestamp.fromDate(new Date()),
      };

      if (groupId && !chatRoomId) {
        //gui trong group-chat
        await sendGroupMessage(groupId, locationData);
      } else if (chatRoomId && !groupId) {
        //gui trong chat-room
        const docRef = doc(db, "rooms", chatRoomId);
        const messageRef = collection(docRef, "messages");
        await addDoc(messageRef, {
          ...locationData,
          profileUrl: user?.profileUrl,
          senderName: user?.username,
        });
      }

      Alert.alert("Success", "Location sent successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Error sending location:", error);
      Alert.alert("Error", "Failed to send location");
    }
  };

  const renderMap = () => (
    <MapView
      style={styles.map}
      initialRegion={currentLocation}
      showsUserLocation={true}
      scrollEnabled={true}
      zoomEnabled={true}
      pitchEnabled={true}
      rotateEnabled={true}
      showsCompass={true}
      showsMyLocationButton={true}
      followsUserLocation={true}
    >
      {viewOnly === "true" && sharedLocation && (
        <>
          <Marker
            coordinate={sharedLocation}
            title="Shared Location"
          />
          <Polyline
            coordinates={[currentLocation, sharedLocation]}
            strokeColor="blue"
            strokeWidth={5}
            lineDashPattern={[5, 5]}
          />
        </>
      )}
    </MapView>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Feather name="arrow-left" size={hp(3)} color="#000" />
      </TouchableOpacity>
      
      {currentLocation && (
        <View style={styles.coordDisplay}>
          <Text style={styles.coordText}>Your Location:</Text>
          <Text style={styles.coordText}>
            {currentLocation.latitude.toFixed(6)}
          </Text>
          <Text style={styles.coordText}>
            {currentLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {errorMsg ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500">{errorMsg}</Text>
        </View>
      ) : !currentLocation ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="gray" />
        </View>
      ) : (
        <>
          {renderMap()}
          {viewOnly === "true" && distance && (
            <View style={styles.distanceTextContainer}>
              <Text style={styles.distanceText}>
                Distance to shared location: {distance} km
              </Text>
            </View>
          )}
        </>
      )}

      {currentLocation && viewOnly !== "true" && (
        <TouchableOpacity
          onPress={handleSendLocation}
          style={styles.sendButton}
        >
          <Feather name="send" size={hp(2.7)} color="#fff" />
          <Text style={styles.sendButtonText}>Send Location</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  sendButton: {
    position: "absolute",
    bottom: hp(2),
    right: wp(2),
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: hp(2),
    marginLeft: wp(1),
  },
  distanceTextContainer: {
    position: "absolute",
    bottom: hp(8),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  distanceText: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    padding: wp(2),
    borderRadius: 5,
    fontSize: hp(2),
  },
  backButton: {
    position: "absolute",
    top: hp(4),
    left: wp(4),
    opacity: 0.5,
    backgroundColor: "white",
    padding: wp(2),
    borderRadius: 30,
    zIndex: 1,
  },
  coordDisplay: {
    position: "absolute",
    top: hp(8),
    right: wp(3),
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    padding: wp(2),
    borderRadius: 5,
    zIndex: 10,
  },
  coordText: {
    fontSize: hp(1.8),
    color: "#000",
  },
});
