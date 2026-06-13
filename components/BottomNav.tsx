import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BRAND } from '../constants/brand';

type BottomNavProps = {
  active?: 'home' | 'rooms' | 'create' | 'profile';
};

export default function BottomNav({ active = 'home' }: BottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      <Pressable style={styles.navButton} onPress={() => router.replace('/home' as any)}>
        <View style={[styles.homeIconBox, active === 'home' && styles.activeBox]}>
          <Text style={styles.homeIcon}>⌂</Text>
          <Text style={styles.homeIconText}>홈</Text>
        </View>
      </Pressable>

      <Pressable style={styles.navButton} onPress={() => router.push('/room-list' as any)}>
        <View style={[styles.chatBubbleIcon, active === 'rooms' && styles.activeBlueBox]}>
          <Text style={styles.chatBubbleText}>채팅방</Text>
          <View style={[styles.chatBubbleTail, active === 'rooms' && styles.activeBlueTail]} />
        </View>
      </Pressable>

      <Pressable style={styles.plusButton} onPress={() => router.push('/create-room' as any)}>
        <View style={[styles.plusBubbleIcon, active === 'create' && styles.activeBlueBox]}>
          <Text style={styles.plusBubbleText}>＋</Text>
          <View style={[styles.plusBubbleTail, active === 'create' && styles.activeBlueTail]} />
        </View>
      </Pressable>

      <Pressable style={styles.navButton} onPress={() => router.push('/profile' as any)}>
        <View style={[styles.profileIconBox, active === 'profile' && styles.activeBox]}>
          <Text style={styles.profileIcon}>👤</Text>
          <Text style={styles.profileIconText}>프로필</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    backgroundColor: BRAND.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 16,
    paddingTop: 8,
  },
  navButton: {
    flex: 1,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    flex: 1,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeIconBox: {
    width: 58,
    height: 42,
    borderRadius: 15,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBox: {
    transform: [{ scale: 1.04 }],
  },
  homeIcon: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: -3,
  },
  homeIconText: {
    color: BRAND.white,
    fontSize: 11,
    fontWeight: '900',
  },

  chatBubbleIcon: {
    width: 66,
    height: 38,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeBlueBox: {
    transform: [{ scale: 1.04 }],
  },
  chatBubbleText: {
    color: BRAND.white,
    fontSize: 11,
    fontWeight: '900',
  },
  chatBubbleTail: {
    position: 'absolute',
    bottom: -5,
    left: 17,
    width: 12,
    height: 12,
    backgroundColor: BRAND.blue,
    transform: [{ rotate: '45deg' }],
    borderBottomRightRadius: 3,
  },
  activeBlueTail: {
    backgroundColor: BRAND.blue,
  },

  plusBubbleIcon: {
    width: 66,
    height: 38,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plusBubbleText: {
    color: BRAND.white,
    fontSize: 26,
    fontWeight: '900',
    marginTop: -2,
  },
  plusBubbleTail: {
    position: 'absolute',
    bottom: -5,
    left: 17,
    width: 12,
    height: 12,
    backgroundColor: BRAND.blue,
    transform: [{ rotate: '45deg' }],
    borderBottomRightRadius: 3,
  },

  profileIconBox: {
    width: 58,
    height: 42,
    borderRadius: 15,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    color: BRAND.white,
    fontSize: 15,
    marginBottom: -2,
  },
  profileIconText: {
    color: BRAND.white,
    fontSize: 10,
    fontWeight: '900',
  },
});