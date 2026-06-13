import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';

type Report = {
  _id?: string;
  room?: string;
  reporterName?: string;
  reporterEmail?: string;
  reportedUser?: string;
  reportedUserEmail?: string;
  messageText?: string;
  reason?: string;
  status?: string;
  adminAction?: string;
  createdAt?: string;
};

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
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

  const loadReports = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setMessage('');

      const savedUser = await AsyncStorage.getItem('clach_user');

      if (!savedUser) {
        setReports([]);
        setMessage('로그인 정보가 없습니다. 다시 로그인해주세요.');
        return;
      }

      const user = JSON.parse(savedUser);
      const email = user.email || '';
      const baseUrl = getBaseUrl();

      const urls = [
        `${baseUrl}/api/my-reports?reporterEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/my-reports?reporterEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/api/reports/my?reporterEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/reports/my?reporterEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/api/reports?reporterEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/reports?reporterEmail=${encodeURIComponent(email)}`,
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url);
          const data = await safeJson(response);

          if (response.ok) {
            if (Array.isArray(data)) {
              setReports(data);
              return;
            }

            if (Array.isArray(data?.reports)) {
              setReports(data.reports);
              return;
            }

            if (Array.isArray(data?.data)) {
              setReports(data.data);
              return;
            }
          }
        } catch {
          continue;
        }
      }

      setReports([]);
      setMessage('신고 내역을 불러오지 못했어요.');
    } catch {
      setReports([]);
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>내 신고 내역</Text>

          <Pressable style={styles.headerButton} onPress={loadReports}>
            <Text style={styles.refresh}>{loading ? '…' : '↻'}</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>REPORT HISTORY</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>신고</Text>
          <Text style={styles.heroTitle}>내 신고 내역</Text>
          <Text style={styles.heroText}>
            내가 접수한 신고와 처리 상태를 확인할 수 있습니다.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>신고 목록</Text>

        {reports.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>!</Text>
            </View>

            <Text style={styles.emptyTitle}>아직 신고 내역이 없어요</Text>
            <Text style={styles.emptyText}>
              토론방에서 부적절한 메시지를 발견하면 신고할 수 있습니다.
            </Text>
          </View>
        ) : (
          reports.map((item, index) => (
            <View key={item._id || String(index)} style={styles.reportCard}>
              <View style={styles.cardTop}>
                <View style={styles.roomBadge}>
                  <Text style={styles.roomText}>{item.room || '토론방'}</Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status || '대기'}</Text>
                </View>
              </View>

              <Text style={styles.reportTitle}>
                신고 대상: {item.reportedUser || '알 수 없음'}
              </Text>

              <Text style={styles.label}>신고 사유</Text>
              <Text style={styles.reasonText}>{item.reason || '사유 없음'}</Text>

              <Text style={styles.label}>신고 메시지</Text>
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>
                  {item.messageText || '메시지 내용 없음'}
                </Text>
              </View>

              {item.adminAction ? (
                <View style={styles.actionBox}>
                  <Text style={styles.actionLabel}>관리자 조치</Text>
                  <Text style={styles.actionText}>{item.adminAction}</Text>
                </View>
              ) : (
                <View style={styles.waitBox}>
                  <Text style={styles.waitText}>처리 대기 중</Text>
                </View>
              )}
            </View>
          ))
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>신고 기준</Text>
          <Text style={styles.infoText}>• 욕설 또는 인신공격</Text>
          <Text style={styles.infoText}>• 타인 비하 또는 조롱</Text>
          <Text style={styles.infoText}>• 토론 방해성 도배</Text>
          <Text style={styles.infoText}>• 개인정보 공개</Text>
        </View>

        <Pressable style={styles.blueButton} onPress={loadReports}>
          <Text style={styles.blueButtonText}>
            {loading ? '불러오는 중...' : '신고 내역 새로고침'}
          </Text>
        </Pressable>

        <Pressable style={styles.blackButton} onPress={() => router.push('/room-list' as any)}>
          <Text style={styles.blackButtonText}>토론방으로 이동</Text>
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
    paddingBottom: 130,
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
  refresh: {
    color: BRAND.blue,
    fontSize: 26,
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
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 32,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 22,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIconText: {
    color: BRAND.black,
    fontSize: 28,
    fontWeight: '900',
  },
  emptyTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: BRAND.black,
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
  },
  reportCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  roomBadge: {
    flex: 1,
    backgroundColor: BRAND.yellow,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  roomText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  statusBadge: {
    backgroundColor: BRAND.blue,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusText: {
    color: BRAND.white,
    fontSize: 12,
    fontWeight: '900',
  },
  reportTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  label: {
    color: BRAND.blue,
    marginTop: 16,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  reasonText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 21,
  },
  messageBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.black,
    padding: 14,
  },
  messageText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 21,
  },
  actionBox: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    padding: 14,
  },
  actionLabel: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  actionText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 20,
  },
  waitBox: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.black,
    padding: 14,
  },
  waitText: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
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
  blueButton: {
    marginTop: 28,
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
  blackButton: {
    marginTop: 14,
    height: 58,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackButtonText: {
    color: BRAND.white,
    fontSize: 15,
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