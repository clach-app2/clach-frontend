import React, { useEffect, useMemo, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';
import BottomNav from '../components/BottomNav';

type RoomType = 'text' | 'voice';

type User = {
  name?: string;
  nickname?: string;
  email?: string;
  isPremium?: boolean;
};

export default function CreateRoomScreen() {
  const params = useLocalSearchParams<{
    roomType?: string;
  }>();

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [roomType, setRoomType] = useState<RoomType>(
    params.roomType === 'voice' ? 'voice' : 'text'
  );

  const [timeLimit, setTimeLimit] = useState(30);
  const [maxParticipants, setMaxParticipants] = useState(6);

  const [user, setUser] = useState<User>({
    name: '토론가',
    email: '',
    isPremium: false,
  });

  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const freeTimeOptions = [30];
  const premiumTimeOptions = [30, 60, 90, 120];

  const timeOptions = useMemo(() => {
    return isPremium ? premiumTimeOptions : freeTimeOptions;
  }, [isPremium]);

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

 const loadUser = async () => {
  try {
    setMessage('');

    const savedUser = await AsyncStorage.getItem('clach_user');

    if (!savedUser) {
      setUser({
        name: '토론가',
        nickname: '토론가',
        email: '',
        isPremium: false,
      });

      setIsPremium(false);
      setTimeLimit(30);
      return;
    }

    const localUser = JSON.parse(savedUser);

    const localEmail = String(localUser.email || '')
      .trim()
      .toLowerCase();

    const temporaryUser: User = {
      name:
        localUser.name ||
        localUser.nickname ||
        '토론가',

      nickname:
        localUser.nickname ||
        localUser.name ||
        '토론가',

      email: localEmail,

      isPremium: localUser.isPremium === true,
    };

    setUser(temporaryUser);
    setIsPremium(temporaryUser.isPremium === true);

    if (!temporaryUser.isPremium) {
      setTimeLimit(30);
    }

    if (!localEmail) {
      setMessage(
        '로그인 이메일을 찾지 못해 Premium 상태를 확인할 수 없습니다.'
      );

      setIsPremium(false);
      setTimeLimit(30);
      return;
    }

    const baseUrl = getBaseUrl();
    const encodedEmail = encodeURIComponent(localEmail);

    const urls = [
      `${baseUrl}/api/users/by-email/${encodedEmail}`,
      `${baseUrl}/users/by-email/${encodedEmail}`,
      `${baseUrl}/api/user/${encodedEmail}`,
      `${baseUrl}/user/${encodedEmail}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        const data = await safeJson(res);

        if (!res.ok) {
          continue;
        }

        const serverUser = data?.user || {};

        const nextUser: User = {
          ...temporaryUser,
          ...serverUser,

          name:
            serverUser.name ||
            serverUser.nickname ||
            temporaryUser.name ||
            '토론가',

          nickname:
            serverUser.nickname ||
            serverUser.name ||
            temporaryUser.nickname ||
            '토론가',

          email:
            serverUser.email ||
            temporaryUser.email ||
            '',

          isPremium: serverUser.isPremium === true,
        };

        setUser(nextUser);
        setIsPremium(nextUser.isPremium === true);

        if (!nextUser.isPremium) {
          setTimeLimit(30);
        }

        await AsyncStorage.setItem(
          'clach_user',
          JSON.stringify(nextUser)
        );

        if (nextUser.isPremium) {
          await AsyncStorage.setItem(
            'clach_premium',
            'true'
          );
        } else {
          await AsyncStorage.removeItem(
            'clach_premium'
          );
        }

        return;
      } catch {
        continue;
      }
    }

    setMessage(
      '서버에서 Premium 상태를 확인하지 못했습니다. 무료 플랜으로 적용합니다.'
    );

    setIsPremium(false);
    setTimeLimit(30);
  } catch {
    setMessage('사용자 정보를 불러오지 못했습니다.');
    setIsPremium(false);
    setTimeLimit(30);
  }
};

  const selectTimeLimit = (minutes: number) => {
    if (!isPremium && minutes > 30) {
      Alert.alert(
        '프리미엄 기능',
        '무료 사용자는 30분 토론방만 만들 수 있습니다. 긴 토론 시간은 프리미엄에서 사용할 수 있어요.',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '프리미엄 보기',
            onPress: () => router.push('/premium' as any),
          },
        ]
      );

      return;
    }

    setTimeLimit(minutes);
  };

  const createRoom = async () => {
    if (loading) return;

if (!user.email) {
  Alert.alert(
    '로그인 필요',
    '토론방을 만들려면 로그인 정보가 필요합니다.'
  );

  return;
}

    if (!title.trim()) {
      Alert.alert('입력 필요', '토론방 제목을 입력해주세요.');
      return;
    }

    if (!topic.trim()) {
      Alert.alert('입력 필요', '토론 주제를 입력해주세요.');
      return;
    }

    if (!isPremium && timeLimit > 30) {
      Alert.alert(
        '프리미엄 필요',
        '무료 사용자는 30분 토론방만 만들 수 있습니다.'
      );
      setTimeLimit(30);
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const baseUrl = getBaseUrl();

      const bodyData = {
  title: title.trim(),
  topic: topic.trim(),
  roomType,
  timeLimit: isPremium ? timeLimit : 30,
  maxParticipants,
  creatorName:
    user.name ||
    user.nickname ||
    '토론가',
  creatorEmail: user.email || '',
  userEmail: user.email || '',
};

      const urls = [
        `${baseUrl}/api/rooms`,
        `${baseUrl}/rooms`,
        `${baseUrl}/api/room`,
        `${baseUrl}/room`,
        `${baseUrl}/api/create-room`,
        `${baseUrl}/create-room`,
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
            const room = data?.room || data?.data || data;
            const roomId = room?._id || room?.id || room?.roomId;
            const roomTitle = room?.title || title.trim();

            Alert.alert('토론방 생성 완료', '토론방이 만들어졌습니다.', [
              {
                text: '입장하기',
                onPress: () => {
                  if (roomType === 'voice') {
                    router.replace({
                      pathname: '/voice-room' as any,
                      params: {
                        roomId,
                        roomTitle,
                      },
                    });

                    return;
                  }

                  router.replace({
                    pathname: '/chat-room' as any,
                    params: {
                      roomId,
                      roomTitle,
                    },
                  });
                },
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

      setMessage('토론방 생성 API를 찾지 못했어요.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (params.roomType === 'voice') {
      setRoomType('voice');
    }

    if (params.roomType === 'text') {
      setRoomType('text');
    }
  }, [params.roomType]);

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable style={styles.headerButton} onPress={() => router.back()}>
              <Text style={styles.back}>‹</Text>
            </Pressable>

            <Text style={styles.headerTitle}>토론방 만들기</Text>

            <Pressable style={styles.headerButton} onPress={() => router.replace('/home' as any)}>
              <Text style={styles.homeText}>홈</Text>
            </Pressable>
          </View>

          <View style={styles.brandBox}>
            <Text style={styles.logo}>CLACH</Text>
            <Text style={styles.slogan}>CREATE DEBATE ROOM</Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>새 토론 시작</Text>
            <Text style={styles.heroTitle}>
              주제를 정하고 토론방을 만들어보세요
            </Text>
            <Text style={styles.heroText}>
              무료 사용자는 30분 토론방을 만들 수 있고, 프리미엄 사용자는 더 긴 토론 시간을 선택할 수 있습니다.
            </Text>
          </View>

          {message ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>안내</Text>
              <Text style={styles.noticeText}>{message}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>토론 방식</Text>

          <View style={styles.typeRow}>
            <Pressable
              style={roomType === 'text' ? styles.typeCardActive : styles.typeCard}
              onPress={() => setRoomType('text')}
            >
              <Text style={roomType === 'text' ? styles.typeIconActive : styles.typeIcon}>
                💬
              </Text>
              <Text style={roomType === 'text' ? styles.typeTitleActive : styles.typeTitle}>
                일반 채팅
              </Text>
              <Text style={roomType === 'text' ? styles.typeTextActive : styles.typeText}>
                글로 토론
              </Text>
            </Pressable>

            <Pressable
              style={roomType === 'voice' ? styles.typeCardActiveYellow : styles.typeCard}
              onPress={() => setRoomType('voice')}
            >
              <Text style={styles.typeIcon}>🎙️</Text>
              <Text style={roomType === 'voice' ? styles.typeTitleYellow : styles.typeTitle}>
                음성 토론
              </Text>
              <Text style={roomType === 'voice' ? styles.typeTextYellow : styles.typeText}>
                말로 토론
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>토론방 제목</Text>

          <TextInput
            style={styles.input}
            placeholder="예: AI는 인간의 일자리를 대체할까?"
            placeholderTextColor="#777"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.sectionTitle}>토론 주제 설명</Text>

          <TextInput
            style={styles.textArea}
            placeholder="토론할 내용을 간단히 적어주세요."
            placeholderTextColor="#777"
            value={topic}
            onChangeText={setTopic}
            multiline
          />

          <Text style={styles.sectionTitle}>토론 시간</Text>

          <View style={styles.planNoticeCard}>
            <Text style={styles.planNoticeTitle}>
              현재 플랜: {isPremium ? 'PREMIUM' : 'FREE'}
            </Text>
            <Text style={styles.planNoticeText}>
              {isPremium
                ? '프리미엄 사용자는 최대 120분까지 토론방을 만들 수 있습니다.'
                : '무료 사용자는 30분 토론방만 만들 수 있습니다.'}
            </Text>
          </View>

          <View style={styles.timeGrid}>
            {premiumTimeOptions.map((minutes) => {
              const locked = !isPremium && minutes > 30;
              const selected = timeLimit === minutes;

              return (
                <Pressable
                  key={minutes}
                  style={[
                    styles.timeCard,
                    selected && styles.timeCardActive,
                    locked && styles.timeCardLocked,
                  ]}
                  onPress={() => selectTimeLimit(minutes)}
                >
                  <Text
                    style={[
                      styles.timeText,
                      selected && styles.timeTextActive,
                      locked && styles.timeTextLocked,
                    ]}
                  >
                    {minutes}분
                  </Text>

                  {locked ? (
                    <Text style={styles.lockText}>PREMIUM</Text>
                  ) : (
                    <Text style={selected ? styles.selectedText : styles.freeText}>
                      {selected ? '선택됨' : minutes === 30 ? '무료 가능' : '프리미엄'}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {!isPremium ? (
            <Pressable style={styles.premiumGuideButton} onPress={() => router.push('/premium' as any)}>
              <Text style={styles.premiumGuideText}>
                긴 토론 시간이 필요하면 프리미엄 보기
              </Text>
            </Pressable>
          ) : null}

          <Text style={styles.sectionTitle}>참여 인원</Text>

          <View style={styles.peopleRow}>
            {[2, 4, 6].map((count) => (
              <Pressable
                key={count}
                style={maxParticipants === count ? styles.peopleCardActive : styles.peopleCard}
                onPress={() => setMaxParticipants(count)}
              >
                <Text style={maxParticipants === count ? styles.peopleTextActive : styles.peopleText}>
                  {count}명
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>방 설정 미리보기</Text>
            <Text style={styles.previewTitle}>{title || '토론방 제목'}</Text>
            <Text style={styles.previewText}>
              {roomType === 'voice' ? '음성 토론방' : '일반 채팅 토론방'} · {isPremium ? timeLimit : 30}분 · 최대 {maxParticipants}명
            </Text>
          </View>

          <Pressable
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={createRoom}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? '생성 중...' : '토론방 만들기'}
            </Text>
          </Pressable>
        </ScrollView>

        <BottomNav active="create" />
      </View>
    </KeyboardAvoidingView>
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
    marginTop: 28,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    minHeight: 118,
  },
  typeCardActive: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: BRAND.black,
    padding: 18,
    minHeight: 118,
  },
  typeCardActiveYellow: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 18,
    minHeight: 118,
  },
  typeIcon: {
    fontSize: 27,
  },
  typeIconActive: {
    fontSize: 27,
  },
  typeTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10,
  },
  typeTitleActive: {
    color: BRAND.white,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10,
  },
  typeTitleYellow: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 10,
  },
  typeText: {
    color: BRAND.black,
    fontSize: 12,
    marginTop: 5,
  },
  typeTextActive: {
    color: BRAND.white,
    fontSize: 12,
    marginTop: 5,
  },
  typeTextYellow: {
    color: BRAND.black,
    fontSize: 12,
    marginTop: 5,
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
  textArea: {
    minHeight: 118,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 18,
    paddingTop: 16,
    color: BRAND.black,
    fontSize: 15,
    backgroundColor: BRAND.white,
    textAlignVertical: 'top',
  },
  planNoticeCard: {
    borderRadius: 18,
    backgroundColor: BRAND.yellow,
    padding: 16,
    marginBottom: 12,
  },
  planNoticeTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  planNoticeText: {
    color: BRAND.black,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeCard: {
    width: '47%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeCardActive: {
    backgroundColor: BRAND.blue,
    borderColor: BRAND.blue,
  },
  timeCardLocked: {
    backgroundColor: '#F2F2F2',
    borderColor: BRAND.line,
  },
  timeText: {
    color: BRAND.black,
    fontSize: 22,
    fontWeight: '900',
  },
  timeTextActive: {
    color: BRAND.white,
  },
  timeTextLocked: {
    color: '#777',
  },
  lockText: {
    color: '#777',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 6,
  },
  selectedText: {
    color: BRAND.white,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 6,
  },
  freeText: {
    color: BRAND.blue,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 6,
  },
  premiumGuideButton: {
    marginTop: 12,
    height: 52,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumGuideText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '900',
  },
  peopleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  peopleCard: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peopleCardActive: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peopleText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  peopleTextActive: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  previewCard: {
    marginTop: 28,
    borderRadius: 22,
    backgroundColor: BRAND.black,
    padding: 20,
  },
  previewLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  previewTitle: {
    color: BRAND.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
  },
  previewText: {
    color: BRAND.white,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  createButton: {
    marginTop: 24,
    height: 62,
    borderRadius: 18,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: BRAND.white,
    fontSize: 17,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
  },
});