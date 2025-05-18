import QRCode from "react-native-qrcode-svg";

import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/authContext";
import { useState } from "react";


export default function QRCodeScanner() {
  const router = useRouter();
  const { user } = useAuth();
  const [qrCodeValue, setQrCodeValue] = useState("");

  const createQRCodeData = () => {
    const data = {
      userId: user.userId,
      name: user.name,
      profileUrl: user.profileUrl,
    };
    return JSON.stringify(data);
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ position: "absolute", top: 50, left: 20 }}
      >
        <Text style={{ fontSize: 18, color: "blue" }}>Go Back</Text>
      </TouchableOpacity>
      <QRCode
        value="https://example.com"
        size={200}
        color="black"
        backgroundColor="white"
        logo={{ uri: user.profileUrl }}
        // logo = {require("../../assets/images/icon.png")}
        logoSize={20}
        logoBackgroundColor="transparent"
        />

    </View>
  );
}
