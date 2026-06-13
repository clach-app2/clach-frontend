import React, { useEffect, useMemo, useState } from 'react';
import {
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
type RankingUser = {
  _id?: string;
  id?: string;
  name?: string;
  nickname?: string;
  email?: string;
  score?: number;
  isPremium?: boolean;
  scoreHistory?: unknown[];
};

export default function RankingScreen() {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [myEmail, setMyEmail] = useState('');
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

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('clach_user');

      if (savedUser) {
        const user = JSON.parse(savedUser);
        setMyEmail(user.email || '');
      }
    } catch {
      console.log('내 정보 불러오기 실패');
    }
  };

  const loadRanking = async () => {
    try {
      setLoading(true);
      setMessage('');

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

            const sortedList = [...list].sort(
              (a, b) => Number(b.score || 0) - Number(a.score || 0)
            );

            setRanking(sortedList);
            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }

      setMessage('랭킹 API를 찾지 못했어요.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    loadRanking();
  }, []);

  const topThree = useMemo(() => {
    return ranking.slice(0, 3);
  }, [ranking]);

  const myRank = useMemo(() => {
    if (!myEmail) return null;

    const index = ranking.findIndex((user) => user.email === myEmail);

    if (index === -1) return null;

    return {
      rank: index + 1,
      user: ranking[index],
    };
  }, [ranking, myEmail]);

  const getDisplayName = (user: RankingUser) => {
    return user.nickname || user.name || '토론가';
  };

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadRanking} />
        }
      >
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>랭킹</Text>

          <Pressable style={styles.headerButton} onPress={loadRanking}>
            <Text style={styles.refreshText}>새로고침</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>DEBATE RANKING</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>랭킹 시스템</Text>
          <Text style={styles.heroTitle}>토론 점수로 순위가 올라가요</Text>
          <Text style={styles.heroText}>
            AI 요약 화면에서 점수를 랭킹에 반영하면 누적 점수가 올라갑니다.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        {myRank ? (
          <>
            <Text style={styles.sectionTitle}>내 랭킹</Text>

            <View style={styles.myRankCard}>
              <View>
                <Text style={styles.myRankLabel}>MY RANK</Text>
                <Text style={styles.myRankNumber}>{myRank.rank}위</Text>
                <Text style={styles.myRankName}>
                  {getDisplayName(myRank.user)}
                </Text>
              </View>

              <View style={styles.myScoreCircle}>
                <Text style={styles.myScoreGrade}>
                  {getGrade(Number(myRank.user.score || 0))}
                </Text>
                <Text style={styles.myScoreText}>
                  {Number(myRank.user.score || 0)}점
                </Text>
              </View>
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>TOP 3</Text>

        {topThree.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>아직 랭킹이 없어요</Text>
            <Text style={styles.emptyText}>
              토론을 하고 AI 요약 화면에서 점수를 반영해보세요.
            </Text>
          </View>
        ) : (
          <View style={styles.topBox}>
            {topThree.map((user, index) => {
              const score = Number(user.score || 0);

              return (
                <View
                  key={user._id || user.id || user.email || String(index)}
                  style={[
                    styles.topCard,
                    index === 0 && styles.firstTopCard,
                  ]}
                >
                  <Text style={styles.topRank}>{index + 1}</Text>
                  <Text style={styles.topMedal}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </Text>
                  <Text style={styles.topName} numberOfLines={1}>
                    {getDisplayName(user)}
                  </Text>
                  <Text style={styles.topScore}>{score}점</Text>
                  <Text style={styles.topGrade}>
                    {getGrade(score)} · {getGradeText(score)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionTitle}>전체 랭킹</Text>

        {ranking.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>표시할 사용자가 없어요</Text>
            <Text style={styles.emptyText}>
              점수를 저장하면 여기에 순위가 표시됩니다.
            </Text>
          </View>
        ) : (
          ranking.map((user, index) => {
            const score = Number(user.score || 0);
            const isMe = myEmail && user.email === myEmail;

            return (
              <View
                key={user._id || user.id || user.email || String(index)}
                style={[styles.rankCard, isMe && styles.myHighlightCard]}
              >
                <View style={styles.rankLeft}>
                  <View
                    style={[
                      styles.rankNumberBox,
                      index === 0 && styles.goldBox,
                      index === 1 && styles.silverBox,
                      index === 2 && styles.bronzeBox,
                    ]}
                  >
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  </View>

                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {getDisplayName(user)}
                      </Text>

                      {user.isPremium ? (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumText}>PREMIUM</Text>
                        </View>
                      ) : null}

                      {isMe ? (
                        <View style={styles.meBadge}>
                          <Text style={styles.meText}>ME</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.userGrade}>
                      {getGrade(score)} 등급 · {getGradeText(score)}
                    </Text>
                  </View>
                </View>

                <View style={styles.scoreBox}>
                  <Text style={styles.scoreText}>{score}</Text>
                  <Text style={styles.scoreLabel}>점</Text>
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>점수 올리는 방법</Text>

        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>랭킹 점수는 이렇게 올라가요</Text>
          <Text style={styles.guideText}>
            1. 토론방에서 메시지를 주고받기{'\n'}
            2. AI 요약 화면으로 이동하기{'\n'}
            3. 토론 점수 확인하기{'\n'}
            4. 내 점수 랭킹에 반영하기 누르기
          </Text>
        </View>

        <Pressable
          style={styles.blueButton}
          onPress={() => router.push('/room-list' as any)}
        >
          <Text style={styles.blueButtonText}>토론방 참여하기</Text>
        </Pressable>

        <Pressable
          style={styles.yellowButton}
          onPress={() =>
            router.push({
              pathname: '/create-room' as any,
              params: {
                roomType: 'text',
              },
            })
          }
        >
          <Text style={styles.yellowButtonText}>새 토론방 만들기</Text>
        </Pressable>
      </ScrollView>

      <BottomNav active="profile" />
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
  myRankCard: {
    borderRadius: 24,
    backgroundColor: BRAND.black,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myRankLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  myRankNumber: {
    color: BRAND.white,
    fontSize: 42,
    fontWeight: '900',
    marginTop: 8,
  },
  myRankName: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '800',
  },
  myScoreCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myScoreGrade: {
    color: BRAND.black,
    fontSize: 32,
    fontWeight: '900',
  },
  myScoreText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
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
  topBox: {
    gap: 12,
  },
  topCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    alignItems: 'center',
  },
  firstTopCard: {
    backgroundColor: BRAND.yellow,
    borderColor: BRAND.yellow,
  },
  topRank: {
    color: BRAND.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  topMedal: {
    fontSize: 34,
    marginTop: 6,
  },
  topName: {
    color: BRAND.black,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  topScore: {
    color: BRAND.black,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },
  topGrade: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  rankCard: {
    minHeight: 82,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myHighlightCard: {
    borderColor: BRAND.blue,
    borderWidth: 2,
    backgroundColor: '#F7FAFF',
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNumberBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldBox: {
    backgroundColor: BRAND.yellow,
  },
  silverBox: {
    backgroundColor: '#E5E5E5',
  },
  bronzeBox: {
    backgroundColor: '#D6A15D',
  },
  rankNumber: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
    maxWidth: 120,
  },
  premiumBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  premiumText: {
    color: BRAND.black,
    fontSize: 9,
    fontWeight: '900',
  },
  meBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.blue,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  meText: {
    color: BRAND.white,
    fontSize: 9,
    fontWeight: '900',
  },
  userGrade: {
    color: BRAND.black,
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
  },
  scoreBox: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  scoreText: {
    color: BRAND.blue,
    fontSize: 24,
    fontWeight: '900',
  },
  scoreLabel: {
    color: BRAND.black,
    fontSize: 11,
    fontWeight: '900',
  },
  guideCard: {
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 18,
  },
  guideTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
  },
  guideText: {
    color: BRAND.black,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 24,
  },
  blueButton: {
    marginTop: 22,
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
  yellowButton: {
    marginTop: 12,
    height: 58,
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yellowButtonText: {
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