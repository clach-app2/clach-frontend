import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';

export default function CheckScreen() {
  const [message, setMessage] = useState('');

  const checks = [
    {
      title: '서버 연결',
      desc: '앱이 Render 서버 주소로 연결됩니다.',
      status: '확인',
      path: null,
    },
    {
      title: '회원가입 / 로그인',
      desc: '계정 생성과 로그인 기능을 확인합니다.',
      status: '확인',
      path: '/login',
    },
    {
      title: '토론방 목록',
      desc: '토론방 목록, 검색, 입장 기능을 확인합니다.',
      status: '확인',
      path: '/room-list',
    },
    {
      title: '토론방 만들기',
      desc: '새 토론방 생성 기능을 확인합니다.',
      status: '확인',
      path: '/create-room',
    },
    {
      title: '실시간 채팅',
      desc: '채팅 입력과 메시지 전송 기능을 확인합니다.',
      status: '확인',
      path: '/chat-room',
    },
    {
      title: 'AI 요약',
      desc: '토론 내용을 AI가 요약하는 화면을 확인합니다.',
      status: '확인',
      path: '/summary',
    },
    {
      title: '랭킹',
      desc: '토론 점수와 순위 화면을 확인합니다.',
      status: '확인',
      path: '/ranking',
    },
    {
      title: '프로필 / 설정',
      desc: '계정 정보와 설정 메뉴를 확인합니다.',
      status: '확인',
      path: '/profile',
    },
  ];

  const openCheck = (path: string | null) => {
    if (!path) {
      setMessage(`현재 서버 주소: ${SERVER_URL}`);
      return;
    }

    if (path === '/chat-room') {
      Alert.alert('안내', '채팅방은 토론방 목록에서 방을 선택해서 들어가는 것이 가장 정확합니다.', [
        {
          text: '토론방 목록으로 이동',
          onPress: () => router.push('/room-list' as any),
        },
        {
          text: '닫기',
          style: 'cancel',
        },
      ]);
      return;
    }

    router.push(path as any);
  };

  const runQuickCheck = () => {
    setMessage('기본 화면 연결은 확인되었습니다. 실제 서버 기능은 각 화면에서 버튼을 눌러 확인하세요.');
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>최종 점검</Text>

          <Pressable style={styles.headerButton} onPress={() => router.replace('/home' as any)}>
            <Text style={styles.homeText}>홈</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>FINAL APP CHECK</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>상태</Text>
          <Text style={styles.heroTitle}>앱 최종 점검</Text>
          <Text style={styles.heroText}>
            CLACH의 핵심 기능과 출시 준비 상태를 한눈에 확인합니다.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.serverCard}>
          <Text style={styles.serverLabel}>서버 주소</Text>
          <Text style={styles.serverUrl}>{SERVER_URL}</Text>
        </View>

        <Pressable style={styles.mainButton} onPress={runQuickCheck}>
          <Text style={styles.mainButtonText}>빠른 점검 실행</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>기능 점검</Text>

        {checks.map((item, index) => (
          <Pressable
            key={index}
            style={styles.checkCard}
            onPress={() => openCheck(item.path)}
          >
            <View style={styles.numberBox}>
              <Text style={styles.numberText}>{index + 1}</Text>
            </View>

            <View style={styles.checkTextBox}>
              <Text style={styles.checkTitle}>{item.title}</Text>
              <Text style={styles.checkDesc}>{item.desc}</Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </Pressable>
        ))}

        <Text style={styles.sectionTitle}>출시 전 남은 일</Text>

        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>다음 단계</Text>
          <Text style={styles.nextText}>• 앱 아이콘 / 스플래시 이미지 최종 완성</Text>
          <Text style={styles.nextText}>• 개인정보 처리방침 웹페이지 만들기</Text>
          <Text style={styles.nextText}>• Apple Developer 가입</Text>
          <Text style={styles.nextText}>• EAS Build로 iPhone 테스트 빌드 만들기</Text>
          <Text style={styles.nextText}>• App Store Connect에 앱 등록</Text>
        </View>

        <Pressable style={styles.blueButton} onPress={() => router.push('/room-list' as any)}>
          <Text style={styles.blueButtonText}>토론방 점검하기</Text>
        </Pressable>

        <Pressable style={styles.blackButton} onPress={() => router.push('/settings' as any)}>
          <Text style={styles.blackButtonText}>설정으로 이동</Text>
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
  homeText: {
    color: BRAND.blue,
    fontSize: 14,
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
    marginBottom: 16,
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
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    padding: 16,
    marginBottom: 14,
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
  serverCard: {
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
  mainButton: {
    marginTop: 18,
    height: 58,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 32,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  checkCard: {
    minHeight: 82,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  numberText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  checkTextBox: {
    flex: 1,
  },
  checkTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  checkDesc: {
    color: BRAND.black,
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
  statusBadge: {
    backgroundColor: BRAND.blue,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
  },
  statusText: {
    color: BRAND.white,
    fontSize: 11,
    fontWeight: '900',
  },
  nextCard: {
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 18,
  },
  nextTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  nextText: {
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