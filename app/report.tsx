import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';

export default function ReportScreen() {
  const params = useLocalSearchParams<{
    room?: string;
    reportedUser?: string;
    reportedUserEmail?: string;
    messageText?: string;
  }>();

  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const reasons = [
    '욕설 또는 인신공격',
    '혐오 표현',
    '도배성 메시지',
    '허위 정보',
    '개인정보 공개',
    '기타',
  ];

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

  const submitReport = async () => {
    if (loading) return;

    if (!reason) {
      Alert.alert('신고 사유 필요', '신고 사유를 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const savedUser = await AsyncStorage.getItem('clach_user');
      const user = savedUser
        ? JSON.parse(savedUser)
        : {
            name: '익명',
            email: '',
          };

      const baseUrl = getBaseUrl();

      const bodyData = {
        room: params.room || '토론방',
        reporterName: user.name || user.nickname || '익명',
        reporterEmail: user.email || '',
        reportedUser: params.reportedUser || '알 수 없음',
        reportedUserEmail: params.reportedUserEmail || '',
        messageText: params.messageText || detail || '',
        reason: detail ? `${reason} - ${detail}` : reason,
      };

      const urls = [
        `${baseUrl}/api/reports`,
        `${baseUrl}/reports`,
        `${baseUrl}/api/report`,
        `${baseUrl}/report`,
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
            Alert.alert('신고 완료', data?.message || '신고가 접수되었습니다.', [
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

      setMessage('신고 API를 찾지 못했어요. 서버 코드를 확인해야 합니다.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>신고하기</Text>

          <Pressable style={styles.headerButton} onPress={() => router.replace('/home' as any)}>
            <Text style={styles.homeText}>홈</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>REPORT CENTER</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>신고</Text>
          <Text style={styles.heroTitle}>안전한 토론을 위해 신고해주세요</Text>
          <Text style={styles.heroText}>
            욕설, 인신공격, 혐오 표현, 도배성 메시지 등 건강한 토론을 방해하는 내용을 신고할 수 있습니다.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>신고 대상</Text>

        <View style={styles.targetCard}>
          <Text style={styles.targetLabel}>토론방</Text>
          <Text style={styles.targetText}>{params.room || '토론방'}</Text>

          <Text style={styles.targetLabel}>사용자</Text>
          <Text style={styles.targetText}>{params.reportedUser || '알 수 없음'}</Text>

          <Text style={styles.targetLabel}>메시지</Text>
          <Text style={styles.messageText}>{params.messageText || '선택된 메시지가 없습니다.'}</Text>
        </View>

        <Text style={styles.sectionTitle}>신고 사유</Text>

        {reasons.map((item) => (
          <Pressable
            key={item}
            style={[styles.reasonButton, reason === item && styles.reasonActive]}
            onPress={() => setReason(item)}
          >
            <Text style={[styles.reasonText, reason === item && styles.reasonTextActive]}>
              {item}
            </Text>
          </Pressable>
        ))}

        <Text style={styles.sectionTitle}>상세 내용</Text>

        <TextInput
          style={styles.input}
          placeholder="추가로 설명할 내용이 있으면 입력하세요."
          placeholderTextColor="#777"
          value={detail}
          onChangeText={setDetail}
          multiline
        />

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>주의</Text>
          <Text style={styles.warningText}>
            허위 신고는 서비스 이용 제한의 사유가 될 수 있습니다. 실제로 문제가 있는 경우에만 신고해주세요.
          </Text>
        </View>

        <Pressable
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={submitReport}
          disabled={loading}
        >
          <Text style={styles.submitText}>{loading ? '신고 중...' : '신고 접수하기'}</Text>
        </Pressable>

        <Pressable style={styles.outlineButton} onPress={() => router.back()}>
          <Text style={styles.outlineText}>돌아가기</Text>
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
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 30,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  targetCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
  },
  targetLabel: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 6,
  },
  targetText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '800',
  },
  messageText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 21,
  },
  reasonButton: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 10,
  },
  reasonActive: {
    backgroundColor: BRAND.yellow,
    borderColor: BRAND.yellow,
  },
  reasonText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '800',
  },
  reasonTextActive: {
    color: BRAND.black,
    fontWeight: '900',
  },
  input: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 16,
    paddingTop: 16,
    color: BRAND.black,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  warningCard: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: BRAND.yellow,
    padding: 16,
  },
  warningTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  warningText: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 28,
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