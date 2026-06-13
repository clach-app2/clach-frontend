import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { BRAND } from '../constants/brand';

type Friend = {
  id: string;
  name: string;
  email?: string;
  score?: number;
};

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setMessage('');

      const saved = await AsyncStorage.getItem('clach_friends');
      const list = saved ? JSON.parse(saved) : [];

      if (Array.isArray(list)) {
        setFriends(list);
      } else {
        setFriends([]);
      }
    } catch {
      setFriends([]);
      setMessage('친구 목록을 불러오지 못했어요.');
    }
  };

  const addFriend = async () => {
    if (!friendName.trim()) {
      Alert.alert('입력 필요', '친구 이름을 입력해주세요.');
      return;
    }

    try {
      const newFriend: Friend = {
        id: Date.now().toString(),
        name: friendName.trim(),
        email: friendEmail.trim() || '',
        score: 0,
      };

      const nextList = [newFriend, ...friends];

      await AsyncStorage.setItem('clach_friends', JSON.stringify(nextList));

      setFriends(nextList);
      setFriendName('');
      setFriendEmail('');
      setMessage('친구가 추가되었습니다.');
    } catch {
      setMessage('친구 추가 중 문제가 발생했습니다.');
    }
  };

  const addTestFriend = async () => {
    try {
      const newFriend: Friend = {
        id: Date.now().toString(),
        name: `토론 친구 ${friends.length + 1}`,
        email: `friend${friends.length + 1}@clach.app`,
        score: 0,
      };

      const nextList = [newFriend, ...friends];

      await AsyncStorage.setItem('clach_friends', JSON.stringify(nextList));

      setFriends(nextList);
      setMessage('테스트 친구가 추가되었습니다.');
    } catch {
      setMessage('테스트 친구 추가 중 문제가 발생했습니다.');
    }
  };

  const removeFriend = (target: Friend) => {
    Alert.alert('친구 삭제', `${target.name}님을 친구 목록에서 삭제할까요?`, [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const nextList = friends.filter((item) => item.id !== target.id);

            await AsyncStorage.setItem('clach_friends', JSON.stringify(nextList));

            setFriends(nextList);
            setMessage('친구가 삭제되었습니다.');
          } catch {
            setMessage('친구 삭제 중 문제가 발생했습니다.');
          }
        },
      },
    ]);
  };

  const clearAllFriends = () => {
    if (friends.length === 0) {
      Alert.alert('친구 없음', '삭제할 친구가 없습니다.');
      return;
    }

    Alert.alert('전체 삭제', '친구 목록을 모두 삭제할까요?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '전체 삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('clach_friends');
            setFriends([]);
            setMessage('친구 목록을 모두 삭제했습니다.');
          } catch {
            setMessage('친구 목록 삭제 중 문제가 발생했습니다.');
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

          <Text style={styles.headerTitle}>친구</Text>

          <Pressable style={styles.headerButton} onPress={loadFriends}>
            <Text style={styles.refresh}>↻</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>DEBATE FRIENDS</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>친구</Text>
          <Text style={styles.heroTitle}>친구 목록</Text>
          <Text style={styles.heroText}>
            함께 토론할 친구를 추가하고 관리할 수 있습니다.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>친구 추가</Text>

        <TextInput
          style={styles.input}
          placeholder="친구 이름"
          placeholderTextColor="#777"
          value={friendName}
          onChangeText={setFriendName}
        />

        <TextInput
          style={styles.input}
          placeholder="친구 이메일 선택 입력"
          placeholderTextColor="#777"
          value={friendEmail}
          onChangeText={setFriendEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Pressable style={styles.addButton} onPress={addFriend}>
          <Text style={styles.addButtonText}>친구 추가하기</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>친구 목록</Text>

        <View style={styles.sectionRow}>
          <Text style={styles.countText}>총 {friends.length}명</Text>

          <Pressable style={styles.clearSmallButton} onPress={clearAllFriends}>
            <Text style={styles.clearSmallText}>전체 삭제</Text>
          </Pressable>
        </View>

        {friends.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>+</Text>
            </View>

            <Text style={styles.emptyTitle}>아직 친구가 없어요</Text>
            <Text style={styles.emptyText}>
              토론방에서 마음이 맞는 사람을 친구로 추가해보세요.
            </Text>
          </View>
        ) : (
          friends.map((friend) => (
            <View key={friend.id} style={styles.friendCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>●</Text>
              </View>

              <View style={styles.friendTextBox}>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendEmail}>
                  {friend.email || '이메일 없음'}
                </Text>
                <Text style={styles.friendScore}>점수 {friend.score || 0}</Text>
              </View>

              <Pressable style={styles.removeButton} onPress={() => removeFriend(friend)}>
                <Text style={styles.removeText}>삭제</Text>
              </Pressable>
            </View>
          ))
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>친구 기능 안내</Text>
          <Text style={styles.infoText}>• 친구 목록은 현재 기기에 저장됩니다.</Text>
          <Text style={styles.infoText}>• 서버 친구 기능은 다음 단계에서 API로 연결하면 됩니다.</Text>
          <Text style={styles.infoText}>• 토론 초대 기능과 연결할 수 있습니다.</Text>
        </View>

        <Pressable style={styles.blueButton} onPress={loadFriends}>
          <Text style={styles.blueButtonText}>친구 목록 새로고침</Text>
        </Pressable>

        <Pressable style={styles.yellowButton} onPress={addTestFriend}>
          <Text style={styles.yellowButtonText}>테스트 친구 추가</Text>
        </Pressable>

        <Pressable style={styles.blackButton} onPress={() => router.push('/room-list' as any)}>
          <Text style={styles.blackButtonText}>토론방으로 이동</Text>
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
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 32,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  input: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 18,
    color: BRAND.black,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: BRAND.white,
  },
  addButton: {
    marginTop: 6,
    height: 58,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  sectionRow: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: {
    color: BRAND.black,
    fontSize: 14,
    fontWeight: '900',
  },
  clearSmallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearSmallText: {
    color: BRAND.blue,
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
    fontSize: 30,
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
  friendCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
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
  friendTextBox: {
    flex: 1,
  },
  friendName: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  friendEmail: {
    color: BRAND.black,
    fontSize: 12,
    marginTop: 3,
  },
  friendScore: {
    color: BRAND.blue,
    fontSize: 12,
    marginTop: 5,
    fontWeight: '900',
  },
  removeButton: {
    backgroundColor: BRAND.yellow,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 10,
  },
  removeText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
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