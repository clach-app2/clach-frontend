import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { BRAND } from '../constants/brand';

type BlockedUser = {
  id: string;
  name: string;
  email?: string;
  reason?: string;
  createdAt?: string;
};

export default function BlockedUsersScreen() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setMessage('');

      const saved = await AsyncStorage.getItem('clach_blocked_users');
      const list = saved ? JSON.parse(saved) : [];

      if (Array.isArray(list)) {
        setBlockedUsers(list);
      } else {
        setBlockedUsers([]);
      }
    } catch {
      setBlockedUsers([]);
      setMessage('차단 목록을 불러오지 못했어요.');
    }
  };

  const unblockUser = (target: BlockedUser) => {
    Alert.alert('차단 해제', `${target.name}님을 차단 해제할까요?`, [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '해제',
        onPress: async () => {
          try {
            const nextList = blockedUsers.filter((user) => user.id !== target.id);

            await AsyncStorage.setItem('clach_blocked_users', JSON.stringify(nextList));
            setBlockedUsers(nextList);
            setMessage('차단이 해제되었습니다.');
          } catch {
            setMessage('차단 해제 중 문제가 발생했습니다.');
          }
        },
      },
    ]);
  };

  const clearAll = () => {
    if (blockedUsers.length === 0) {
      Alert.alert('차단 목록 없음', '차단한 사용자가 없습니다.');
      return;
    }

    Alert.alert('전체 차단 해제', '차단 목록을 모두 비울까요?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '전체 해제',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('clach_blocked_users');
            setBlockedUsers([]);
            setMessage('차단 목록을 모두 비웠습니다.');
          } catch {
            setMessage('전체 차단 해제 중 문제가 발생했습니다.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>차단한 사용자</Text>

          <Pressable style={styles.headerButton} onPress={loadBlockedUsers}>
            <Text style={styles.refresh}>↻</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>BLOCKED USERS</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>차단</Text>
          <Text style={styles.heroTitle}>차단한 사용자</Text>
          <Text style={styles.heroText}>
            내가 차단한 사용자를 확인하고 필요하면 차단을 해제할 수 있습니다.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>차단 기능 안내</Text>
          <Text style={styles.infoText}>• 차단한 사용자의 메시지는 보이지 않게 처리할 수 있습니다.</Text>
          <Text style={styles.infoText}>• 차단 해제하면 다시 메시지를 볼 수 있습니다.</Text>
          <Text style={styles.infoText}>• 신고가 필요한 경우 신고 기능을 함께 사용하세요.</Text>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>차단 목록</Text>

          <Pressable style={styles.clearButton} onPress={clearAll}>
            <Text style={styles.clearText}>전체 해제</Text>
          </Pressable>
        </View>

        {blockedUsers.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>○</Text>
            </View>

            <Text style={styles.emptyTitle}>차단한 사용자가 없어요</Text>
            <Text style={styles.emptyText}>
              토론방에서 사용자를 차단하면 여기에 표시됩니다.
            </Text>
          </View>
        ) : (
          blockedUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>●</Text>
              </View>

              <View style={styles.userTextBox}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email || '이메일 없음'}</Text>
                <Text style={styles.userReason}>{user.reason || '차단 사유 없음'}</Text>
              </View>

              <Pressable style={styles.unblockButton} onPress={() => unblockUser(user)}>
                <Text style={styles.unblockText}>해제</Text>
              </Pressable>
            </View>
          ))
        )}

        <Pressable style={styles.blueButton} onPress={loadBlockedUsers}>
          <Text style={styles.blueButtonText}>목록 새로고침</Text>
        </Pressable>

        <Pressable style={styles.blackButton} onPress={() => router.push('/my-reports' as any)}>
          <Text style={styles.blackButtonText}>신고 내역 보기</Text>
        </Pressable>

        <Pressable style={styles.outlineButton} onPress={() => router.back()}>
          <Text style={styles.outlineText}>돌아가기</Text>
        </Pressable>

        <Pressable style={styles.homeButton} onPress={() => router.replace('/home' as any)}>
          <Text style={styles.homeButtonText}>홈으로 이동</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navButton} onPress={() => router.replace('/home' as any)}>
          <Text style={styles.navItem}>홈</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={() => router.push('/room-list' as any)}>
          <Text style={styles.navItem}>탐색</Text>
        </Pressable>

        <Pressable style={styles.plusButton} onPress={() => router.push('/create-room' as any)}>
          <Text style={styles.navPlus}>＋</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={() => router.push('/profile' as any)}>
          <Text style={styles.navItem}>프로필</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  container: {
    paddingTop: 54,
    paddingHorizontal: 24,
    paddingBottom: 130,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 56,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    color: BRAND.black,
    fontSize: 42,
    fontWeight: '300',
  },
  headerTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  refresh: {
    color: BRAND.blue,
    fontSize: 26,
    fontWeight: '900',
  },
  brandBox: {
    marginTop: 28,
    marginBottom: 24,
  },
  logo: {
    color: BRAND.black,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 11,
  },
  slogan: {
    marginTop: 8,
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  heroCard: {
    borderRadius: 26,
    backgroundColor: BRAND.blue,
    padding: 24,
  },
  heroLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  heroTitle: {
    color: BRAND.white,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 10,
  },
  heroText: {
    color: BRAND.white,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
  },
  noticeCard: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    padding: 16,
  },
  noticeTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  noticeText: {
    color: BRAND.black,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
  infoCard: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 18,
  },
  infoTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  infoText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 24,
  },
  sectionRow: {
    marginTop: 32,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: BRAND.blue,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearText: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 22,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIconText: {
    color: BRAND.black,
    fontSize: 28,
    fontWeight: '900',
  },
  emptyTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: BRAND.black,
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
  },
  userCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: BRAND.white,
    fontSize: 18,
  },
  userTextBox: {
    flex: 1,
  },
  userName: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  userEmail: {
    color: BRAND.black,
    fontSize: 12,
    marginTop: 3,
  },
  userReason: {
    color: BRAND.blue,
    fontSize: 12,
    marginTop: 5,
    fontWeight: '800',
  },
  unblockButton: {
    backgroundColor: BRAND.yellow,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 10,
  },
  unblockText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  blueButton: {
    marginTop: 28,
    height: 58,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  yellowButton: {
    marginTop: 14,
    height: 58,
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yellowButtonText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  blackButton: {
    marginTop: 14,
    height: 58,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  outlineButton: {
    marginTop: 14,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  homeButton: {
    marginTop: 14,
    height: 56,
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 92,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    backgroundColor: BRAND.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 18,
  },
  navButton: {
    flex: 1,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    flex: 1,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItem: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '700',
  },
  navPlus: {
    color: BRAND.black,
    fontSize: 30,
    fontWeight: '900',
  },
});