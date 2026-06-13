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

export default function ContactScreen() {
  const [category, setCategory] = useState('오류');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const categories = ['오류', '계정', '결제', '신고', '기능 제안'];

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

  const submitContact = async () => {
    if (loading) return;

    if (!title.trim()) {
      Alert.alert('입력 필요', '문의 제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('입력 필요', '문의 내용을 입력해주세요.');
      return;
    }

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
        category,
        title: title.trim(),
        content: content.trim(),
        userName: user.name || '토론가',
        userEmail: user.email || 'guest@clach.app',
        email: user.email || 'guest@clach.app',
      };

      const urls = [
        `${baseUrl}/api/contact`,
        `${baseUrl}/contact`,
        `${baseUrl}/api/contacts`,
        `${baseUrl}/contacts`,
        `${baseUrl}/api/support`,
        `${baseUrl}/support`,
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
            Alert.alert('문의 완료', '문의가 접수되었습니다.', [
              {
                text: '확인',
                onPress: () => router.back(),
              },
            ]);

            setTitle('');
            setContent('');
            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }

      setMessage('문의 API를 찾지 못했어요. 서버 코드를 확인해야 합니다.');
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

          <Text style={styles.headerTitle}>문의하기</Text>

          <Pressable style={styles.headerButton} onPress={() => router.push('/my-contacts' as any)}>
            <Text style={styles.historyText}>내역</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>SUPPORT CENTER</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>문의</Text>
          <Text style={styles.heroTitle}>문의하기</Text>
          <Text style={styles.heroText}>
            오류, 계정 문제, 결제, 기능 제안 등을 보내주세요.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>문의 분류</Text>

        <View style={styles.categoryWrap}>
          {categories.map((item) => (
            <Pressable
              key={item}
              style={[
                styles.categoryButton,
                category === item && styles.categoryActive,
              ]}
              onPress={() => setCategory(item)}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === item && styles.categoryTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          placeholder="문의 제목"
          placeholderTextColor="#777"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>내용</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="문의 내용을 자세히 적어주세요."
          placeholderTextColor="#777"
          value={content}
          onChangeText={setContent}
          multiline
        />

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>문의 전 확인</Text>
          <Text style={styles.infoText}>• 오류는 화면 캡처가 있으면 좋아요.</Text>
          <Text style={styles.infoText}>• 계정 문제는 이메일을 정확히 적어주세요.</Text>
          <Text style={styles.infoText}>• 기능 제안은 원하는 동작을 구체적으로 적어주세요.</Text>
        </View>

        <Pressable
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={submitContact}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? '접수 중...' : '문의 보내기'}
          </Text>
        </Pressable>

        <Pressable style={styles.historyButton} onPress={() => router.push('/my-contacts' as any)}>
          <Text style={styles.historyButtonText}>내 문의 내역 보기</Text>
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
    paddingBottom: 50,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 62,
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
  historyText: {
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
    marginTop: 26,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '900',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: BRAND.black,
    borderRadius: 999,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: BRAND.white,
  },
  categoryActive: {
    backgroundColor: BRAND.yellow,
  },
  categoryText: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
  },
  categoryTextActive: {
    color: BRAND.black,
  },
  input: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 18,
    color: BRAND.black,
    fontSize: 15,
    backgroundColor: BRAND.white,
  },
  textArea: {
    height: 150,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  infoCard: {
    marginTop: 24,
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
  submitButton: {
    marginTop: 34,
    height: 60,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '900',
  },
  historyButton: {
    marginTop: 14,
    height: 58,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButtonText: {
    color: BRAND.white,
    fontSize: 15,
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
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
});