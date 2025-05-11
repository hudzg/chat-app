import { View, Text, Platform, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { blurhash } from "../utils/common";
import { useAuth } from "../context/authContext";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from "react-native-popup-menu";
import { CustomMenuItem } from "./CustomMenuItem";
import { AntDesign, Feather } from "@expo/vector-icons";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from "expo-router";

const ios = Platform.OS === "ios";

export default function HomeHeader() {
  const { user, logout } = useAuth();
  const { top } = useSafeAreaInsets();
  const router = useRouter();

  const handleProfile = () => {
    router.push("/profile");
  };

  const handleSearchFriends = () => {
    router.push("/searchFriends");
  };

  const handleCreateGroup = () => {
    router.push("/createGroup");
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Chats</Text>
      <View style = {styles.buttonsContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={() => console.log("QR Code pressed")}>
          <MaterialIcons name="qr-code-scanner" size={20} color="mediumpurple" />
        </TouchableOpacity>
        <Menu>
          <MenuTrigger
            customStyles={{
              triggerWrapper: {},
            }}
          >
            <Image
              style={{ height: hp(4), aspectRatio: 1, borderRadius: 100 }}
              source={user?.profileUrl}
              placeholder={{ blurhash }}
              transition={1000}
            />
          </MenuTrigger>
          <MenuOptions
            optionsContainerStyle={{
              borderRadius: 10,
              borderCurve: "continuous",
              marginTop: 30,
              marginLeft: -30,
              backgroundColor: "white",
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 0 },
              width: 160,
            }}
          >
            <CustomMenuItem
              text="Profile"
              action={handleProfile}
              value={null}
              icon={<Feather name="user" size={hp(2.5)} color="#737373" />}
            />
            <Divider />
            <Divider />
            <CustomMenuItem
              text="Create Group"
              action={handleCreateGroup}
              value={null}
              icon={<Feather name="users" size={hp(2.5)} color="#737373" />}
            />
            <Divider />
            <CustomMenuItem
              text="Friend Requests"
              action={() => router.push("/friendRequests")}
              value={null}
              icon={<Feather name="user-plus" size={hp(2.5)} color="#737373" />}
            />
            <Divider />
            <CustomMenuItem
              text="Sign Out"
              action={handleLogout}
              value={null}
              icon={<AntDesign name="logout" size={hp(2.5)} color="#737373" />}
            />
          </MenuOptions>
        </Menu>
      </View>
    </View>
  );
}

const Divider = () => {
  return <View className="p-[1px] w-full bg-neutral-200" />;
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingTop: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    paddingTop: 10,
    fontSize: 24,
    fontWeight: 'bold',
    color: "mediumpurple"
  },
  buttonsContainer: {
    flexDirection: "row",
    paddingTop: 10,
    
  },
  iconButton: {
    paddingTop: 4,
    marginRight: 18,
  },
});
