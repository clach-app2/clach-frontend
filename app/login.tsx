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
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const login = async () => {
    if (loading) return;

    if (!email.trim()) {
      Alert.alert('입력 필요', '이메일을 입력해주세요.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('입력 필요', '비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const baseUrl = getBaseUrl();

      const bodyData = {
        email: email.trim(),
        userEmail: email.trim(),
        password: password.trim(),
      };

      const urls = [
        `${baseUrl}/api/auth/login`,
        `${baseUrl}/auth/login`,
        `${baseUrl}/api/login`,
        `${baseUrl}/login`,
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
            const user = data?.user || data?.data?.user || {
              name: data?.name || '토론가',
              email: email.trim(),
              score: data?.score || 0,
            };

            await AsyncStorage.setItem('clach_user', JSON.stringify(user));

            if (data?.token) {
              await AsyncStorage.setItem('clach_token', data.token);
            }

            router.replace('/home' as any);
            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }

      setMessage('로그인 API를 찾지 못했어요. 서버 코드를 확인해야 합니다.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const clearSavedLogin = async () => {
    await AsyncStorage.removeItem('clach_user');
    await AsyncStorage.removeItem('clach_token');
    Alert.alert('완료', '저장된 로그인 정보가 삭제되었습니다.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoMark}>
          <View style={styles.yellowShapeOne} />
          <View style={styles.yellowShapeTwo} />
        </View>

        <Text style={styles.logo}>CLACH</Text>
        <Text style={styles.slogan}>DEBATE. CHALLENGE. GROW.</Text>

        <Text style={styles.title}>로그인</Text>
        <Text style={styles.sub}>계정으로 로그인하고 토론을 시작하세요.</Text>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.label}>이메일</Text>
          <View style={styles.inputBox}>
            <Text style={styles.inputIcon}>●</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor="#777"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>비밀번호</Text>
          <View style={styles.inputBox}>
            <Text style={styles.inputIcon}>■</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#777"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Pressable
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={login}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? '로그인 중...' : '로그인'}
            </Text>
          </Pressable>

          <Pressable style={styles.signupButton} onPress={() => router.push('/signup' as any)}>
            <Text style={styles.signupButtonText}>회원가입</Text>
          </Pressable>

          <Pressable style={styles.guestButton} onPress={() => router.replace('/home' as any)}>
            <Text style={styles.guestButtonText}>둘러보기</Text>
          </Pressable>

          <Pressable style={styles.clearButton} onPress={clearSavedLogin}>
            <Text style={styles.clearButtonText}>저장된 로그인 정보 삭제</Text>
          </Pressable>
        </View>
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
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 86,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoMark: {
    width: 110,
    height: 80,
    marginBottom: 28,
    position: 'relative',
  },
  yellowShapeOne: {
    position: 'absolute',
    width: 82,
    height: 28,
    backgroundColor: BRAND.yellow,
    transform: [{ rotate: '-45deg' }],
    top: 15,
    left: 10,
  },
  yellowShapeTwo: {
    position: 'absolute',
    width: 55,
    height: 28,
    backgroundColor: BRAND.yellow,
    transform: [{ rotate: '-45deg' }],
    top: 48,
    left: 48,
  },
  logo: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 14,
    color: BRAND.black,
  },
  slogan: {
    marginTop: 10,
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 4,
  },
  title: {
    alignSelf: 'flex-start',
    marginTop: 56,
    color: BRAND.black,
    fontSize: 32,
    fontWeight: '900',
  },
  sub: {
    alignSelf: 'flex-start',
    color: BRAND.black,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  noticeCard: {
    alignSelf: 'stretch',
    marginTop: 22,
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
  form: {
    width: '100%',
    marginTop: 28,
  },
  label: {
    color: BRAND.black,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
    marginTop: 16,
  },
  inputBox: {
    height: 58,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
  },
  inputIcon: {
    color: BRAND.black,
    marginRight: 12,
    fontSize: 14,
  },
  input: {
    flex: 1,
    color: BRAND.black,
    fontSize: 15,
  },
  loginButton: {
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
  loginButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '900',
  },
  signupButton: {
    marginTop: 14,
    height: 58,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  guestButton: {
    marginTop: 14,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  clearButton: {
    marginTop: 18,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: BRAND.blue,
    fontSize: 13,
    fontWeight: '900',
  },
});