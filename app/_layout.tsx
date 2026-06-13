import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: '#FFFFFF',
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="home" />
        <Stack.Screen name="room-list" />
        <Stack.Screen name="create-room" />
        <Stack.Screen name="chat-room" />
        <Stack.Screen name="report" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="delete-account" />
        <Stack.Screen name="ranking" />
        <Stack.Screen name="contact" />
        <Stack.Screen name="my-contacts" />
        <Stack.Screen name="my-reports" />
        <Stack.Screen name="blocked-users" />
        <Stack.Screen name="admin-reports" />
        <Stack.Screen name="admin-contacts" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="check" />
        <Stack.Screen name="guide" />
        <Stack.Screen name="summary" />
        <Stack.Screen name="premium" />
        <Stack.Screen name="premium-profile" />
        <Stack.Screen name="friends" />
        <Stack.Screen name="voice-room" />
      </Stack>
    </>
  );
}