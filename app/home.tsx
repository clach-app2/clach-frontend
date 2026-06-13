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
import BottomNav from '../components/BottomNav';
type User = {
  name?: string;
  nickname?: string;
  email?: string;
  isPremium?: boolean;
  score?: number;
};

export default function HomeScreen() {
  const [user, setUser] = useState<User>({
    name: '토론가',
    email: '',
    isPremium: false,
    score: 0,
  });

  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('clach_user');
      const premiumValue = await AsyncStorage.getItem('clach_premium');

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);

        setUser({
          name: parsedUser.name || parsedUser.nickname || '토론가',
          nickname: parsedUser.nickname || parsedUser.name || '토론가',
          email: parsedUser.email || '',
          isPremium: parsedUser.isPremium === true,
          score: Number(parsedUser.score || 0),
        });

        setIsPremium(parsedUser.isPremium === true || premiumValue === 'true');
      } else {
        setIsPremium(premiumValue === 'true');
      }
    } catch {
      console.log('사용자 정보 불러오기 실패');
    }
  };

  const getDisplayName = () => {
    return user.name || user.nickname || '토론가';
  };

  const startTextRoom = () => {
    router.push({
      pathname: '/create-room' as any,
      params: {
        roomType: 'text',
      },
    });
  };

  const startVoiceRoom = () => {
    router.push({
      pathname: '/create-room' as any,
      params: {
        roomType: 'voice',
      },
    });
  };

  const openAiGuide = () => {
    router.push('/guide' as any);
  };

  const logout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃할까요?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('clach_user');
          await AsyncStorage.removeItem('clach_token');
          router.replace('/login' as any);
        },
      },
    ]);
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>CLACH</Text>
            <Text style={styles.slogan}>AI DEBATE PLATFORM</Text>
          </View>

          <Pressable style={styles.profileMini} onPress={() => router.push('/profile' as any)}>
            <Text style={styles.profileMiniText}>
              {getDisplayName().slice(0, 1)}
            </Text>
          </Pressable>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeLabel}>WELCOME</Text>
          <Text style={styles.welcomeTitle}>
            {getDisplayName()}님,{'\n'}바로 토론을 시작해볼까요?
          </Text>
          <Text style={styles.welcomeText}>
            관심 있는 주제로 토론방을 만들고, AI 요약과 중재자로 더 좋은 토론을 만들어보세요.
          </Text>

          <View style={styles.userInfoRow}>
  <Pressable
    style={styles.userInfoPill}
    onPress={() => router.push('/profile' as any)}
  >
    <Text style={styles.userInfoLabel}>내 점수</Text>
    <Text style={styles.userInfoValue}>{Number(user.score || 0)}점</Text>
  </Pressable>

  {isPremium ? (
    <Pressable
      style={styles.premiumPill}
      onPress={() => router.push('/premium' as any)}
    >
      <Text style={styles.premiumPillText}>PREMIUM</Text>
    </Pressable>
  ) : (
    <Pressable
      style={styles.upgradePill}
      onPress={() => router.push('/premium' as any)}
    >
      <Text style={styles.upgradePillText}>업그레이드</Text>
    </Pressable>
  )}
</View>
        </View>

        <Text style={styles.sectionTitle}>빠른 시작</Text>

        <Pressable style={styles.bigBlueButton} onPress={startTextRoom}>
          <View style={styles.bigButtonTextBox}>
            <Text style={styles.bigButtonLabel}>TEXT DEBATE</Text>
            <Text style={styles.bigButtonTitle}>일반 채팅 토론방</Text>
            <Text style={styles.bigButtonText}>
              찬성팀과 반대팀으로 나뉘어 글로 토론합니다.
            </Text>
          </View>

          <Text style={styles.bigButtonIcon}>💬</Text>
        </Pressable>

        <Pressable style={styles.bigYellowButton} onPress={startVoiceRoom}>
          <View style={styles.bigButtonTextBox}>
            <Text style={styles.bigYellowLabel}>VOICE DEBATE</Text>
            <Text style={styles.bigYellowTitle}>음성 토론방</Text>
            <Text style={styles.bigYellowText}>
              말로 토론하고, 발언을 녹음하고 다시 들을 수 있습니다.
            </Text>
          </View>

          <Text style={styles.bigButtonIcon}>🎙️</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>바로가기</Text>

        <View style={styles.quickGrid}>
          <Pressable style={styles.quickCard} onPress={() => router.push('/room-list' as any)}>
            <Text style={styles.quickIcon}>🔎</Text>
            <Text style={styles.quickTitle}>토론방 탐색</Text>
            <Text style={styles.quickText}>진행 중인 토론방에 바로 참여하기</Text>
          </Pressable>

          <Pressable style={styles.quickCard} onPress={openAiGuide}>
            <Text style={styles.quickIcon}>🤖</Text>
            <Text style={styles.quickTitle}>AI 중재자</Text>
            <Text style={styles.quickText}>AI가 토론 흐름과 질문을 정리</Text>
          </Pressable>
        </View>

        <View style={styles.quickGrid}>
          <Pressable style={styles.quickCard} onPress={() => router.push('/ranking' as any)}>
            <Text style={styles.quickIcon}>🏆</Text>
            <Text style={styles.quickTitle}>랭킹</Text>
            <Text style={styles.quickText}>토론 점수 순위 확인하기</Text>
          </Pressable>

          <Pressable style={styles.quickCard} onPress={() => router.push('/profile' as any)}>
            <Text style={styles.quickIcon}>👤</Text>
            <Text style={styles.quickTitle}>프로필</Text>
            <Text style={styles.quickText}>내 점수와 토론 기록 보기</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>내 앱 관리</Text>

        <View style={styles.menuBox}>
          <MenuItem title="프리미엄" sub="AI 요약 사용량과 프리미엄 기능 확인" path="/premium" />
          <MenuItem title="고객센터" sub="문의하기, 버그 신고, 자주 묻는 질문" path="/support" />
          <MenuItem title="설정" sub="비밀번호 변경, 로그아웃, 계정 관리" path="/settings" />
          <MenuItem title="출시 체크리스트" sub="앱스토어 출시 전 준비사항 확인" path="/launch-checklist" />
        </View>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </ScrollView>

      <BottomNav active="home" />
    </View>
  );
}

function MenuItem({
  title,
  sub,
  path,
}: {
  title: string;
  sub: string;
  path: string;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={() => router.push(path as any)}>
      <View style={styles.menuTextBox}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>

      <Text style={styles.menuArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  container: {
    paddingTop: 58,
    paddingHorizontal: 24,
    paddingBottom: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: BRAND.black,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 11,
  },
  slogan: {
    color: BRAND.blue,
    marginTop: 8,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  profileMini: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMiniText: {
    color: BRAND.black,
    fontSize: 22,
    fontWeight: '900',
  },
  welcomeCard: {
    marginTop: 28,
    borderRadius: 28,
    backgroundColor: BRAND.blue,
    padding: 26,
  },
  welcomeLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  welcomeTitle: {
    color: BRAND.white,
    fontSize: 29,
    fontWeight: '900',
    marginTop: 10,
    lineHeight: 38,
  },
  welcomeText: {
    color: BRAND.white,
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  userInfoPill: {
    borderRadius: 999,
    backgroundColor: BRAND.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  userInfoLabel: {
    color: BRAND.black,
    fontSize: 10,
    fontWeight: '900',
  },
  userInfoValue: {
    color: BRAND.blue,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  premiumPill: {
    borderRadius: 999,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  premiumPillText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  upgradePill: {
    borderRadius: 999,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  upgradePillText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 30,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  bigBlueButton: {
    borderRadius: 24,
    backgroundColor: BRAND.black,
    padding: 22,
    minHeight: 150,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bigYellowButton: {
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: BRAND.yellow,
    padding: 22,
    minHeight: 150,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bigButtonTextBox: {
    flex: 1,
    paddingRight: 14,
  },
  bigButtonLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  bigButtonTitle: {
    color: BRAND.white,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 8,
  },
  bigButtonText: {
    color: BRAND.white,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  bigYellowLabel: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  bigYellowTitle: {
    color: BRAND.black,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 8,
  },
  bigYellowText: {
    color: BRAND.black,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  bigButtonIcon: {
    fontSize: 40,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    minHeight: 134,
  },
  quickIcon: {
    fontSize: 28,
  },
  quickTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10,
  },
  quickText: {
    color: BRAND.black,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  menuBox: {
    gap: 12,
  },
  menuItem: {
    minHeight: 74,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuTextBox: {
    flex: 1,
  },
  menuTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  menuSub: {
    color: BRAND.black,
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
  },
  menuArrow: {
    color: BRAND.black,
    fontSize: 30,
    fontWeight: '300',
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 24,
    height: 56,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },

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