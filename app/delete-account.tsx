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

export default function DeleteAccountScreen() {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
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

  const deleteAccount = async () => {
    if (loading) return;

    if (!password.trim()) {
      Alert.alert('입력 필요', '비밀번호를 입력해주세요.');
      return;
    }

    if (confirmText.trim() !== '삭제') {
      Alert.alert('확인 필요', '확인 문구에 "삭제"라고 입력해주세요.');
      return;
    }

    Alert.alert('계정 삭제', '정말 계정을 삭제할까요? 이 작업은 되돌릴 수 없습니다.', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
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
              password: password.trim(),
            };

            const urls = [
              `${baseUrl}/api/auth/delete-account`,
              `${baseUrl}/auth/delete-account`,
              `${baseUrl}/api/delete-account`,
              `${baseUrl}/delete-account`,
              `${baseUrl}/api/users/delete`,
              `${baseUrl}/users/delete`,
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
                  await AsyncStorage.removeItem('clach_user');

                  Alert.alert('삭제 완료', '계정이 삭제되었습니다.', [
                    {
                      text: '확인',
                      onPress: () => router.replace('/login' as any),
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

            setMessage('계정 삭제 API를 찾지 못했어요. 서버 코드를 확인해야 합니다.');
          } catch {
            setMessage('서버 연결을 확인해주세요.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
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

          <Text style={styles.headerTitle}>계정 삭제</Text>

          <Pressable style={styles.headerButton} onPress={() => router.replace('/settings' as any)}>
            <Text style={styles.settingText}>설정</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>ACCOUNT CONTROL</Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.warningCard}>
          <View style={styles.warningIcon}>
            <Text style={styles.warningIconText}>!</Text>
          </View>

          <Text style={styles.warningTitle}>계정 삭제</Text>
          <Text style={styles.warningText}>
            계정을 삭제하면 저장된 로그인 정보와 계정 데이터가 삭제됩니다. 이 작업은 되돌리기 어렵습니다.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>삭제 전에 확인</Text>
          <Text style={styles.infoText}>• 자동 로그인 정보가 삭제됩니다.</Text>
          <Text style={styles.infoText}>• 계정으로 다시 로그인할 수 없습니다.</Text>
          <Text style={styles.infoText}>• 다시 사용하려면 새로 회원가입해야 합니다.</Text>
        </View>

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          placeholder="현재 비밀번호"
          placeholderTextColor="#777"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>확인 문구</Text>
        <TextInput
          style={styles.input}
          placeholder='삭제하려면 "삭제"라고 입력'
          placeholderTextColor="#777"
          value={confirmText}
          onChangeText={setConfirmText}
        />

        <Pressable
          style={[styles.deleteButton, loading && styles.disabledButton]}
          onPress={deleteAccount}
          disabled={loading}
        >
          <Text style={styles.deleteButtonText}>
            {loading ? '삭제 중...' : '계정 삭제하기'}
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
    marginBottom: 30,
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
  noticeCard: {
    marginBottom: 18,
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
  warningCard: {
    borderRadius: 24,
    backgroundColor: BRAND.black,
    padding: 24,
  },
  warningIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  warningIconText: {
    color: BRAND.black,
    fontSize: 28,
    fontWeight: '900',
  },
  warningTitle: {
    color: BRAND.white,
    fontSize: 28,
    fontWeight: '900',
  },
  warningText: {
    color: BRAND.white,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
  },
  infoCard: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 18,
  },
  infoTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  infoText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 24,
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
  deleteButton: {
    marginTop: 36,
    height: 60,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  deleteButtonText: {
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
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
});