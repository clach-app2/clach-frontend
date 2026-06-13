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
export default function LaunchChecklistScreen() {
  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>출시 체크리스트</Text>

          <Pressable style={styles.headerButton} onPress={() => router.replace('/home' as any)}>
            <Text style={styles.homeText}>홈</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>APP LAUNCH CHECKLIST</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>출시 준비</Text>
          <Text style={styles.heroTitle}>앱스토어 출시 전 해야 할 일</Text>
          <Text style={styles.heroText}>
            CLACH를 실제 앱스토어에 올리기 전에 필요한 기능, 법적 문서, 서버, 결제, 테스트 항목을 확인할 수 있습니다.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>1. 앱 기능 점검</Text>

        <ChecklistCard title="회원가입 / 로그인" status="완료" text="이메일, 비밀번호 기반 회원가입과 로그인이 정상 작동해야 합니다." />
        <ChecklistCard title="토론방 생성" status="완료" text="일반 채팅 토론방과 음성 토론방을 구분해서 만들 수 있어야 합니다." />
        <ChecklistCard title="토론방 목록" status="완료" text="방 목록에서 일반방과 음성방이 구분되어 보여야 합니다." />
        <ChecklistCard title="AI 요약" status="진행중" text="토론 종료 후 AI가 요약과 조언을 제공해야 합니다." />
        <ChecklistCard title="AI 중재자" status="진행중" text="토론 중 흐름 정리, 근거 부족, 다음 질문을 추천해야 합니다." />
        <ChecklistCard title="랭킹 / 점수" status="완료" text="AI 요약 후 점수를 랭킹에 반영할 수 있어야 합니다." />

        <Text style={styles.sectionTitle}>2. 서버 / 데이터베이스</Text>

        <ChecklistCard title="Render 서버 배포" status="완료" text="Render에서 서버가 정상 실행되고 MongoDB와 연결되어야 합니다." />
        <ChecklistCard title="MongoDB 연결" status="완료" text="유저, 토론방, 메시지, 신고, 문의, 점수가 저장되어야 합니다." />
        <ChecklistCard title="환경변수 관리" status="필수" text="MONGO_URI, JWT_SECRET, OPENAI_API_KEY는 코드에 직접 넣지 말고 Render 환경변수에 넣어야 합니다." />
        <ChecklistCard title="서버 로그 확인" status="필수" text="배포 후 Logs에서 에러가 없는지 확인해야 합니다." />

        <Text style={styles.sectionTitle}>3. AI / 음성 기능</Text>

        <ChecklistCard title="OpenAI API Key" status="필수" text="AI 요약과 AI 중재자를 실제로 사용하려면 OPENAI_API_KEY가 필요합니다." />
        <ChecklistCard title="음성 녹음 / 재생" status="완료" text="현재 음성방은 녹음과 재생 구조로 작동합니다." />
        <ChecklistCard title="실시간 음성통화" status="출시 전 선택" text="진짜 실시간 음성통화는 Agora 또는 WebRTC 연결이 필요합니다." />

        <Text style={styles.sectionTitle}>4. 결제 / 수익화</Text>

        <ChecklistCard title="프리미엄 화면" status="완료" text="무료 플랜과 프리미엄 플랜 차이를 보여주는 화면이 필요합니다." />
        <ChecklistCard title="테스트 프리미엄" status="완료" text="개발 중에는 테스트 버튼으로 프리미엄 상태를 확인할 수 있습니다." />
        <ChecklistCard title="실제 결제 연결" status="출시 전 필수" text="앱스토어 출시 시 Apple In-App Purchase 연결이 필요합니다." />

        <Text style={styles.sectionTitle}>5. 법적 준비</Text>

        <ChecklistCard title="이용약관" status="초안 완료" text="앱 안에 이용약관 화면이 있어야 합니다." />
        <ChecklistCard title="개인정보처리방침" status="초안 완료" text="개인정보 수집, 이용, 보관, 삭제 내용을 안내해야 합니다." />
        <ChecklistCard title="문의 채널" status="완료" text="사용자가 오류, 신고, 문의를 보낼 수 있어야 합니다." />
        <ChecklistCard title="약관 실제 정보 수정" status="출시 전 필수" text="사업자명, 이메일, 주소, 개인정보 책임자 정보를 실제 정보로 바꿔야 합니다." />

        <Text style={styles.sectionTitle}>6. 앱스토어 준비</Text>

        <ChecklistCard title="앱 이름" status="완료" text="앱 이름은 CLACH로 정리되어 있습니다." />
        <ChecklistCard title="앱 아이콘" status="필수" text="1024x1024 앱 아이콘이 필요합니다." />
        <ChecklistCard title="스크린샷" status="필수" text="앱스토어 등록용 iPhone 스크린샷이 필요합니다." />
        <ChecklistCard title="앱 설명" status="필수" text="앱 소개, 핵심 기능, AI 기능 설명을 준비해야 합니다." />
        <ChecklistCard title="심사 대응" status="필수" text="AI 기능, 유저 생성 콘텐츠, 신고 기능, 개인정보 처리 설명이 필요합니다." />

        <Text style={styles.sectionTitle}>추천 다음 작업</Text>

        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>다음 개발 우선순위</Text>
          <Text style={styles.nextText}>
            1. 앱 아이콘 만들기{'\n'}
            2. 앱스토어 설명문 만들기{'\n'}
            3. 실제 결제 구조 정리하기{'\n'}
            4. OpenAI API Key Render에 연결하기{'\n'}
            5. 실제 기기에서 전체 테스트하기
          </Text>
        </View>

        <Pressable style={styles.blueButton} onPress={() => router.push('/home' as any)}>
          <Text style={styles.blueButtonText}>홈으로 가기</Text>
        </Pressable>

        <Pressable style={styles.yellowButton} onPress={() => router.push('/settings' as any)}>
          <Text style={styles.yellowButtonText}>설정으로 가기</Text>
        </Pressable>
      </ScrollView>

      <BottomNav active="profile" />
    </View>
  );
}

function ChecklistCard({
  title,
  status,
  text,
}: {
  title: string;
  status: string;
  text: string;
}) {
  const isDone = status === '완료';
  const isRequired = status.includes('필수');

  return (
    <View style={styles.checkCard}>
      <View style={styles.checkTopRow}>
        <Text style={styles.checkTitle}>{title}</Text>

        <View
          style={[
            styles.statusBadge,
            isDone && styles.statusDone,
            isRequired && styles.statusRequired,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isDone && styles.statusDoneText,
              isRequired && styles.statusRequiredText,
            ]}
          >
            {status}
          </Text>
        </View>
      </View>

      <Text style={styles.checkText}>{text}</Text>
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
  checkCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    marginBottom: 12,
  },
  checkTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
    marginRight: 10,
  },
  checkText: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
  },
  statusBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.line,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDone: {
    backgroundColor: BRAND.yellow,
  },
  statusRequired: {
    backgroundColor: BRAND.black,
  },
  statusText: {
    color: BRAND.black,
    fontSize: 11,
    fontWeight: '900',
  },
  statusDoneText: {
    color: BRAND.black,
  },
  statusRequiredText: {
    color: BRAND.white,
  },
  nextCard: {
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 18,
  },
  nextTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  nextText: {
    color: BRAND.black,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '700',
  },
  blueButton: {
    marginTop: 24,
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