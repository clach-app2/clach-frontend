import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';
import BottomNav from '../components/BottomNav';
type UserInfo = {
  name?: string;
  email?: string;
};

export default function SettingsScreen() {
  const [user, setUser] = useState<UserInfo>({
    name: '토론가',
    email: 'user@clach.app',
  });

  const [badWordCount, setBadWordCount] = useState(0);
  const [suspensionCount, setSuspensionCount] = useState(0);
  const [remainingText, setRemainingText] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const getBaseUrl = () => {
    return SERVER_URL.replace(/\/$/, '');
  };

  const safeJson = async (res: Response) => {
    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('clach_user');

      if (savedUser) {
        const parsed = JSON.parse(savedUser);

        const nextUser = {
          name: parsed.name || parsed.nickname || '토론가',
          email: parsed.email || 'user@clach.app',
        };

        setUser(nextUser);
        loadModerationStatus(nextUser.email);
      }
    } catch {
      console.log('설정 사용자 정보 불러오기 실패');
    }
  };

  const loadModerationStatus = async (email: string) => {
    try {
      const baseUrl = getBaseUrl();

      const urls = [
        `${baseUrl}/api/moderation/status?userEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/moderation/status?userEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/api/users/status?userEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/users/status?userEmail=${encodeURIComponent(email)}`,
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url);
          const data = await safeJson(response);

          if (response.ok && typeof data === 'object') {
            setBadWordCount(data.badWordCount || 0);
            setSuspensionCount(data.suspensionCount || 0);
            setRemainingText(data.remainingText || '');
            return;
          }
        } catch {
          continue;
        }
      }
    } catch {
      console.log('제재 상태 불러오기 실패');
    }
  };

  const logout = () => {
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
          router.replace('/login' as any);
        },
      },
    ]);
  };

  const clearSavedLogin = () => {
    Alert.alert('자동 로그인 삭제', '저장된 로그인 정보를 삭제할까요?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('clach_user');
          Alert.alert('완료', '저장된 로그인 정보가 삭제되었습니다.', [
            {
              text: '확인',
              onPress: () => router.replace('/login' as any),
            },
          ]);
        },
      },
    ]);
  };

  const goTo = (path: string) => {
    router.push(path as any);
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>설정</Text>

          <Pressable style={styles.headerButton} onPress={() => router.replace('/home' as any)}>
            <Text style={styles.homeText}>홈</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>APP SETTINGS</Text>
        </View>

        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>●</Text>
          </View>

          <View style={styles.accountTextBox}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.serverCard}>
          <Text style={styles.serverLabel}>서버 주소</Text>
          <Text style={styles.serverUrl}>{SERVER_URL}</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>
            {remainingText ? '계정 정지 중' : '토론 가능 상태'}
          </Text>

          <Text style={styles.statusText}>
            {remainingText
              ? `남은 시간: ${remainingText}`
              : `경고 ${badWordCount}/3회 · 누적 정지 ${suspensionCount}회`}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>계정</Text>

        <SettingItem
          icon="●"
          title="내 프로필"
          sub="점수, 경고, 계정 상태 확인"
          onPress={() => goTo('/profile')}
        />

        <SettingItem
          icon="▣"
          title="비밀번호 변경"
          sub="현재 비밀번호 확인 후 새 비밀번호 설정"
          onPress={() => goTo('/change-password')}
        />

        <SettingItem
          icon="×"
          title="자동 로그인 정보 삭제"
          sub="이 기기에 저장된 로그인 정보 삭제"
          onPress={clearSavedLogin}
        />

        <Text style={styles.sectionTitle}>서비스</Text>

        <SettingItem
          icon="◎"
          title="토론방 목록"
          sub="토론방 탐색 화면으로 이동"
          onPress={() => goTo('/room-list')}
        />

        <SettingItem
          icon="+"
          title="토론방 만들기"
          sub="새 토론방 생성"
          onPress={() => goTo('/create-room')}
        />

        <SettingItem
          icon="AI"
          title="AI 요약"
          sub="토론 요약 화면으로 이동"
          onPress={() => goTo('/summary')}
        />

        <SettingItem
          icon="?"
          title="토론 가이드"
          sub="토론 방법과 점수 기준 확인"
          onPress={() => goTo('/guide')}
        />

        <SettingItem
          icon="#"
          title="랭킹"
          sub="토론 점수 순위 확인"
          onPress={() => goTo('/ranking')}
        />

        <SettingItem
          icon="♛"
          title="프리미엄"
          sub="시간 연장과 프리미엄 기능"
          onPress={() => goTo('/premium')}
        />

        <Text style={styles.sectionTitle}>문의 / 신고</Text>

        <SettingItem
  icon="?"
  title="고객센터"
  sub="문의하기, 버그 신고, 자주 묻는 질문"
  onPress={() => goTo('/support')}
/>

        <SettingItem
          icon="□"
          title="문의 내역"
          sub="보낸 문의와 답변 확인"
          onPress={() => goTo('/my-contacts')}
        />

        <SettingItem
          icon="!"
          title="내 신고 내역"
          sub="내가 접수한 신고 처리 상태 확인"
          onPress={() => goTo('/my-reports')}
        />

        <SettingItem
          icon="×"
          title="차단한 사용자"
          sub="차단 목록 확인 및 해제"
          onPress={() => goTo('/blocked-users')}
        />

        <Text style={styles.sectionTitle}>앱 정보</Text>

        <SettingItem
          icon="✓"
          title="앱 최종 점검"
          sub="CLACH 기능 상태 확인"
          onPress={() => goTo('/check')}
        />

        <SettingItem
          icon="!"
          title="이용약관 및 개인정보"
          sub="서비스 정책 확인"
          onPress={() => goTo('/terms')}
        />

        <Text style={styles.sectionTitle}>위험 구역</Text>

        <SettingItem
          icon="!"
          title="계정 삭제"
          sub="비밀번호 확인 후 계정 삭제"
          danger
          onPress={() => goTo('/delete-account')}
        />

       <Pressable style={styles.logoutButton} onPress={logout}>
  <Text style={styles.logoutText}>로그아웃</Text>
</Pressable>

<View style={{ alignItems: 'center', marginTop: 18, marginBottom: 90 }}>
  <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>
    CLACH
  </Text>
  <Text style={{ marginTop: 4, fontSize: 12, color: '#6B7280' }}>
    버전 1.0.0
  </Text>
</View>

</ScrollView>
      
      <BottomNav active="profile" />
    </View>
  );
}

function SettingItem({
  icon,
  title,
  sub,
  onPress,
  danger,
}: {
  icon: string;
  title: string;
  sub: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={[styles.item, danger && styles.dangerItem]}
      onPress={onPress}
    >
      <View style={[styles.itemIcon, danger && styles.dangerIcon]}>
        <Text style={[styles.itemIconText, danger && styles.dangerIconText]}>
          {icon}
        </Text>
      </View>

      <View style={styles.itemTextBox}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemSub}>{sub}</Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
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
  homeText: {
    color: BRAND.blue,
    fontSize: 14,
    fontWeight: '900',
  },
  brandBox: {
    marginTop: 28,
    marginBottom: 26,
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
  accountCard: {
    borderRadius: 24,
    backgroundColor: BRAND.blue,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: BRAND.black,
    fontSize: 28,
  },
  accountTextBox: {
    flex: 1,
  },
  name: {
    color: BRAND.white,
    fontSize: 22,
    fontWeight: '900',
  },
  email: {
    color: BRAND.white,
    fontSize: 13,
    marginTop: 5,
  },
  serverCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
  },
  serverLabel: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  serverUrl: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  statusCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: BRAND.yellow,
    padding: 18,
  },
  statusTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
  },
  statusText: {
    color: BRAND.black,
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 32,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  item: {
    minHeight: 78,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerItem: {
    borderColor: BRAND.black,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dangerIcon: {
    backgroundColor: BRAND.yellow,
  },
  itemIconText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '900',
  },
  dangerIconText: {
    color: BRAND.black,
  },
  itemTextBox: {
    flex: 1,
  },
  itemTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  itemSub: {
    color: BRAND.black,
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
  chevron: {
    color: BRAND.black,
    fontSize: 30,
    fontWeight: '300',
  },
  logoutButton: {
    marginTop: 28,
    height: 58,
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