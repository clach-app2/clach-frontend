import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';
import BottomNav from '../components/BottomNav';

type DebateMessage = {
  _id?: string;
  userName?: string;
  userEmail?: string;
  side?: string;
  text?: string;
  message?: string;
  createdAt?: string;
};

type AiUsage = {
  type: 'summary' | 'moderator';
  used: number;
  limit: number;
  remaining: number;
  isPremium: boolean;
  date: string;
};

type SavedSummary = {
  summary: string;
  advice: string;
  score: number;
  grade: string;
  savedAt: string;
};

export default function SummaryScreen() {
  const params = useLocalSearchParams<{
    roomId?: string;
    roomTitle?: string;
  }>();

  const roomId = params.roomId || '';
  const roomTitle = params.roomTitle || '토론방';

  const [myEmail, setMyEmail] = useState('');
  const [messages, setMessages] = useState<DebateMessage[]>([]);

  const [summary, setSummary] = useState('');
  const [advice, setAdvice] = useState('');
  const [score, setScore] = useState(0);
  const [grade, setGrade] = useState('-');
  const [savedAt, setSavedAt] = useState('');

  const [usage, setUsage] = useState<AiUsage | null>(null);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState('');

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

  const getCacheKey = () => {
    return `clach_summary_${roomId || roomTitle}`;
  };

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('clach_user');

      if (!savedUser) {
        setNotice('로그인 정보를 찾지 못했습니다.');
        return;
      }

      const user = JSON.parse(savedUser);
      setMyEmail(user.email || '');
    } catch {
      setNotice('사용자 정보를 불러오지 못했습니다.');
    }
  };

  const saveReturnedUser = async (returnedUser: any) => {
    if (!returnedUser || typeof returnedUser !== 'object') {
      return;
    }

    try {
      const savedUser = await AsyncStorage.getItem('clach_user');
      const currentUser = savedUser ? JSON.parse(savedUser) : {};

      const nextUser = {
        ...currentUser,
        ...returnedUser,
      };

      await AsyncStorage.setItem(
        'clach_user',
        JSON.stringify(nextUser)
      );
    } catch {
      console.log('사용자 사용량 저장 실패');
    }
  };

  const loadSavedSummary = async () => {
    try {
      const saved = await AsyncStorage.getItem(getCacheKey());

      if (!saved) return;

      const parsed: SavedSummary = JSON.parse(saved);

      setSummary(parsed.summary || '');
      setAdvice(parsed.advice || '');
      setScore(Number(parsed.score || 0));
      setGrade(parsed.grade || '-');
      setSavedAt(parsed.savedAt || '');
    } catch {
      console.log('저장된 요약 불러오기 실패');
    }
  };

  const saveSummary = async (data: SavedSummary) => {
    try {
      await AsyncStorage.setItem(
        getCacheKey(),
        JSON.stringify(data)
      );
    } catch {
      console.log('요약 저장 실패');
    }
  };

  const loadMessages = async (): Promise<DebateMessage[]> => {
    if (!roomId) {
      setNotice('토론방 ID를 찾지 못했습니다.');
      return [];
    }

    try {
      setLoadingMessages(true);
      setNotice('');

      const baseUrl = getBaseUrl();

      const urls = [
        `${baseUrl}/api/messages/${roomId}`,
        `${baseUrl}/messages/${roomId}`,
        `${baseUrl}/api/chat/${roomId}`,
        `${baseUrl}/chat/${roomId}`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url);
          const data = await safeJson(res);

          if (!res.ok) continue;

          const list = Array.isArray(data?.messages)
            ? data.messages
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : [];

          setMessages(list);
          return list;
        } catch {
          continue;
        }
      }

      setNotice('토론 메시지를 불러오지 못했습니다.');
      return [];
    } catch {
      setNotice('서버 연결을 확인해주세요.');
      return [];
    } finally {
      setLoadingMessages(false);
    }
  };

  const generateSummary = async (force = false) => {
    if (generating) return;

    if (!myEmail) {
      Alert.alert(
        '로그인 필요',
        'AI 요약을 사용하려면 로그인 정보가 필요합니다.'
      );
      return;
    }

    if (summary && !force) {
      return;
    }

    try {
      setGenerating(true);
      setNotice('');

      const finalMessages =
        messages.length > 0 ? messages : await loadMessages();

      if (finalMessages.length === 0) {
        Alert.alert(
          '요약할 내용 없음',
          '토론 메시지를 작성한 뒤 AI 요약을 이용해주세요.'
        );
        return;
      }

      const baseUrl = getBaseUrl();

      const bodyData = {
        roomId,
        roomTitle,
        messages: finalMessages,

        email: myEmail,
        userEmail: myEmail,
      };

      const urls = [
        `${baseUrl}/api/summary`,
        `${baseUrl}/summary`,
        `${baseUrl}/api/ai/summary`,
        `${baseUrl}/ai/summary`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData),
          });

          const data = await safeJson(res);

          if (res.ok) {
            const nextSummary =
              data?.summary || '요약 결과가 없습니다.';

            const nextAdvice =
              data?.advice ||
              '주장과 함께 구체적인 근거와 사례를 제시해보세요.';

            const nextScore = Number(
              data?.score?.total || data?.score || 0
            );

            const nextGrade =
              data?.score?.grade || data?.grade || '-';

            const nextSavedAt = new Date().toISOString();

            setSummary(nextSummary);
            setAdvice(nextAdvice);
            setScore(nextScore);
            setGrade(nextGrade);
            setSavedAt(nextSavedAt);

            if (data?.usage) {
              setUsage(data.usage);
            }

            if (data?.user) {
              await saveReturnedUser(data.user);
            }

            await saveSummary({
              summary: nextSummary,
              advice: nextAdvice,
              score: nextScore,
              grade: nextGrade,
              savedAt: nextSavedAt,
            });

            return;
          }

          if (res.status === 429) {
            if (data?.usage) {
              setUsage(data.usage);
            }

            Alert.alert(
              '오늘 사용량을 모두 사용했어요',
              data?.message ||
                '오늘 사용할 수 있는 AI 요약 횟수를 모두 사용했습니다.',
              [
                {
                  text: '확인',
                  style: 'cancel',
                },
                {
                  text: 'Premium 보기',
                  onPress: () =>
                    router.push('/premium' as any),
                },
              ]
            );

            return;
          }

          if (
            typeof data === 'object' &&
            data !== null &&
            data?.message
          ) {
            setNotice(data.message);
          }
        } catch {
          continue;
        }
      }

      setNotice('AI 요약 API를 찾지 못했습니다.');
    } catch {
      setNotice('AI 요약 처리 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const regenerateSummary = () => {
    Alert.alert(
      '요약 다시 생성',
      '다시 생성하면 오늘 AI 요약 사용 횟수가 1회 추가로 차감됩니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '다시 생성',
          onPress: () => generateSummary(true),
        },
      ]
    );
  };

  useEffect(() => {
    loadUser();
    loadSavedSummary();
    loadMessages();
  }, [roomId]);

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>AI 토론 요약</Text>

          <Pressable
            style={styles.headerButton}
            onPress={() => router.replace('/home' as any)}
          >
            <Text style={styles.homeText}>홈</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>DEBATE SUMMARY</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>AI SUMMARY</Text>
          <Text style={styles.heroTitle}>{roomTitle}</Text>
          <Text style={styles.heroText}>
            토론의 핵심 주장과 개선점을 정리해 보여줍니다.
          </Text>
        </View>

{usage ? (
  <View
    style={{
      marginHorizontal: 20,
      marginTop: 12,
      marginBottom: 10,
      padding: 12,
      borderRadius: 14,
      backgroundColor: '#F4F7FB',
      borderWidth: 1,
      borderColor: '#E1E7EF',
    }}
  >
    <Text
      style={{
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
      }}
    >
      AI 요약 사용량
    </Text>

    <Text
      style={{
        marginTop: 6,
        fontSize: 13,
        color: '#374151',
      }}
    >
      오늘 사용 {usage.used}/{usage.limit}회
    </Text>

    <Text
      style={{
        marginTop: 2,
        fontSize: 13,
        fontWeight: '700',
        color: '#2563EB',
      }}
    >
      남은 횟수 {usage.remaining}회
    </Text>

    <Text
      style={{
        marginTop: 4,
        fontSize: 11,
        color: '#6B7280',
      }}
    >
      {usage.isPremium ? 'Premium 기준' : '무료 기준'}
    </Text>
  </View>
) : null}

        {notice ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.countCard}>
          <View>
            <Text style={styles.countLabel}>토론 메시지</Text>
            <Text style={styles.countNumber}>
              {messages.length}개
            </Text>
          </View>

          <Text style={styles.countStatus}>
            {loadingMessages ? '불러오는 중' : '준비 완료'}
          </Text>
        </View>

        {!summary ? (
          <Pressable
            style={[
              styles.generateButton,
              generating && styles.disabledButton,
            ]}
            onPress={() => generateSummary(false)}
            disabled={generating}
          >
            <Text style={styles.generateButtonText}>
              {generating
                ? '요약 생성 중...'
                : 'AI 요약 생성'}
            </Text>
          </Pressable>
        ) : null}

        {usage ? (
          <View style={styles.usageCard}>
            <View>
              <Text style={styles.usageLabel}>
                오늘 AI 요약 사용량
              </Text>

              <Text style={styles.usageNumber}>
                {usage.used}/{usage.limit}회
              </Text>
            </View>

            <View style={styles.remainBadge}>
              <Text style={styles.remainText}>
                {usage.remaining}회 남음
              </Text>
            </View>
          </View>
        ) : null}

        {summary ? (
          <>
            <Text style={styles.sectionTitle}>토론 점수</Text>

            <View style={styles.scoreCard}>
              <View>
                <Text style={styles.scoreLabel}>TOTAL SCORE</Text>
                <Text style={styles.scoreNumber}>{score}점</Text>
              </View>

              <View style={styles.gradeCircle}>
                <Text style={styles.gradeText}>{grade}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>핵심 요약</Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>

            <Text style={styles.sectionTitle}>다음 토론 조언</Text>

            <View style={styles.adviceCard}>
              <Text style={styles.adviceTitle}>
                더 좋은 토론을 위해
              </Text>
              <Text style={styles.adviceText}>{advice}</Text>
            </View>

            {savedAt ? (
              <Text style={styles.savedText}>
                저장 시간:{' '}
                {new Date(savedAt).toLocaleString('ko-KR')}
              </Text>
            ) : null}

            <Pressable
              style={[
                styles.regenerateButton,
                generating && styles.disabledButton,
              ]}
              onPress={regenerateSummary}
              disabled={generating}
            >
              <Text style={styles.regenerateText}>
                {generating
                  ? '다시 생성 중...'
                  : 'AI 요약 다시 생성'}
              </Text>
            </Pressable>
          </>
        ) : null}

        <Pressable
          style={styles.roomButton}
          onPress={() =>
            router.replace('/room-list' as any)
          }
        >
          <Text style={styles.roomButtonText}>
            채팅방 목록으로 이동
          </Text>
        </Pressable>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            기존 요약은 다시 차감되지 않아요
          </Text>

          <Text style={styles.infoText}>
            생성된 요약은 이 기기에 저장됩니다. 화면을 다시 열어도
            기존 결과가 표시되며, ‘다시 생성’을 눌렀을 때만 사용
            횟수가 추가로 차감됩니다.
          </Text>
        </View>
      </ScrollView>

      <BottomNav active="rooms" />
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
    paddingBottom: 160,
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
    color: BRAND.blue,
    marginTop: 8,
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
    fontSize: 27,
    fontWeight: '900',
    marginTop: 10,
    lineHeight: 35,
  },
  heroText: {
    color: BRAND.white,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  noticeCard: {
    marginTop: 18,
    borderRadius: 17,
    backgroundColor: BRAND.yellow,
    padding: 17,
  },
  noticeTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  noticeText: {
    color: BRAND.black,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  countCard: {
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countLabel: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '800',
  },
  countNumber: {
    color: BRAND.blue,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 5,
  },
  countStatus: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  generateButton: {
    marginTop: 20,
    height: 60,
    borderRadius: 18,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '900',
  },
  usageCard: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usageLabel: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '800',
  },
  usageNumber: {
    color: BRAND.black,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 5,
  },
  remainBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.blue,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  remainText: {
    color: BRAND.white,
    fontSize: 12,
    fontWeight: '900',
  },
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 28,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scoreCard: {
    borderRadius: 22,
    backgroundColor: BRAND.black,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scoreNumber: {
    color: BRAND.white,
    fontSize: 38,
    fontWeight: '900',
    marginTop: 7,
  },
  gradeCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    color: BRAND.white,
    fontSize: 30,
    fontWeight: '900',
  },
  summaryCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 20,
  },
  summaryText: {
    color: BRAND.black,
    fontSize: 15,
    lineHeight: 25,
  },
  adviceCard: {
    borderRadius: 22,
    backgroundColor: BRAND.yellow,
    padding: 20,
  },
  adviceTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  adviceText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  savedText: {
    color: '#666',
    fontSize: 11,
    marginTop: 12,
    textAlign: 'right',
  },
  regenerateButton: {
    marginTop: 22,
    height: 56,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regenerateText: {
    color: BRAND.blue,
    fontSize: 14,
    fontWeight: '900',
  },
  roomButton: {
    marginTop: 14,
    height: 58,
    borderRadius: 17,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  infoCard: {
    marginTop: 22,
    borderRadius: 19,
    backgroundColor: '#F2F2F2',
    padding: 18,
  },
  infoTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  infoText: {
    color: BRAND.black,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.55,
  },
});