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

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordCheck, setNewPasswordCheck] = useState('');
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

  const changePassword = async () => {
    if (loading) return;

    if (!currentPassword.trim()) {
      Alert.alert('입력 필요', '현재 비밀번호를 입력해주세요.');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('입력 필요', '새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword.trim().length < 4) {
      Alert.alert('비밀번호 확인', '새 비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    if (newPassword.trim() !== newPasswordCheck.trim()) {
      Alert.alert('비밀번호 불일치', '새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const savedUser = await AsyncStorage.getItem('clach_user');

      if (!savedUser) {
        Alert.alert('로그인 필요', '다시 로그인해주세요.', [
          {
            text: '확인',
            onPress: () => router.replace('/login' as any),
          },
        ]);
        return;
      }

      const user = JSON.parse(savedUser);
      const baseUrl = getBaseUrl();

      const bodyData = {
        userEmail: user.email,
        email: user.email,
        currentPassword: currentPassword.trim(),
        oldPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      };

      const urls = [
        `${baseUrl}/api/auth/change-password`,
        `${baseUrl}/auth/change-password`,
        `${baseUrl}/api/change-password`,
        `${baseUrl}/change-password`,
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
            Alert.alert('변경 완료', '비밀번호가 변경되었습니다.', [
              {
                text: '확인',
                onPress: () => router.back(),
              },
            ]);
            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }

      setMessage('비밀번호 변경 API를 찾지 못했어요. 서버 코드를 확인해야 합니다.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>비밀번호 변경</Text>

          <Pressable style={styles.headerButton} onPress={() => router.replace('/settings' as any)}>
            <Text style={styles.settingText}>설정</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>ACCOUNT SECURITY</Text>
        </View>

        <Text style={styles.title}>비밀번호 변경</Text>
        <Text style={styles.sub}>
          현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.
        </Text>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <Text style={styles.securityIconText}>▣</Text>
          </View>

          <View style={styles.securityTextBox}>
            <Text style={styles.securityTitle}>계정 보호</Text>
            <Text style={styles.securitySub}>
              비밀번호는 다른 사람이 알 수 없게 안전하게 관리해주세요.
            </Text>
          </View>
        </View>

        <Text style={styles.label}>현재 비밀번호</Text>
        <TextInput
          style={styles.input}
          placeholder="현재 비밀번호"
          placeholderTextColor="#777"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />

        <Text style={styles.label}>새 비밀번호</Text>
        <TextInput
          style={styles.input}
          placeholder="새 비밀번호 4자 이상"
          placeholderTextColor="#777"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />

        <Text style={styles.label}>새 비밀번호 확인</Text>
        <TextInput
          style={styles.input}
          placeholder="새 비밀번호 확인"
          placeholderTextColor="#777"
          value={newPasswordCheck}
          onChangeText={setNewPasswordCheck}
          secureTextEntry
        />

        <Pressable
          style={[styles.button, loading && styles.disabledButton]}
          onPress={changePassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '변경 중...' : '비밀번호 변경하기'}
          </Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>돌아가기</Text>
        </Pressable>

        <Pressable style={styles.homeButton} onPress={() => router.replace('/home' as any)}>
          <Text style={styles.homeButtonText}>홈으로 이동</Text>
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
    flexGrow: 1,
    paddingTop: 54,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  settingText: {
    color: BRAND.blue,
    fontSize: 14,
    fontWeight: '900',
  },
  brandBox: {
    marginTop: 30,
    marginBottom: 34,
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
  title: {
    color: BRAND.black,
    fontSize: 30,
    fontWeight: '900',
  },
  sub: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  noticeCard: {
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
  securityCard: {
    marginTop: 28,
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  securityIconText: {
    color: BRAND.white,
    fontSize: 20,
    fontWeight: '900',
  },
  securityTextBox: {
    flex: 1,
  },
  securityTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
  },
  securitySub: {
    color: BRAND.black,
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    color: BRAND.black,
    marginTop: 26,
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
  button: {
    marginTop: 36,
    height: 60,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '900',
  },
  cancelButton: {
    marginTop: 14,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  homeButton: {
    marginTop: 14,
    height: 56,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
});