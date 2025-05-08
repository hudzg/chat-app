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
import { sendGroupMessage } from "../../components/GroupActions";
import { useAuth } from "../../context/authContext";
import { Feather } from "@expo/vector-icons";

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { convertTypeAcquisitionFromJson } from "typescript";

export default function Maps() {
  const { groupId, latitude, longitude, viewOnly } = useLocalSearchParams();
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let current = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      if (viewOnly === "true" && latitude && longitude) {
        const sharedLocation = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setLocation(sharedLocation);

        const dist = calculateDistance(current.coords, sharedLocation);
        setDistance(dist);
      } else {
        setLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    })();
  }, [latitude, longitude, viewOnly]);

  const calculateDistance = (currentLocation, sharedLocation) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = toRad(sharedLocation.latitude - currentLocation.latitude);
    const dLon = toRad(sharedLocation.longitude - currentLocation.longitude);
    const lat1 = toRad(currentLocation.latitude);
    const lat2 = toRad(sharedLocation.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Khoảng cách tính bằng km

    return distance.toFixed(2); // Làm tròn đến 2 chữ số thập phân
  };

  const handleSendLocation = async () => {
    if (!location) {
      Alert.alert("Error", "Location not available yet");
      return;
    }
    // console.log("Sending location:", location);

    try {
      await sendGroupMessage(groupId, {
        userId: user.userId,
        type: "location",
        latitude: location.latitude,
        longitude: location.longitude,
        text: "Shared a location",
        createdAt: new Date(),
      });
      Alert.alert("Success", "Location sent successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to send location");
      console.error("Error sending location:", error);
    }
  };

  let content;
  if (errorMsg) {
    content = <Text>{errorMsg}</Text>;
  } else if (location) {
    content = (
      <View>
        <MapView
          style={styles.map}
          initialRegion={location}
          showsUserLocation={true}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          showsCompass={false}
          showsMyLocationButton={true}

        >
          {viewOnly === "true" && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={"Shared Location"}
            />
          )}
          {viewOnly === "true" && currentLocation && location && (
            <Polyline
              coordinates={[
                {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                },
                {
                  latitude: location.latitude,
                  longitude: location.longitude,
                },
              ]}
              strokeColor="blue"
              strokeWidth={5}
              lineDashPattern={[5, 5]} 
            />
          )}
        </MapView>
        {viewOnly === "true" && distance && (
          <View style={styles.distanceTextContainer}>
          <Text style={styles.distanceText}>
            Distance to shared location: {distance} km
          </Text>
        </View>        
        )}
      </View>
    );
  } else {
    content = (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="gray" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Feather name="arrow-left" size={hp(3)} color="#000" />
      </TouchableOpacity>
      {currentLocation && (
        <View style={styles.coordDisplay}>
          <Text style={styles.coordText}>
            Your Location:
          </Text>
          <Text style={styles.coordText}>
            {currentLocation.latitude.toFixed(6)}
          </Text>
          <Text style={styles.coordText}>
            {currentLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}
      {content}
      {location && viewOnly !== "true" && (
        <View>
          <TouchableOpacity
            onPress={handleSendLocation}
            style={styles.sendButton}
          >
            <Feather name="send" size={hp(2.7)} color="#fff" />
            <Text style={styles.sendButtonText}>Send Location</Text>
          </TouchableOpacity>
        </View>
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
