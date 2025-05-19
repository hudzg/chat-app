import React, { useMemo } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Text,
  Image,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import QRCode from "react-native-qrcode-svg";
import getAvatarUrl from "../../utils/getAvatarUrl";
import { get } from "firebase/database";

export default function MediaViewer() {
  const params = useLocalSearchParams();
  const { uri, type, qrData } = params;

  const qrDataObject = useMemo(() => {
    if (qrData) {
      try {
        return JSON.parse(qrData);
      } catch (error) {
        console.error("Error parsing QR data:", error);
        return null;
      }
    }
    return null;
  }, [qrData]);

  // console.log("profile url:", qrDataObject.profileUrl);
  if (qrData) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={hp(3)} color="gray" />
        </TouchableOpacity>
        <View style={styles.qrContainer}>
          <QRCode
            value={qrData}
            color="white"
            size={wp(80)}
            backgroundColor="black"
            logo={getAvatarUrl(qrDataObject.profileUrl)}
            logoSize={hp(4)}
          />
          {/* <Image source={{ uri: getAvatarUrl(qrDataObject.profileUrl) }} style={{width: hp(6)}}/> */}
          <Text style={{marginTop: 15, fontSize: 18, fontWeight: "bold"}}>{qrDataObject.username}</Text>
        </View>
        
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={hp(3)} color="white" />
      </TouchableOpacity>

      {type === "video" ? (
        <Video
          source={{ uri }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="contain"
          shouldPlay
          useNativeControls
          style={styles.media}
        />
      ) : (
        <Image source={{ uri }} style={styles.media} resizeMode="contain" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  qrContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
  },
  closeButton: {
    position: "absolute",
    top: hp(5),
    left: wp(5),
    zIndex: 10,
    padding: 10,
    opacity: 0.5,
  },
});
