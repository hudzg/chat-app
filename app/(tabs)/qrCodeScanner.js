import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState, useEffect } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/authContext";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Dimensions } from "react-native";

export default function QrCodeScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanAnimation] = useState(new Animated.Value(0));
  const router = useRouter();
  const { user } = useAuth();

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const SCAN_AREA_SIZE = 280;
  const VERTICAL_OFFSET = 150;
  
  const scanBounds = {
    x: (SCREEN_WIDTH - SCAN_AREA_SIZE) / 2,
    y: (SCREEN_HEIGHT - SCAN_AREA_SIZE) / 2 - VERTICAL_OFFSET,
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Camera access is required to scan QR codes",
          [
            { text: "OK", onPress: () => router.back() }
          ]
        );
      }
    };

    if (!permission?.granted) {
      getCameraPermission();
    }
  }, [permission]);

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera" size={64} color="#cccccc" />
        <Text style={styles.permissionText}>No camera access permission</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => requestPermission()}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDataScanned = ({data}) => {
    try {
      const userData = JSON.parse(data);
      if (userData.type === 'friendRequest') {
        if (userData.userId === user.userId) {
          Alert.alert("Error", "You cannot scan your own QR code");
          return;
        }

        router.push({
          pathname: "/otherUsersProfile",
          params: {
            userId: userData.userId,
            username: userData.username,
            profileUrl: userData.profileUrl,
            bio: userData.bio,
            openByQRCode: true
          }
        });
      }
    } catch (error) {
      console.error("Error scanning QR code:", error);
      Alert.alert("Error", "Invalid QR code");
    }
  }

  const scanLineAnimation = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_AREA_SIZE]
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleDataScanned}
        barCodeScannerSettings={{
          barCodeTypes: ['qr'],
          rectOfInterest: {
            x: scanBounds.x / SCREEN_WIDTH,
            y: scanBounds.y / SCREEN_HEIGHT,
            width: scanBounds.width / SCREEN_WIDTH,
            height: scanBounds.height / SCREEN_HEIGHT,
          }
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={28} color="white"/>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>QR Code Scanner</Text>
          </View>

          <View style={[styles.mask, { height: scanBounds.y }]} />
          
          <View style={{ flexDirection: 'row', height: SCAN_AREA_SIZE }}>
            <View style={[styles.mask, { width: scanBounds.x }]} />
            
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              <Animated.View 
                style={[
                  styles.scanLine,
                  {
                    transform: [{ translateY: scanLineAnimation }]
                  }
                ]} 
              />
            </View>
            
            <View style={[styles.mask, { width: scanBounds.x }]} />
          </View>
          
          <View style={[styles.mask, { height: SCREEN_HEIGHT - scanBounds.y - SCAN_AREA_SIZE, justifyContent: 'flex-start', paddingTop: 30 }]}>
            <Text style={styles.scannerText}>
              Position QR code within frame
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 15,
  },
  backButton: {
    padding: 8,
    opacity: 0.5,
  },
  mask: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  scanLine: {
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(0, 230, 64, 0.8)',
    position: 'absolute',
    top: 0,
    shadowColor: "#00e640",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 10,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#00e640',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderBottomRightRadius: 12,
  },
  scannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 20,
  },
  rescanButton: {
    marginTop: 25,
    backgroundColor: '#00e640',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 50,
    alignSelf: 'center',
  },
  rescanText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#00e640',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 50,
  },
  permissionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  }
});