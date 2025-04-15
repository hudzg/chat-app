import { ScrollView } from "react-native";
import React from "react";
import MessageItem from "./MessageItem";

export default function MessageList({ scrollViewRef, messages, currentUser }) {
  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 10 }}
    >
      {messages.map((message, index) => (
        <MessageItem message={message} currentUser={currentUser} key={index} />
      ))}
    </ScrollView>
  );
}
