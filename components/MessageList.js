import { ScrollView } from "react-native";
import React from "react";
import MessageItem from "./MessageItem";

export default function MessageList({
  scrollViewRef,
  messages,
  currentUser,
  isGroup,
  onDeleteMessage,
}) {

  const visibleMessages = messages.filter(
    message  => !message.deletedFor?.includes(currentUser.userId)
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 10 }}
    >
      {visibleMessages.map((message, index) => (
        <MessageItem
          message={message}
          currentUser={currentUser}
          key={index}
          isGroup={isGroup}
          onDeleteMessage={onDeleteMessage}
        />
      ))}
    </ScrollView>
  );
}
