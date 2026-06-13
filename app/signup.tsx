import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { SERVER_URL } from '../constants/config';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

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

 const handleSignup = async () => {
  if (loading) return;

  const cleanNickname = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  setMessage('');

  if (!cleanNickname) {
    setMessage('닉네임을 입력해주세요.');
    return;
  }

  if (!cleanEmail) {
    setMessage('이메일을 입력해주세요.');
    return;
  }

  if (!cleanEmail.includes('@')) {
    setMessage('올바른 이메일을 입력해주세요.');
    return;
  }

  if (!password || password.length < 6) {
    setMessage('비밀번호는 6자 이상 입력해주세요.');
    return;
  }

  try {
    setLoading(true);

    const baseUrl = SERVER_URL.replace(/\/+$/, '');
    const signupUrl = `${baseUrl}/api/auth/signup`;

    console.log('회원가입 요청 주소:', signupUrl);

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 20000);

    const response = await fetch(signupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: cleanNickname,
        nickname: cleanNickname,
        email: cleanEmail,
        password,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();

    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        message: responseText,
      };
    }

    console.log(
      '회원가입 응답:',
      response.status,
      responseText
    );

    if (!response.ok) {
      setMessage(
        data?.message ||
          `회원가입에 실패했습니다. 오류 코드: ${response.status}`
      );
      return;
    }

    if (!data?.user) {
      setMessage('서버 응답에 사용자 정보가 없습니다.');
      return;
    }

    if (!data?.token) {
      setMessage('서버 응답에 로그인 토큰이 없습니다.');
      return;
    }

    await AsyncStorage.setItem(
      'clach_user',
      JSON.stringify(data.user)
    );

    await AsyncStorage.setItem(
      'clach_token',
      data.token
    );

    setMessage('회원가입이 완료되었습니다.');

    router.replace('/home' as any);
  } catch (error: any) {
    console.log('회원가입 연결 오류:', error);

    if (error?.name === 'AbortError') {
      setMessage(
        '서버 응답이 너무 늦습니다. 잠시 후 다시 시도해주세요.'
      );
    } else {
      setMessage(
        `서버 연결 실패: ${
          error?.message || '알 수 없는 오류'
        }`
      );
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>회원가입</Text>

          <Pressable style={styles.headerButton} onPress={() => router.replace('/login' as any)}>
            <Text style={styles.loginText}>로그인</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>JOIN DEBATE PLATFORM</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>START</Text>
          <Text style={styles.heroTitle}>토론을 시작할 계정을 만들어보세요</Text>
          <Text style={styles.heroText}>
            회원가입 후 토론방 만들기, AI 요약, AI 중재자, 랭킹 기능을 사용할 수 있습니다.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>닉네임</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 토론가"
          placeholderTextColor="#777"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          placeholder="example@email.com"
          placeholderTextColor="#777"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          placeholder="6자 이상"
          placeholderTextColor="#777"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.sectionTitle}>약관 동의</Text>

        <Pressable
          style={styles.checkCard}
          onPress={() => setAgreeTerms((prev) => !prev)}
        >
          <View style={agreeTerms ? styles.checkBoxActive : styles.checkBox}>
            <Text style={styles.checkMark}>{agreeTerms ? '✓' : ''}</Text>
          </View>

          <View style={styles.checkTextBox}>
            <Text style={styles.checkTitle}>이용약관 동의</Text>
            <Text style={styles.checkSub}>CLACH 서비스 이용 규칙에 동의합니다.</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.checkCard}
          onPress={() => setAgreePrivacy((prev) => !prev)}
        >
          <View style={agreePrivacy ? styles.checkBoxActive : styles.checkBox}>
            <Text style={styles.checkMark}>{agreePrivacy ? '✓' : ''}</Text>
          </View>

          <View style={styles.checkTextBox}>
            <Text style={styles.checkTitle}>개인정보처리방침 동의</Text>
            <Text style={styles.checkSub}>회원 정보와 토론 데이터 처리 기준에 동의합니다.</Text>
          </View>
        </Pressable>

        <Pressable style={styles.termsLink} onPress={() => router.push('/terms' as any)}>
          <Text style={styles.termsLinkText}>이용약관 / 개인정보처리방침 보기</Text>
        </Pressable>

        <Pressable
          style={[styles.signupButton, loading && styles.disabledButton]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.signupButtonText}>
            {loading ? '가입 중...' : '회원가입'}
          </Text>
        </Pressable>

        <Pressable style={styles.outlineButton} onPress={() => router.replace('/login' as any)}>
          <Text style={styles.outlineText}>이미 계정이 있어요</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 80,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 64,
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
  loginText: {
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
  label: {
    color: BRAND.black,
    marginTop: 22,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '900',
  },
  input: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 18,
    color: BRAND.black,
    fontSize: 15,
    backgroundColor: BRAND.white,
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
    minHeight: 74,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkBoxActive: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkMark: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '900',
  },
  checkTextBox: {
    flex: 1,
  },
  checkTitle: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  checkSub: {
    color: BRAND.black,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 17,
  },
  termsLink: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsLinkText: {
    color: BRAND.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  signupButton: {
    marginTop: 12,
    height: 60,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
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
});