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
export default function TermsScreen() {
  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>약관 및 개인정보</Text>

          <Pressable style={styles.headerButton} onPress={() => router.replace('/home' as any)}>
            <Text style={styles.homeText}>홈</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>TERMS & PRIVACY</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>서비스 안내</Text>
          <Text style={styles.heroTitle}>CLACH 이용약관과 개인정보 처리방침</Text>
          <Text style={styles.heroText}>
            CLACH를 안전하게 사용하기 위한 기본 약관과 개인정보 처리 기준입니다.
          </Text>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>출시 전 수정 필요</Text>
          <Text style={styles.warningText}>
            아래 내용은 앱 개발용 초안입니다. 실제 출시 전에는 사업자명, 대표자명, 주소, 이메일, 개인정보 보관 기간 등을 실제 정보로 바꿔야 합니다.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>이용약관</Text>

        <PolicyCard
          title="제1조 목적"
          text="본 약관은 CLACH가 제공하는 토론방, AI 요약, AI 중재자, 음성 토론 기록, 랭킹 등 서비스 이용과 관련하여 회사와 이용자 사이의 권리, 의무 및 책임사항을 정하는 것을 목적으로 합니다."
        />

        <PolicyCard
          title="제2조 서비스 내용"
          text="CLACH는 사용자가 토론방을 만들고 참여할 수 있는 기능, 토론 내용을 AI가 요약하는 기능, 토론 중 AI 중재자가 흐름과 질문을 제안하는 기능, 토론 점수와 랭킹 기능을 제공합니다."
        />

        <PolicyCard
          title="제3조 회원가입 및 계정"
          text="사용자는 이메일과 비밀번호를 통해 계정을 만들 수 있습니다. 사용자는 자신의 계정 정보를 안전하게 관리해야 하며, 타인의 계정을 무단으로 사용할 수 없습니다."
        />

        <PolicyCard
          title="제4조 금지 행위"
          text="사용자는 욕설, 모욕, 괴롭힘, 허위정보 유포, 타인의 개인정보 공개, 서비스 방해 행위, 불법적 목적의 이용을 해서는 안 됩니다. 운영자는 필요한 경우 신고 처리, 이용 제한, 계정 정지 등의 조치를 할 수 있습니다."
        />

        <PolicyCard
          title="제5조 AI 기능 안내"
          text="AI 요약과 AI 중재자는 토론을 돕기 위한 보조 기능입니다. AI가 제공하는 내용은 항상 정확하지 않을 수 있으며, 중요한 판단은 사용자가 직접 확인해야 합니다."
        />

        <PolicyCard
          title="제6조 유료 서비스"
          text="CLACH는 프리미엄 기능을 제공할 수 있습니다. 프리미엄 기능에는 AI 요약 사용량 증가, AI 중재자 강화, 프리미엄 배지 등이 포함될 수 있습니다. 실제 결제 정책은 앱 출시 시 별도로 안내됩니다."
        />

        <PolicyCard
          title="제7조 서비스 변경 및 중단"
          text="CLACH는 서비스 품질 개선, 서버 점검, 기능 변경 등의 이유로 서비스 일부 또는 전체를 변경하거나 일시 중단할 수 있습니다."
        />

        <PolicyCard
          title="제8조 책임 제한"
          text="CLACH는 사용자의 토론 내용, AI 결과 활용, 사용자 간 분쟁으로 발생한 문제에 대해 법령이 허용하는 범위 내에서 책임을 제한할 수 있습니다."
        />
<PolicyCard
  title="제9조 차단 기능"
  text="사용자는 원하지 않는 상대방을 차단할 수 있습니다. 차단한 사용자의 메시지는 내 화면에서 숨겨질 수 있으며, 차단 목록 화면에서 언제든지 차단을 해제할 수 있습니다."
/>

<PolicyCard
  title="제10조 계정 삭제 및 데이터 처리"
  text="사용자는 설정 화면에서 계정 삭제를 요청할 수 있습니다. 계정 삭제 시 로그인 정보와 사용자 계정은 삭제되며, 서비스 운영과 안전 관리를 위해 필요한 일부 신고 기록 또는 법적으로 보관이 필요한 정보는 관련 기준에 따라 일정 기간 보관될 수 있습니다."
/>
        <Text style={styles.sectionTitle}>개인정보처리방침</Text>

        <PolicyCard
          title="1. 수집하는 개인정보"
          text="CLACH는 회원가입 및 서비스 제공을 위해 이메일, 닉네임, 비밀번호, 토론방 참여 정보, 메시지 내용, 신고 내용, 문의 내용, 토론 점수 정보를 수집할 수 있습니다."
        />

        <PolicyCard
          title="2. 개인정보 이용 목적"
          text="수집한 개인정보는 회원 식별, 로그인, 토론방 기능 제공, AI 요약 및 중재 기능 제공, 신고 처리, 문의 응답, 랭킹 제공, 서비스 개선 목적으로 이용됩니다."
        />

        <PolicyCard
          title="3. 토론 내용과 AI 처리"
          text="사용자가 작성한 토론 메시지나 음성 메모 내용은 AI 요약 및 AI 중재 기능 제공을 위해 서버로 전송될 수 있습니다. 민감한 개인정보는 토론방에 입력하지 않는 것이 좋습니다."
        />

        <PolicyCard
          title="4. 개인정보 보관 기간"
          text="회원 정보는 회원 탈퇴 시까지 보관됩니다. 단, 법령상 보관이 필요한 정보나 신고 처리, 분쟁 대응에 필요한 정보는 필요한 기간 동안 보관될 수 있습니다."
        />

        <PolicyCard
          title="5. 개인정보 제3자 제공"
          text="CLACH는 원칙적으로 사용자의 개인정보를 외부에 판매하거나 제공하지 않습니다. 다만 법령에 따른 요청이 있거나 서비스 제공에 필요한 경우 제한적으로 처리될 수 있습니다."
        />

        <PolicyCard
          title="6. 개인정보 보호 조치"
          text="CLACH는 비밀번호 암호화, 서버 접근 제한, 필요한 범위 내 정보 처리 등 개인정보 보호를 위해 합리적인 보안 조치를 적용합니다."
        />

        <PolicyCard
          title="7. 이용자의 권리"
          text="사용자는 자신의 개인정보 확인, 수정, 계정 삭제를 요청할 수 있습니다. 앱 설정 화면에서 비밀번호 변경 및 계정 삭제 기능을 이용할 수 있습니다."
        />

        <PolicyCard
          title="8. 문의"
          text="개인정보 및 서비스 이용 관련 문의는 앱 내 문의하기 기능을 통해 접수할 수 있습니다. 실제 출시 전에는 운영 이메일을 추가해야 합니다."
        />

        <Text style={styles.sectionTitle}>동의 안내</Text>

        <View style={styles.agreeCard}>
          <Text style={styles.agreeTitle}>CLACH를 계속 사용하면</Text>
          <Text style={styles.agreeText}>
            이용자는 위 이용약관 및 개인정보처리방침을 확인하고 서비스 이용에 동의한 것으로 볼 수 있습니다.
          </Text>
        </View>

        <Pressable style={styles.blueButton} onPress={() => router.back()}>
          <Text style={styles.blueButtonText}>확인하고 돌아가기</Text>
        </Pressable>

        <Pressable style={styles.yellowButton} onPress={() => router.push('/support' as any)}>
          <Text style={styles.yellowButtonText}>문의하기</Text>
        </Pressable>
      </ScrollView>

      <BottomNav active="profile" />
    </View>
  );
}

function PolicyCard({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.policyCard}>
      <Text style={styles.policyTitle}>{title}</Text>
      <Text style={styles.policyText}>{text}</Text>
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
  warningCard: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: BRAND.yellow,
    padding: 18,
  },
  warningTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
  },
  warningText: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 30,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  policyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    marginBottom: 12,
  },
  policyTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
  },
  policyText: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
  },
  agreeCard: {
    borderRadius: 20,
    backgroundColor: BRAND.black,
    padding: 20,
  },
  agreeTitle: {
    color: BRAND.yellow,
    fontSize: 18,
    fontWeight: '900',
  },
  agreeText: {
    color: BRAND.white,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
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