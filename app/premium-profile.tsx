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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';

export default function PremiumScreen() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  const buyPremium = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setMessage('');

      const savedUser = await AsyncStorage.getItem('clach_user');
      const user = savedUser
        ? JSON.parse(savedUser)
        : {
            name: '토론가',
            email: 'guest@clach.app',
          };

      const baseUrl = getBaseUrl();

      const bodyData = {
        userEmail: user.email || 'guest@clach.app',
        email: user.email || 'guest@clach.app',
        plan: 'premium',
        amount: 4900,
      };

      const urls = [
        `${baseUrl}/api/payment/premium`,
        `${baseUrl}/payment/premium`,
        `${baseUrl}/api/payments/premium`,
        `${baseUrl}/payments/premium`,
        `${baseUrl}/api/stripe/create-checkout-session`,
        `${baseUrl}/stripe/create-checkout-session`,
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData),
          });

          const data = await safeJson(response);

          if (response.ok) {
            Alert.alert(
              '프리미엄 준비',
              data?.message || '결제 연결이 확인되었습니다. 실제 앱스토어 결제는 출시 단계에서 연결하면 됩니다.'
            );
            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }

      setMessage('결제 API를 찾지 못했어요. 지금은 프리미엄 화면 UI만 사용할 수 있습니다.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const extendTime = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setMessage('');

      const savedUser = await AsyncStorage.getItem('clach_user');
      const user = savedUser
        ? JSON.parse(savedUser)
        : {
            name: '토론가',
            email: 'guest@clach.app',
          };

      const baseUrl = getBaseUrl();

      const bodyData = {
        userEmail: user.email || 'guest@clach.app',
        email: user.email || 'guest@clach.app',
        minutes: 5,
      };

      const urls = [
        `${baseUrl}/api/payment/extend-time`,
        `${baseUrl}/payment/extend-time`,
        `${baseUrl}/api/extend-time`,
        `${baseUrl}/extend-time`,
        `${baseUrl}/api/rooms/extend-time`,
        `${baseUrl}/rooms/extend-time`,
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData),
          });

          const data = await safeJson(response);

          if (response.ok) {
            Alert.alert('시간 연장', data?.message || '시간 연장 요청이 처리되었습니다.');
            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }

      setMessage('시간 연장 API를 찾지 못했어요. 서버 코드를 확인해야 합니다.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const activateLocalPremium = async () => {
    try {
      await AsyncStorage.setItem('clach_premium', 'true');
      Alert.alert('완료', '이 기기에서 프리미엄 상태로 표시됩니다.');
    } catch {
      Alert.alert('오류', '프리미엄 상태 저장 중 문제가 발생했습니다.');
    }
  };

  const clearLocalPremium = async () => {
    try {
      await AsyncStorage.removeItem('clach_premium');
      Alert.alert('완료', '이 기기의 프리미엄 표시를 해제했습니다.');
    } catch {
      Alert.alert('오류', '프리미엄 상태 삭제 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>프리미엄</Text>

          <Pressable style={styles.headerButton} onPress={() => router.replace('/home' as any)}>
            <Text style={styles.homeText}>홈</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>PREMIUM PLAN</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>업그레이드</Text>
          <Text style={styles.heroTitle}>프리미엄으로 더 깊은 토론</Text>
          <Text style={styles.heroText}>
            시간 연장, AI 요약 강화, 프리미엄 배지로 더 좋은 토론 경험을 제공합니다.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>월 구독</Text>
          <Text style={styles.price}>₩4,900</Text>
          <Text style={styles.priceSub}>월 구독 기준 추천 가격</Text>
        </View>

        <Text style={styles.sectionTitle}>프리미엄 혜택</Text>

        <Benefit
          number="01"
          title="프리미엄 시간 연장"
          text="토론 시간이 부족할 때 추가 시간을 연장할 수 있습니다."
        />

        <Benefit
          number="02"
          title="AI 심화 요약"
          text="토론 후 핵심 주장, 근거, 개선점, 다음 토론 방향을 더 자세히 확인합니다."
        />

        <Benefit
          number="03"
          title="프리미엄 배지"
          text="프로필과 토론방에서 프리미엄 멤버 배지를 표시합니다."
        />

        <Benefit
          number="04"
          title="토론 기록 관리"
          text="내가 참여한 토론과 AI 요약 기록을 더 편하게 관리할 수 있습니다."
        />

        <View style={styles.noticeYellowCard}>
          <Text style={styles.noticeYellowTitle}>출시 전 연결 필요</Text>
          <Text style={styles.noticeYellowText}>• iOS 앱스토어 결제 또는 Stripe 결제 연결</Text>
          <Text style={styles.noticeYellowText}>• 결제 성공 후 사용자 프리미엄 상태 저장</Text>
          <Text style={styles.noticeYellowText}>• 시간 연장 API와 프리미엄 권한 연결</Text>
        </View>

        <Pressable
          style={[styles.mainButton, loading && styles.disabledButton]}
          onPress={buyPremium}
          disabled={loading}
        >
          <Text style={styles.mainButtonText}>
            {loading ? '처리 중...' : '프리미엄 시작하기'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.yellowButton, loading && styles.disabledButton]}
          onPress={extendTime}
          disabled={loading}
        >
          <Text style={styles.yellowButtonText}>토론 시간 5분 연장하기</Text>
        </Pressable>

        {__DEV__ ? (
  <>
    <Pressable style={styles.blackButton} onPress={activateLocalPremium}>
      <Text style={styles.blackButtonText}>테스트 프리미엄 켜기</Text>
    </Pressable>

    <Pressable style={styles.outlineButton} onPress={clearLocalPremium}>
      <Text style={styles.outlineText}>테스트 프리미엄 끄기</Text>
    </Pressable>
  </>
) : null}

        <Pressable style={styles.outlineButton} onPress={() => router.push('/profile' as any)}>
          <Text style={styles.outlineText}>프로필로 이동</Text>
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

function Benefit({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.benefitCard}>
      <View style={styles.numberBox}>
        <Text style={styles.numberText}>{number}</Text>
      </View>

      <View style={styles.benefitTextBox}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitText}>{text}</Text>
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
    backgroundColor: BRAND.black,
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
    lineHeight: 38,
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
  priceCard: {
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: BRAND.yellow,
    padding: 24,
  },
  priceLabel: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  price: {
    color: BRAND.black,
    fontSize: 42,
    fontWeight: '900',
    marginTop: 8,
  },
  priceSub: {
    color: BRAND.black,
    fontSize: 14,
    marginTop: 6,
    fontWeight: '700',
  },
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 32,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  benefitCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
  },
  numberBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  numberText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '900',
  },
  benefitTextBox: {
    flex: 1,
  },
  benefitTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  benefitText: {
    color: BRAND.black,
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
  },
  noticeYellowCard: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 18,
  },
  noticeYellowTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  noticeYellowText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 24,
  },
  mainButton: {
    marginTop: 30,
    height: 60,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  mainButtonText: {
    color: BRAND.white,
    fontSize: 16,
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