import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';
import BottomNav from '../components/BottomNav';
type ScoreHistory = {
  roomId?: string;
  roomTitle?: string;
  score?: number;
  grade?: string;
  createdAt?: string;
};

type User = {
  _id?: string;
  name?: string;
  nickname?: string;
  email?: string;
  score?: number;
  isPremium?: boolean;
  scoreHistory?: ScoreHistory[];
};

export default function ProfileScreen() {
  const [user, setUser] = useState<User>({
    name: '토론가',
    email: '',
    score: 0,
    isPremium: false,
    scoreHistory: [],
  });

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

  const getDisplayName = () => {
    return user.nickname || user.name || '토론가';
  };

  const getScore = () => {
    return Number(user.score || 0);
  };

  const getGrade = (score: number) => {
    if (score >= 1000) return 'S';
    if (score >= 700) return 'A';
    if (score >= 400) return 'B';
    if (score >= 200) return 'C';
    return 'D';
  };

  const getGradeText = (score: number) => {
    if (score >= 1000) return '토론 마스터';
    if (score >= 700) return '상급 토론가';
    if (score >= 400) return '성장형 토론가';
    if (score >= 200) return '입문 토론가';
    return '새싹 토론가';
  };

  const getNextGoal = (score: number) => {
    if (score < 200) return 200;
    if (score < 400) return 400;
    if (score < 700) return 700;
    if (score < 1000) return 1000;
    return 1200;
  };

  const progressPercent = useMemo(() => {
    const score = getScore();
    const nextGoal = getNextGoal(score);

    return Math.min(100, Math.round((score / nextGoal) * 100));
  }, [user.score]);

  const loadLocalUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('clach_user');

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);

        setUser((prev) => ({
          ...prev,
          name: parsedUser.name || parsedUser.nickname || '토론가',
          nickname: parsedUser.nickname || parsedUser.name || '토론가',
          email: parsedUser.email || '',
          score: Number(parsedUser.score || 0),
          isPremium: parsedUser.isPremium === true,
        }));
      }
    } catch {
      console.log('로컬 사용자 정보 불러오기 실패');
    }
  };

  const loadServerProfile = async () => {
    try {
      setLoading(true);
      setMessage('');

      const savedUser = await AsyncStorage.getItem('clach_user');

      if (!savedUser) {
        setMessage('로그인 정보가 없습니다.');
        return;
      }

      const localUser = JSON.parse(savedUser);
      const email = localUser.email || '';

      if (!email) {
        setMessage('사용자 이메일을 찾지 못했습니다.');
        return;
      }

      const baseUrl = getBaseUrl();

      const urls = [
        `${baseUrl}/api/ranking`,
        `${baseUrl}/ranking`,
        `${baseUrl}/api/users/ranking`,
        `${baseUrl}/users/ranking`,
        `${baseUrl}/api/leaderboard`,
        `${baseUrl}/leaderboard`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url);
          const data = await safeJson(res);

          if (res.ok) {
            const list = Array.isArray(data?.ranking)
              ? data.ranking
              : Array.isArray(data?.users)
                ? data.users
                : Array.isArray(data?.data)
                  ? data.data
                  : Array.isArray(data)
                    ? data
                    : [];

            const serverUser = list.find((item: User) => item.email === email);

            if (serverUser) {
              const mergedUser = {
                ...localUser,
                ...serverUser,
                name: serverUser.name || serverUser.nickname || localUser.name || '토론가',
                nickname: serverUser.nickname || serverUser.name || localUser.nickname || '토론가',
                email,
                score: Number(serverUser.score || 0),
                isPremium: serverUser.isPremium === true || localUser.isPremium === true,
                scoreHistory: Array.isArray(serverUser.scoreHistory)
                  ? serverUser.scoreHistory
                  : [],
              };

              setUser(mergedUser);
              await AsyncStorage.setItem('clach_user', JSON.stringify(mergedUser));
              return;
            }

            setUser((prev) => ({
              ...prev,
              ...localUser,
              email,
            }));

            return;
          }
        } catch {
          continue;
        }
      }

      setMessage('프로필 점수 정보를 불러오지 못했어요.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃할까요?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('clach_user');
          await AsyncStorage.removeItem('clach_token');
          router.replace('/login' as any);
        },
      },
    ]);
  };

  const recentHistory = useMemo(() => {
    const history = Array.isArray(user.scoreHistory) ? user.scoreHistory : [];

    return [...history]
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [user.scoreHistory]);

  const formatDate = (value?: string) => {
    if (!value) return '';

    try {
      const date = new Date(value);

      return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    loadLocalUser();
    loadServerProfile();
  }, []);

  const score = getScore();
  const grade = getGrade(score);
  const gradeText = getGradeText(score);
  const nextGoal = getNextGoal(score);

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadServerProfile} />
        }
      >
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>프로필</Text>

          <Pressable style={styles.headerButton} onPress={loadServerProfile}>
            <Text style={styles.refreshText}>새로고침</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>MY DEBATE PROFILE</Text>
        </View>

        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getDisplayName().slice(0, 1)}</Text>
          </View>

          <Text style={styles.name}>{getDisplayName()}</Text>
          <Text style={styles.email}>{user.email || '이메일 없음'}</Text>

          {user.isPremium ? (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>♛ CLACH PREMIUM</Text>
            </View>
          ) : (
            <Pressable style={styles.upgradeBadge} onPress={() => router.push('/premium' as any)}>
              <Text style={styles.upgradeText}>프리미엄 업그레이드</Text>
            </Pressable>
          )}
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>내 토론 등급</Text>

        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreLabel}>TOTAL SCORE</Text>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scoreGrade}>
              {grade} 등급 · {gradeText}
            </Text>
          </View>

          <View style={styles.gradeCircle}>
            <Text style={styles.gradeCircleText}>{grade}</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressTitle}>다음 목표</Text>
            <Text style={styles.progressNumber}>
              {score}/{nextGoal}점
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          <Text style={styles.progressText}>
            다음 등급까지 꾸준히 토론하고 점수를 저장해보세요.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>내 토론 기록</Text>

        {recentHistory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>아직 점수 기록이 없어요</Text>
            <Text style={styles.emptyText}>
              토론 후 AI 요약 화면에서 “내 점수 랭킹에 반영하기”를 누르면 기록이 쌓입니다.
            </Text>
          </View>
        ) : (
          recentHistory.map((item, index) => (
            <View key={`${item.roomId || index}-${item.createdAt || index}`} style={styles.historyCard}>
              <View style={styles.historyTopRow}>
                <Text style={styles.historyTitle} numberOfLines={1}>
                  {item.roomTitle || '토론방'}
                </Text>

                <View style={styles.historyGrade}>
                  <Text style={styles.historyGradeText}>{item.grade || 'D'}</Text>
                </View>
              </View>

              <Text style={styles.historyScore}>+{Number(item.score || 0)}점</Text>
              <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>바로가기</Text>

        <View style={styles.menuBox}>
          <MenuItem title="랭킹 보기" sub="전체 토론 점수 순위를 확인합니다." path="/ranking" />
          <MenuItem title="새 토론방 만들기" sub="일반 채팅 또는 음성 토론방을 만듭니다." path="/create-room" />
          <MenuItem title="토론방 탐색" sub="진행 중인 토론방에 참여합니다." path="/room-list" />
          <MenuItem title="AI 중재자 가이드" sub="AI 중재자 기능 사용법을 확인합니다." path="/guide" />
          <MenuItem title="문의 내역" sub="내가 보낸 문의를 확인합니다." path="/my-contacts" />
          <MenuItem title="설정" sub="계정과 앱 설정을 관리합니다." path="/settings" />
        </View>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </ScrollView>

     <BottomNav active="profile" />
    </View>
  );
}

function MenuItem({
  title,
  sub,
  path,
}: {
  title: string;
  sub: string;
  path: string;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={() => router.push(path as any)}>
      <View style={styles.menuTextBox}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>

      <Text style={styles.menuArrow}>›</Text>
    </Pressable>
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
    width: 72,
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
  refreshText: {
    color: BRAND.blue,
    fontSize: 12,
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
  profileHero: {
    borderRadius: 28,
    backgroundColor: BRAND.blue,
    padding: 26,
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: BRAND.black,
    fontSize: 42,
    fontWeight: '900',
  },
  name: {
    color: BRAND.white,
    marginTop: 18,
    fontSize: 26,
    fontWeight: '900',
  },
  email: {
    color: BRAND.white,
    marginTop: 6,
    fontSize: 13,
  },
  premiumBadge: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  premiumText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  upgradeBadge: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  upgradeText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
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
  scoreCard: {
    borderRadius: 24,
    backgroundColor: BRAND.black,
    padding: 24,
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
    fontSize: 54,
    fontWeight: '900',
    marginTop: 6,
  },
  scoreGrade: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  gradeCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeCircleText: {
    color: BRAND.black,
    fontSize: 38,
    fontWeight: '900',
  },
  progressCard: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTitle: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  progressNumber: {
    color: BRAND.blue,
    fontSize: 15,
    fontWeight: '900',
  },
  progressBar: {
    marginTop: 12,
    height: 10,
    borderRadius: 999,
    backgroundColor: BRAND.line,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: BRAND.blue,
  },
  progressText: {
    color: BRAND.black,
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 20,
  },
  emptyTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  historyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    marginBottom: 12,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
    marginRight: 12,
  },
  historyGrade: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyGradeText: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  historyScore: {
    color: BRAND.blue,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
  },
  historyDate: {
    color: BRAND.black,
    fontSize: 12,
    marginTop: 4,
  },
  menuBox: {
    gap: 12,
  },
  menuItem: {
    minHeight: 74,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuTextBox: {
    flex: 1,
  },
  menuTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  menuSub: {
    color: BRAND.black,
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
  },
  menuArrow: {
    color: BRAND.black,
    fontSize: 30,
    fontWeight: '300',
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 24,
    height: 56,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: BRAND.white,
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
  navActive: {
    color: BRAND.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  navPlus: {
    color: BRAND.black,
    fontSize: 30,
    fontWeight: '900',
  },
});