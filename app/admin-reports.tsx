import React, { useEffect, useState } from 'react';
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
import { router } from 'expo-router';
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
};

export default function AdminReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [adminEmail, setAdminEmail] = useState('');
  const [minutes, setMinutes] = useState('60');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAdmin();
  }, []);

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

  const loadAdmin = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('clach_user');

      if (!savedUser) {
        setMessage('로그인 정보가 없습니다. 다시 로그인해주세요.');
        return;
      }

      const user = JSON.parse(savedUser);
      const email = user.email || '';

      setAdminEmail(email);
      loadReports(email);
    } catch {
      setMessage('관리자 정보를 불러오지 못했어요.');
    }
  };

  const loadReports = async (email = adminEmail) => {
    if (loading) return;

    if (!email) {
      setMessage('관리자 이메일을 찾을 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const baseUrl = getBaseUrl();

      const urls = [
        `${baseUrl}/api/reports?adminEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/reports?adminEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/api/admin/reports?adminEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/admin/reports?adminEmail=${encodeURIComponent(email)}`,
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
      setMessage('신고 목록 API를 찾지 못했어요. 서버 코드를 확인해야 합니다.');
    } catch {
      setReports([]);
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      setLoading(true);
      setMessage('');

      const baseUrl = getBaseUrl();

      const bodyData = {
        adminEmail,
        status,
        adminAction: status === '처리완료' ? '관리자가 신고를 처리했습니다.' : '',
      };

      const urls = [
        `${baseUrl}/api/reports/${reportId}/status`,
        `${baseUrl}/reports/${reportId}/status`,
        `${baseUrl}/api/admin/reports/${reportId}/status`,
        `${baseUrl}/admin/reports/${reportId}/status`,
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
            Alert.alert('완료', data?.message || '신고 상태가 변경되었습니다.');
            loadReports();
            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }

      setMessage('신고 상태 변경 API를 찾지 못했어요.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const suspendUser = async (report: Report) => {
    if (!report.reportedUserEmail) {
      Alert.alert('처리 불가', '신고 대상 이메일이 없습니다.');
      return;
    }

    Alert.alert(
      '사용자 정지',
      `${report.reportedUser || report.reportedUserEmail} 사용자를 ${minutes}분 정지할까요?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '정지',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setMessage('');

              const baseUrl = getBaseUrl();

              const bodyData = {
                adminEmail,
                targetEmail: report.reportedUserEmail,
                reportedUserEmail: report.reportedUserEmail,
                minutes: Number(minutes) || 60,
                reason: report.reason || '신고 처리',
                reportId: report._id,
              };

              const urls = [
                `${baseUrl}/api/admin/suspend-user`,
                `${baseUrl}/admin/suspend-user`,
                `${baseUrl}/api/suspend-user`,
                `${baseUrl}/suspend-user`,
                `${baseUrl}/api/users/suspend`,
                `${baseUrl}/users/suspend`,
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
                    Alert.alert('완료', data?.message || '사용자를 정지했습니다.');
                    loadReports();
                    return;
                  }

                  if (typeof data === 'object' && data?.message) {
                    setMessage(data.message);
                  }
                } catch {
                  continue;
                }
              }

              setMessage('사용자 정지 API를 찾지 못했어요.');
            } catch {
              setMessage('서버 연결을 확인해주세요.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const addTestReport = () => {
    const testReport: Report = {
      _id: Date.now().toString(),
      room: '테스트 토론방',
      reporterName: '신고자',
      reporterEmail: 'reporter@clach.app',
      reportedUser: '신고 대상',
      reportedUserEmail: 'target@clach.app',
      messageText: '테스트 신고 메시지입니다.',
      reason: '테스트 신고',
      status: '대기',
    };

    setReports((prev) => [testReport, ...prev]);
    setMessage('화면 테스트용 신고가 추가되었습니다.');
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>관리자 신고 관리</Text>

          <Pressable style={styles.headerButton} onPress={() => loadReports()}>
            <Text style={styles.refresh}>{loading ? '…' : '↻'}</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>ADMIN REPORT CENTER</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>관리자</Text>
          <Text style={styles.heroTitle}>신고 관리</Text>
          <Text style={styles.heroText}>
            접수된 신고를 확인하고 처리 상태 변경 또는 계정 정지를 할 수 있습니다.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.adminCard}>
          <Text style={styles.adminLabel}>관리자 이메일</Text>
          <Text style={styles.adminEmail}>{adminEmail || '이메일 없음'}</Text>
        </View>

        <Text style={styles.label}>정지 시간</Text>

        <View style={styles.timeRow}>
          {['60', '120', '240'].map((item) => (
            <Pressable
              key={item}
              style={[styles.timeButton, minutes === item && styles.timeActive]}
              onPress={() => setMinutes(item)}
            >
              <Text style={[styles.timeText, minutes === item && styles.timeTextActive]}>
                {item}분
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.customInput}
          placeholder="직접 입력"
          placeholderTextColor="#777"
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="number-pad"
        />

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>신고 목록</Text>

          <Pressable style={styles.smallButton} onPress={addTestReport}>
            <Text style={styles.smallButtonText}>테스트 추가</Text>
          </Pressable>
        </View>

        {reports.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>!</Text>
            </View>

            <Text style={styles.emptyTitle}>신고가 없어요</Text>
            <Text style={styles.emptyText}>
              접수된 신고가 있으면 여기에 표시됩니다.
            </Text>
          </View>
        ) : (
          reports.map((report, index) => (
            <View key={report._id || String(index)} style={styles.reportCard}>
              <View style={styles.cardTop}>
                <View style={styles.roomBadge}>
                  <Text style={styles.roomText}>{report.room || '토론방'}</Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{report.status || '대기'}</Text>
                </View>
              </View>

              <Text style={styles.reportTitle}>
                신고 대상: {report.reportedUser || '알 수 없음'}
              </Text>

              <Text style={styles.emailText}>
                {report.reportedUserEmail || '이메일 없음'}
              </Text>

              <Text style={styles.labelSmall}>신고자</Text>
              <Text style={styles.normalText}>
                {report.reporterName || '익명'} · {report.reporterEmail || '이메일 없음'}
              </Text>

              <Text style={styles.labelSmall}>신고 사유</Text>
              <Text style={styles.normalText}>{report.reason || '사유 없음'}</Text>

              <Text style={styles.labelSmall}>신고 메시지</Text>
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>
                  {report.messageText || '메시지 내용 없음'}
                </Text>
              </View>

              {report.adminAction ? (
                <View style={styles.actionBox}>
                  <Text style={styles.actionLabel}>관리자 조치</Text>
                  <Text style={styles.actionText}>{report.adminAction}</Text>
                </View>
              ) : null}

              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.completeButton}
                  onPress={() =>
                    report._id && updateReportStatus(report._id, '처리완료')
                  }
                >
                  <Text style={styles.completeText}>처리완료</Text>
                </Pressable>

                <Pressable
                  style={styles.suspendButton}
                  onPress={() => suspendUser(report)}
                >
                  <Text style={styles.suspendText}>정지 처리</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Pressable style={styles.blueButton} onPress={() => loadReports()}>
          <Text style={styles.blueButtonText}>
            {loading ? '불러오는 중...' : '신고 목록 새로고침'}
          </Text>
        </Pressable>

        <Pressable style={styles.blackButton} onPress={() => router.push('/settings' as any)}>
          <Text style={styles.blackButtonText}>설정으로 이동</Text>
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
  adminCard: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
  },
  adminLabel: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  adminEmail: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 14,
    fontWeight: '800',
  },
  label: {
    color: BRAND.black,
    marginTop: 26,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '900',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeActive: {
    backgroundColor: BRAND.blue,
    borderColor: BRAND.blue,
  },
  timeText: {
    color: BRAND.black,
    fontSize: 14,
    fontWeight: '900',
  },
  timeTextActive: {
    color: BRAND.white,
  },
  customInput: {
    marginTop: 12,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 16,
    color: BRAND.black,
    fontSize: 15,
  },
  sectionRow: {
    marginTop: 32,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: BRAND.blue,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
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
    gap: 8,
    marginBottom: 14,
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
  emailText: {
    color: BRAND.blue,
    marginTop: 5,
    fontSize: 13,
    fontWeight: '800',
  },
  labelSmall: {
    color: BRAND.blue,
    marginTop: 16,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  normalText: {
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  completeButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '900',
  },
  suspendButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspendText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '900',
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