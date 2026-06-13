import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const BRAND = {
  blue: '#0058FF',
  black: '#111827',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  line: '#E5E7EB',
  danger: '#EF4444',
};

const SUPPORT_EMAIL = 'Chaewoo2009@gmail.com';

export default function SupportScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [category, setCategory] = useState('일반 문의');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('clach_user');

      if (!savedUser) return;

      const user = JSON.parse(savedUser);
      setUserEmail(user.email || '');
    } catch (err) {
      console.log('고객센터 유저 정보 불러오기 오류:', err);
    }
  };

  const openEmail = async () => {
    const cleanMessage = message.trim();

    const subject = `[CLACH 문의] ${category}`;

    const body = [
      '문의 내용을 작성해주세요.',
      '',
      `문의 종류: ${category}`,
      `사용자 이메일: ${userEmail || '로그인 정보 없음'}`,
      '',
      '문의 내용:',
      cleanMessage || '여기에 문의 내용을 입력해주세요.',
      '',
      '---',
      '앱 이름: CLACH',
      '버전: 1.0.0',
    ].join('\n');

    const mailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailUrl);

      if (!canOpen) {
        Alert.alert(
          '메일 앱을 열 수 없어요',
          `아래 이메일로 문의해주세요.\n\n${SUPPORT_EMAIL}`
        );
        return;
      }

      await Linking.openURL(mailUrl);
    } catch (err) {
      console.log('메일 열기 오류:', err);

      Alert.alert(
        '문의하기 오류',
        `메일 앱을 열지 못했어요.\n아래 이메일로 문의해주세요.\n\n${SUPPORT_EMAIL}`
      );
    }
  };

  const selectCategory = (nextCategory: string) => {
    setCategory(nextCategory);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View>
            <Text style={styles.title}>고객센터</Text>
            <Text style={styles.subtitle}>
              문의, 버그 신고, 자주 묻는 질문을 확인하세요.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>CLACH SUPPORT</Text>
          <Text style={styles.heroTitle}>도움이 필요하신가요?</Text>
          <Text style={styles.heroText}>
            앱 사용 중 문제가 생기면 문의 내용을 작성해 메일로 보낼 수
            있습니다.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>문의 종류</Text>

        <View style={styles.categoryWrap}>
          {['일반 문의', '버그 신고', '결제 문의', '계정 문의'].map((item) => {
            const selected = category === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.categoryButton,
                  selected && styles.categoryButtonActive,
                ]}
                onPress={() => selectCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selected && styles.categoryTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>문의 내용</Text>

        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="문제 상황이나 문의 내용을 적어주세요."
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.primaryButton} onPress={openEmail}>
          <Text style={styles.primaryButtonText}>메일로 문의하기</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>문의 이메일</Text>
          <Text style={styles.infoText}>{SUPPORT_EMAIL}</Text>
          <Text style={styles.infoSmall}>
            출시 전에는 실제로 받을 수 있는 이메일 주소로 변경해야 합니다.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>자주 묻는 질문</Text>

        <FaqCard
          title="AI 요약은 언제 사용되나요?"
          text="토론방에서 AI 요약을 요청하면 토론 메시지를 바탕으로 핵심 주장과 개선점을 정리합니다."
        />

        <FaqCard
          title="무료 사용자는 AI를 얼마나 사용할 수 있나요?"
          text="무료 사용자는 하루 기준 AI 요약 2회, AI 중재자 3회를 사용할 수 있습니다."
        />

        <FaqCard
          title="Premium은 무엇이 다른가요?"
          text="Premium은 더 긴 토론 시간과 더 넉넉한 AI 사용 횟수를 제공합니다. AI 품질 자체를 다르게 제공하지 않습니다."
        />

        <FaqCard
          title="신고와 차단은 어떻게 사용하나요?"
          text="채팅 메시지 옆 메뉴에서 신고하거나 차단할 수 있습니다. 차단한 사용자는 차단 목록 화면에서 해제할 수 있습니다."
        />

        <FaqCard
          title="계정 삭제는 어디서 하나요?"
          text="설정 화면의 계정 삭제 메뉴에서 비밀번호와 확인 문구를 입력해 계정 삭제를 요청할 수 있습니다."
        />

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FaqCard({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.faqCard}>
      <Text style={styles.faqTitle}>{title}</Text>
      <Text style={styles.faqText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.lightGray,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  backText: {
    fontSize: 34,
    lineHeight: 36,
    color: BRAND.black,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: BRAND.black,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: BRAND.gray,
  },
  heroCard: {
    backgroundColor: BRAND.blue,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#DCE8FF',
    letterSpacing: 1,
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '900',
    color: BRAND.white,
  },
  heroText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#EAF1FF',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 17,
    fontWeight: '900',
    color: BRAND.black,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  categoryButtonActive: {
    backgroundColor: BRAND.blue,
    borderColor: BRAND.blue,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND.black,
  },
  categoryTextActive: {
    color: BRAND.white,
  },
  input: {
    minHeight: 150,
    backgroundColor: BRAND.white,
    borderRadius: 18,
    padding: 16,
    fontSize: 14,
    color: BRAND.black,
    borderWidth: 1,
    borderColor: BRAND.line,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: BRAND.black,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  infoCard: {
    backgroundColor: BRAND.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: BRAND.black,
  },
  infoText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.blue,
  },
  infoSmall: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: BRAND.gray,
  },
  faqCard: {
    backgroundColor: BRAND.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    marginBottom: 10,
  },
  faqTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: BRAND.black,
  },
  faqText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.gray,
  },
  bottomSpace: {
    height: 30,
  },
});