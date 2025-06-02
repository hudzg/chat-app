import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../context/authContext";
import { addMembersToGroup } from "../../components/GroupActions";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function GroupProfile() {
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const { groupId, groupName, admin, members, openByQRCode } = params;
    const membersList = members ? JSON.parse(members) : [];
    const [membersCount, setMembersCount] = useState(0);

    useEffect(() => {
        fetchGroupDetails();
    }, []);

    const fetchGroupDetails = async () => {
        try {
            const groupRef = doc(db, "groups", groupId);
            const groupDoc = await getDoc(groupRef);
            if (groupDoc.exists()) {
                const groupData = groupDoc.data();
                setMembersCount(groupData.members?.length || 0);
            }
        } catch (error) {
            console.error("Error fetching group details:", error);
        }
    };

    const handleJoinGroup = async () => {
        try {
            if (membersList.includes(user.userId)) {
                Alert.alert("Error", "You are already a member of this group");
                return;
            }

            await addMembersToGroup(groupId, [user.userId]);
            Alert.alert(
                "Success",
                "You have joined the group successfully",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.replace("/(tabs)/home");
                        }
                    }
                ]
            );
        } catch (error) {
            console.error("Error joining group:", error);
            Alert.alert("Error", "Failed to join group");
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={hp(3)} color="gray" />
            </TouchableOpacity>

            <View style={styles.groupInfo}>
                <Image style={styles.profileImage}
                    source={require('../../assets/images/group-icon.png')}

                />
                <Text style={styles.groupName}>{groupName}</Text>
                <Text style={styles.membersCount}>
                    {membersCount} {membersCount === 1 ? 'member' : 'members'}
                </Text>
            </View>

            <TouchableOpacity
                style={styles.joinButton}
                onPress={handleJoinGroup}
            >
                <Text style={styles.joinButtonText}>Join Group</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        paddingTop: 60,
        backgroundColor: 'white',
    },
    closeButton: {
        position: "absolute",
        top: hp(5),
        left: wp(5),
        zIndex: 10,
        padding: 10,
        opacity: 0.5,
    },
    groupInfo: {
        alignItems: 'center',
        marginTop: hp(10),
    },
    profileImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
        marginTop: 120,
    },
    groupInitial: {
        fontSize: hp(6),
        color: 'white',
        fontWeight: 'bold',
    },
    groupName: {
        fontSize: hp(3),
        fontWeight: "bold",
        marginBottom: hp(1),
    },
    membersCount: {
        fontSize: hp(2),
        color: '#666',
        marginBottom: hp(4),
    },
    joinButton: {
        backgroundColor: "mediumpurple",
        paddingHorizontal: wp(10),
        paddingVertical: hp(1.5),
        borderRadius: 25,
        marginTop: hp(2),
    },
    joinButtonText: {
        color: "white",
        fontSize: hp(2),
        fontWeight: "bold",
    },
});