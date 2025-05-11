import { query, getDocs, collection, where, onSnapshot } from "firebase/firestore";

import { printDatabase } from "./printDB";
import { db } from "../firebaseConfig";

export const getUser = async (userId) => {
    //console.log(userId);
    //printDatabase("users");
    const q = query(
        collection(db, 'users'),
        where ("userId", "==",  userId)
    );
    const snapShot = await getDocs(q);
    //console.log(snapShot)
    //const data = snapShot.map(doc => ({ id: doc.id, ...doc.data() }));
    let data = [];
    snapShot.forEach((doc) => {
        //console.log(doc.id, " => ", doc.data());
        data.push(doc.data());
    });
    //console.log(data[0]);
    return data[0]
};

export const getAllOtherUser = async (userId) => {
    const q = query(
        collection(db, 'users'),
        where ("userId", "!=",  userId)
    );
    const snapShot = await getDocs(q);

    let data = [];
    snapShot.forEach((doc) => {

        data.push(doc.data());
    });
    //console.log(data);
    return data;
}

export const getAllFriends = async (userId) => {
    let data = [];

    const q1 = query(
        collection(db, 'friends'),
        where ("userId1", "==",  userId)
    );
    const snapShot1 = await getDocs(q1);
    snapShot1.forEach((doc) => {
        data.push(doc.data().userId2);
    });

    const q2 = query(
        collection(db, 'friends'),
        where ("userId2", "==",  userId)
    );
    const snapShot2 = await getDocs(q2);
    snapShot2.forEach((doc) => {
        data.push(doc.data().userId1);
    });
    data = [...new Set(data)];
    //console.log(data)
    return data
}