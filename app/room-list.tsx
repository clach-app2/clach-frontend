import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';
import BottomNav from '../components/BottomNav';

type Room = {
  _id?: string;
  id?: string;
  roomId?: string;
  title?: string;
  topic?: string;
  roomType?: 'text' | 'voice' | string;
  status?: string;
  timeLimit?: number;
  maxParticipants?: number;
  participants?: unknown[];
  createdAt?: string;
};

type FilterType = 'all' | 'text' | 'voice';

export default function RoomListScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

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

  const getRoomId = (room: Room) => {
    return room._id || room.id || room.roomId || '';
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      setMessage('');

      const baseUrl = getBaseUrl();

      const urls = [
        `${baseUrl}/api/rooms`,
        `${baseUrl}/rooms`,
        `${baseUrl}/api/room`,
        `${baseUrl}/room`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url);
          const data = await safeJson(res);

          if (res.ok) {
            const list = Array.isArray(data?.rooms)
              ? data.rooms
              : Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data)
                  ? data
                  : [];

            const sortedList = [...list].sort((a, b) => {
              const aTime = new Date(a.createdAt || 0).getTime();
              const bTime = new Date(b.createdAt || 0).getTime();

              return bTime - aTime;
            });

            setRooms(sortedList);
            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }

      setMessage('토론방 목록 API를 찾지 못했어요.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return rooms.filter((room) => {
      const title = String(room.title || '').toLowerCase();
      const topic = String(room.topic || '').toLowerCase();
      const roomType = room.roomType || 'text';

      const matchesSearch =
        !keyword || title.includes(keyword) || topic.includes(keyword);

      const matchesFilter =
        filterType === 'all' ||
        (filterType === 'text' && roomType !== 'voice') ||
        (filterType === 'voice' && roomType === 'voice');

      return matchesSearch && matchesFilter;
    });
  }, [rooms, searchText, filterType]);

  const enterRoom = (room: Room) => {
    const roomId = getRoomId(room);
    const roomTitle = room.title || '토론방';

    if (!roomId) {
      setMessage('토론방 ID를 찾지 못했어요.');
      return;
    }

    if (room.roomType === 'voice') {
      router.push({
        pathname: '/voice-room' as any,
        params: {
          roomId,
          roomTitle,
        },
      });

      return;
    }

    router.push({
      pathname: '/chat-room' as any,
      params: {
        roomId,
        roomTitle,
      },
    });
  };

  const createTextRoom = () => {
    router.push({
      pathname: '/create-room' as any,
      params: {
        roomType: 'text',
      },
    });
  };

  const createVoiceRoom = () => {
    router.push({
      pathname: '/create-room' as any,
      params: {
        roomType: 'voice',
      },
    });
  };

  useEffect(() => {
    loadRooms();
  }, []);

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadRooms} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topHeader}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>채팅방</Text>

          <Pressable style={styles.refreshButton} onPress={loadRooms}>
            <Text style={styles.refreshText}>새로고침</Text>
          </Pressable>
        </View>

        <View style={styles.brandRow}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>DEBATE ROOMS</Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="토론방 제목이나 주제 검색"
            placeholderTextColor="#777"
            value={searchText}
            onChangeText={setSearchText}
          />

          {searchText ? (
            <Pressable onPress={() => setSearchText('')}>
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          <FilterButton
            title="전체"
            active={filterType === 'all'}
            onPress={() => setFilterType('all')}
          />
          <FilterButton
            title="채팅"
            active={filterType === 'text'}
            onPress={() => setFilterType('text')}
          />
          <FilterButton
            title="음성"
            active={filterType === 'voice'}
            onPress={() => setFilterType('voice')}
          />
        </View>

        <View style={styles.quickRow}>
          <Pressable style={styles.quickBlue} onPress={createTextRoom}>
            <Text style={styles.quickLabel}>TEXT</Text>
            <Text style={styles.quickTitle}>채팅 토론 만들기</Text>
          </Pressable>

          <Pressable style={styles.quickYellow} onPress={createVoiceRoom}>
            <Text style={styles.quickYellowLabel}>VOICE</Text>
            <Text style={styles.quickYellowTitle}>음성 토론 만들기</Text>
          </Pressable>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.listHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>진행 중인 토론방</Text>
            <Text style={styles.roomCount}>
              {filteredRooms.length}개 표시 / 전체 {rooms.length}개
            </Text>
          </View>

          <Pressable style={styles.smallCreateButton} onPress={createTextRoom}>
            <Text style={styles.smallCreateText}>＋ 만들기</Text>
          </Pressable>
        </View>

        {filteredRooms.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>표시할 토론방이 없어요</Text>
            <Text style={styles.emptyText}>
              검색어를 바꾸거나 새 토론방을 만들어보세요.
            </Text>

            <Pressable style={styles.emptyButton} onPress={createTextRoom}>
              <Text style={styles.emptyButtonText}>토론방 만들기</Text>
            </Pressable>
          </View>
        ) : (
          filteredRooms.map((room, index) => {
            const roomId = getRoomId(room);
            const isVoice = room.roomType === 'voice';
            const participantCount = Array.isArray(room.participants)
              ? room.participants.length
              : 0;

            return (
              <Pressable
                key={roomId || String(index)}
                style={styles.roomCard}
                onPress={() => enterRoom(room)}
              >
                <View style={styles.roomTopRow}>
                  <View style={isVoice ? styles.voiceBadge : styles.textBadge}>
                    <Text style={isVoice ? styles.voiceBadgeText : styles.textBadgeText}>
                      {isVoice ? '음성 토론' : '채팅 토론'}
                    </Text>
                  </View>

                  <Text style={styles.statusText}>
                    {room.status === 'ended' ? '종료됨' : '진행 중'}
                  </Text>
                </View>

                <Text style={styles.roomTitle} numberOfLines={2}>
                  {room.title || '제목 없는 토론방'}
                </Text>

                <Text style={styles.roomTopic} numberOfLines={2}>
                  {room.topic || '토론 주제 설명이 없습니다.'}
                </Text>

                <View style={styles.roomInfoRow}>
                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillText}>
                      {Number(room.timeLimit || 30)}분
                    </Text>
                  </View>

                  <View style={styles.infoPill}>
                    <Text style={styles.infoPillText}>
                      {participantCount}/{Number(room.maxParticipants || 6)}명
                    </Text>
                  </View>

                  <View style={styles.enterPill}>
                    <Text style={styles.enterPillText}>입장하기</Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <BottomNav active="rooms" />
    </View>
  );
}

function FilterButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={active ? styles.filterButtonActive : styles.filterButton}
      onPress={onPress}
    >
      <Text style={active ? styles.filterTextActive : styles.filterText}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  container: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  topHeader: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 60,
    height: 46,
    justifyContent: 'center',
  },
  backText: {
    color: BRAND.black,
    fontSize: 42,
    fontWeight: '300',
  },
  headerTitle: {
    color: BRAND.black,
    fontSize: 20,
    fontWeight: '900',
  },
  refreshButton: {
    width: 72,
    height: 46,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  refreshText: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  brandRow: {
    marginTop: 16,
    marginBottom: 18,
  },
  logo: {
    color: BRAND.black,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 10,
  },
  slogan: {
    color: BRAND.blue,
    marginTop: 6,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  searchBox: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '700',
  },
  clearText: {
    color: BRAND.black,
    fontSize: 26,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 18,
  },
  filterButton: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    color: BRAND.black,
    fontSize: 14,
    fontWeight: '900',
  },
  filterTextActive: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '900',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  quickBlue: {
    flex: 1,
    minHeight: 96,
    borderRadius: 20,
    backgroundColor: BRAND.blue,
    padding: 16,
    justifyContent: 'center',
  },
  quickYellow: {
    flex: 1,
    minHeight: 96,
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 16,
    justifyContent: 'center',
  },
  quickLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
  },
  quickTitle: {
    color: BRAND.white,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 8,
    lineHeight: 23,
  },
  quickYellowLabel: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  quickYellowTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 8,
    lineHeight: 23,
  },
  noticeCard: {
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    padding: 16,
    marginBottom: 18,
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
  listHeaderRow: {
    marginTop: 2,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: BRAND.black,
    fontSize: 25,
    fontWeight: '900',
  },
  roomCount: {
    color: BRAND.blue,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 5,
  },
  smallCreateButton: {
    borderRadius: 999,
    backgroundColor: BRAND.black,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  smallCreateText: {
    color: BRAND.white,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyCard: {
    marginTop: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 22,
  },
  emptyTitle: {
    color: BRAND.black,
    fontSize: 22,
    fontWeight: '900',
  },
  emptyText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  emptyButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  emptyButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  roomCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 22,
    marginBottom: 16,
    minHeight: 190,
    backgroundColor: BRAND.white,
  },
  roomTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.blue,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  textBadgeText: {
    color: BRAND.white,
    fontSize: 12,
    fontWeight: '900',
  },
  voiceBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  voiceBadgeText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  statusText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  roomTitle: {
    color: BRAND.black,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 18,
    lineHeight: 32,
  },
  roomTopic: {
    color: BRAND.black,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  roomInfoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    alignItems: 'center',
  },
  infoPill: {
    borderRadius: 999,
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoPillText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  enterPill: {
    marginLeft: 'auto',
    borderRadius: 999,
    backgroundColor: BRAND.black,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  enterPillText: {
    color: BRAND.white,
    fontSize: 12,
    fontWeight: '900',
  },
});