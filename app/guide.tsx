import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { BRAND } from '../constants/brand';
import BottomNav from '../components/BottomNav';
export default function GuideScreen() {
  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>AI 중재자 가이드</Text>

          <Pressable style={styles.headerButton} onPress={() => router.replace('/home' as any)}>
            <Text style={styles.homeText}>홈</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>AI MODERATOR GUIDE</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>AI 토론 중재자</Text>
          <Text style={styles.heroTitle}>토론을 더 논리적으로 만들어주는 AI</Text>
          <Text style={styles.heroText}>
            CLACH AI 중재자는 한쪽 편을 드는 기능이 아니라, 토론이 더 안전하고 논리적으로 진행되도록 돕는 기능입니다.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>AI 중재자가 하는 일</Text>

        <View style={styles.featureCard}>
          <Text style={styles.featureNumber}>01</Text>
          <Text style={styles.featureTitle}>토론 흐름 정리</Text>
          <Text style={styles.featureText}>
            최근 발언을 보고 현재 토론이 어떤 방향으로 흘러가고 있는지 간단히 정리합니다.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureNumber}>02</Text>
          <Text style={styles.featureTitle}>근거 부족 지적</Text>
          <Text style={styles.featureText}>
            주장만 있고 근거가 부족한 부분을 찾아서 더 설득력 있게 말할 수 있도록 도와줍니다.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureNumber}>03</Text>
          <Text style={styles.featureTitle}>감정 과열 완화</Text>
          <Text style={styles.featureText}>
            토론 중 감정적인 표현이나 공격적인 말이 나오면 더 부드러운 표현으로 바꿀 수 있게 안내합니다.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureNumber}>04</Text>
          <Text style={styles.featureTitle}>다음 질문 추천</Text>
          <Text style={styles.featureText}>
            토론이 막히지 않도록 상대에게 물어볼 질문이나 더 깊게 생각할 주제를 추천합니다.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>사용 방법</Text>

        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>일반 채팅방에서 사용</Text>
          <Text style={styles.stepText}>
            토론방에 들어간 뒤 메시지를 1~2개 이상 주고받고, AI 토론 중재자 호출 버튼을 누르면 됩니다.
          </Text>
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>음성 토론방에서 사용</Text>
          <Text style={styles.stepText}>
            음성 발언을 녹음하거나 메모를 저장한 뒤 AI 중재자 호출 버튼을 누르면 음성 토론 흐름을 정리해줍니다.
          </Text>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>주의할 점</Text>
          <Text style={styles.warningText}>
            AI 중재자는 토론을 돕는 보조 기능입니다. 최종 판단은 사용자가 직접 해야 하며, 중요한 정보는 직접 확인하는 것이 좋습니다.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>바로 시작하기</Text>

        <Pressable
          style={styles.blueButton}
          onPress={() =>
            router.push({
              pathname: '/create-room' as any,
              params: {
                roomType: 'text',
              },
            })
          }
        >
          <Text style={styles.blueButtonText}>일반 채팅 토론방 만들기</Text>
        </Pressable>

        <Pressable
          style={styles.yellowButton}
          onPress={() =>
            router.push({
              pathname: '/create-room' as any,
              params: {
                roomType: 'voice',
              },
            })
          }
        >
          <Text style={styles.yellowButtonText}>음성 토론방 만들기</Text>
        </Pressable>

        <Pressable style={styles.outlineButton} onPress={() => router.push('/room-list' as any)}>
          <Text style={styles.outlineText}>토론방 목록 보기</Text>
        </Pressable>
      </ScrollView>

      <BottomNav active="profile" />
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
    paddingBottom: 170,
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
  },
  heroLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  heroTitle: {
    color: BRAND.white,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 10,
    lineHeight: 36,
  },
  heroText: {
    color: BRAND.white,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
  },
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 30,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  featureCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    marginBottom: 12,
  },
  featureNumber: {
    color: BRAND.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  featureTitle: {
    color: BRAND.black,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 8,
  },
  featureText: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  stepCard: {
    borderRadius: 18,
    backgroundColor: BRAND.yellow,
    padding: 18,
    marginBottom: 12,
  },
  stepTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
  },
  stepText: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  warningCard: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: BRAND.black,
    padding: 18,
  },
  warningTitle: {
    color: BRAND.yellow,
    fontSize: 17,
    fontWeight: '900',
  },
  warningText: {
    color: BRAND.white,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  blueButton: {
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
    marginTop: 12,
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
  outlineButton: {
    marginTop: 12,
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