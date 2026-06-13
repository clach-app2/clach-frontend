import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../constants/config';

export default function RoomsScreen() {
  const params = useLocalSearchParams();

  const userEmail = params.userEmail
    ? String(params.userEmail)
    : 'guest@clach.app';

  const userName = params.userName
    ? String(params.userName)
    : '게스트';

  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const defaultRooms = [
    '정치 토론방',
    '학교 토론방',
    'AI 토론방',
    '경제 토론방',
    '환경 토론방',
    '스포츠 토론방',
  ];

  useEffect(() => {
    getRooms();
  }, []);

  const getRooms = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${SERVER_URL}/rooms`);
      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          '불러오기 실패',
          data.message || '토론방 목록을 불러오지 못했습니다.'
        );
        setRooms([]);
        return;
      }

      setRooms(data.rooms || []);
    } catch (err) {
      console.log('토론방 목록 불러오기 실패:', err);
      Alert.alert(
        '서버 연결 실패',
        '백엔드 서버가 켜져 있는지, constants/config.ts의 SERVER_URL 주소가 맞는지 확인해주세요.'
      );
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (creating) return;

    const title = newRoomTitle.trim();

    if (!title) {
      Alert.alert('제목 필요', '토론방 제목을 입력해주세요.');
      return;
    }

    try {
      setCreating(true);

      const response = await fetch(`${SERVER_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('생성 실패', data.message || '토론방을 만들지 못했습니다.');
        return;
      }

      setNewRoomTitle('');
      Alert.alert('생성 완료', '토론방이 생성되었습니다.');
      getRooms();
    } catch (err) {
      console.log('토론방 생성 실패:', err);
      Alert.alert('서버 연결 실패', '백엔드 서버 연결을 확인해주세요.');
    } finally {
      setCreating(false);
    }
  };

  const enterRoom = (title: string) => {
    router.push({
      pathname: '/chat',
      params: {
        title,
        userEmail,
        userName,
      },
    });
  };

  const deleteRoom = async (item: any) => {
    if (!item._id) {
      Alert.alert('삭제 불가', '기본 추천 토론방은 삭제할 수 없습니다.');
      return;
    }

    Alert.alert('토론방 삭제', `"${item.title}" 토론방을 삭제할까요?`, [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${SERVER_URL}/rooms/${item._id}`, {
              method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
              Alert.alert(
                '삭제 실패',
                data.message || '토론방 삭제에 실패했습니다.'
              );
              return;
            }

            Alert.alert('삭제 완료', '토론방이 삭제되었습니다.');
            getRooms();
          } catch (err) {
            console.log('토론방 삭제 실패:', err);
            Alert.alert('서버 연결 실패', '백엔드 서버 연결을 확인해주세요.');
          }
        },
      },
    ]);
  };

  const goProfile = () => {
    router.push({
      pathname: '/profile',
      params: {
        userEmail,
        userName,
      },
    });
  };

  const goRanking = () => {
    router.push({
      pathname: '/ranking',
      params: {
        userEmail,
        userName,
      },
    });
  };

  const goGuide = () => {
    router.push({
      pathname: '/guide',
      params: {
        userEmail,
        userName,
      },
    });
  };

  const goSettings = () => {
    router.push({
      pathname: '/settings',
      params: {
        userEmail,
        userName,
      },
    });
  };

  const goCheck = () => {
    router.push({
      pathname: '/check',
      params: {
        userEmail,
        userName,
      },
    });
  };

  const logout = () => {
    Alert.alert('로그아웃', '정말 로그아웃할까요?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('clach_user');
            router.replace('/login');
          } catch (err) {
            console.log('로그아웃 실패:', err);
            Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
          }
        },
      },
    ]);
  };

  const combinedRooms = [
    ...defaultRooms.map((title) => ({
      title,
      isDefault: true,
    })),
    ...rooms.map((room) => ({
      ...room,
      isDefault: false,
    })),
  ];

  const filteredRooms = combinedRooms.filter((room) => {
    const title = String(room.title || '').toLowerCase();
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return true;

    return title.includes(keyword);
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>CLACH ROOMS</Text>
      <Text style={styles.title}>토론방 목록</Text>

      <Text style={styles.userText}>{userName}님 환영합니다</Text>
      <Text style={styles.emailText}>{userEmail}</Text>

      <View style={styles.serverCard}>
        <Text style={styles.serverTitle}>서버 연결 주소</Text>
        <Text style={styles.serverText}>{SERVER_URL}</Text>
        <Text style={styles.serverDesc}>
          서버 주소는 constants/config.ts에서 관리됩니다.
        </Text>
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuButton} onPress={goProfile}>
          <Text style={styles.menuButtonText}>내 프로필</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={goRanking}>
          <Text style={styles.menuButtonText}>랭킹</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={goGuide}>
          <Text style={styles.menuButtonText}>토론 가이드</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={goSettings}>
          <Text style={styles.menuButtonText}>설정</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.createCard}>
        <Text style={styles.cardTitle}>새 토론방 만들기</Text>

        <TextInput
          style={styles.input}
          placeholder="예: 급식 만족도 토론방"
          placeholderTextColor="#777"
          value={newRoomTitle}
          onChangeText={setNewRoomTitle}
          editable={!creating}
        />

        <TouchableOpacity
          style={[styles.button, creating && styles.disabledButton]}
          onPress={createRoom}
          disabled={creating}
        >
          {creating ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.buttonText}>생성 중...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>토론방 만들기</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.cardTitle}>토론방 검색</Text>

        <TextInput
          style={styles.input}
          placeholder="검색어를 입력하세요"
          placeholderTextColor="#777"
          value={searchText}
          onChangeText={setSearchText}
        />

        <TouchableOpacity style={styles.refreshButton} onPress={getRooms}>
          <Text style={styles.refreshText}>토론방 새로고침</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>참여 가능한 토론방</Text>
        <Text style={styles.sectionCount}>{filteredRooms.length}개</Text>
      </View>

      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#00ff99" />
          <Text style={styles.loadingText}>토론방 목록을 불러오는 중입니다...</Text>
        </View>
      )}

      {!loading && filteredRooms.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>검색 결과 없음</Text>
          <Text style={styles.emptyText}>
            다른 검색어를 입력하거나 새 토론방을 만들어보세요.
          </Text>
        </View>
      )}

      {!loading &&
        filteredRooms.map((item, index) => (
          <View key={item._id || item.title || index} style={styles.roomCard}>
            <View style={styles.roomTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.roomTitle}>{item.title}</Text>

                <Text style={styles.roomDesc}>
                  {item.isDefault ? '기본 추천 토론방' : '사용자가 만든 토론방'}
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  item.isDefault ? styles.defaultBadge : styles.customBadge,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    item.isDefault
                      ? styles.defaultBadgeText
                      : styles.customBadgeText,
                  ]}
                >
                  {item.isDefault ? '추천' : '생성됨'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.enterButton}
              onPress={() => enterRoom(item.title)}
            >
              <Text style={styles.enterText}>입장하기</Text>
            </TouchableOpacity>

            {!item.isDefault && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteRoom(item)}
              >
                <Text style={styles.deleteText}>토론방 삭제</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

      <TouchableOpacity style={styles.checkButton} onPress={goCheck}>
        <Text style={styles.checkButtonText}>앱 최종 점검</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    padding: 24,
    paddingTop: 80,
  },

  label: {
    color: '#00ff99',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  title: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  userText: {
    color: '#00ff99',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  emailText: {
    color: '#888',
    fontSize: 13,
    marginBottom: 18,
  },

  serverCard: {
    backgroundColor: '#071b13',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#00ff99',
    marginBottom: 18,
  },

  serverTitle: {
    color: '#00ff99',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  serverText: {
    color: '#d5ffe9',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  serverDesc: {
    color: '#9deec8',
    fontSize: 13,
    lineHeight: 20,
  },

  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },

  menuButton: {
    width: '48%',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },

  menuButtonText: {
    color: '#00ff99',
    fontSize: 15,
    fontWeight: 'bold',
  },

  createCard: {
    backgroundColor: '#111',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 18,
  },

  searchCard: {
    backgroundColor: '#111',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 18,
  },

  cardTitle: {
    color: '#00ff99',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 14,
  },

  input: {
    backgroundColor: '#050505',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 14,
  },

  button: {
    backgroundColor: '#00ff99',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
  },

  disabledButton: {
    backgroundColor: '#0f8f5d',
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  buttonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: 'bold',
  },

  refreshButton: {
    backgroundColor: '#171717',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },

  refreshText: {
    color: '#00ff99',
    fontSize: 15,
    fontWeight: 'bold',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },

  sectionCount: {
    color: '#00ff99',
    fontSize: 15,
    fontWeight: 'bold',
  },

  loadingCard: {
    backgroundColor: '#111',
    borderRadius: 22,
    padding: 26,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    marginBottom: 18,
  },

  loadingText: {
    color: '#aaa',
    fontSize: 15,
    marginTop: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  emptyCard: {
    backgroundColor: '#111',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 18,
  },

  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  emptyText: {
    color: '#888',
    fontSize: 15,
    lineHeight: 22,
  },

  roomCard: {
    backgroundColor: '#111',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 16,
  },

  roomTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  roomTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  roomDesc: {
    color: '#888',
    fontSize: 14,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 10,
  },

  defaultBadge: {
    backgroundColor: '#071b13',
    borderColor: '#00ff99',
  },

  customBadge: {
    backgroundColor: '#1c1605',
    borderColor: '#ffcc00',
  },

  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  defaultBadgeText: {
    color: '#00ff99',
  },

  customBadgeText: {
    color: '#ffcc00',
  },

  enterButton: {
    backgroundColor: '#00ff99',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },

  enterText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },

  deleteButton: {
    backgroundColor: '#221111',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
  },

  deleteText: {
    color: '#ff5555',
    fontSize: 15,
    fontWeight: 'bold',
  },

  checkButton: {
    backgroundColor: '#1c1605',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffcc00',
    marginTop: 10,
    marginBottom: 14,
  },

  checkButtonText: {
    color: '#ffcc00',
    fontSize: 17,
    fontWeight: 'bold',
  },

  logoutButton: {
    backgroundColor: '#221111',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
  },

  logoutText: {
    color: '#ff5555',
    fontSize: 17,
    fontWeight: 'bold',
  },
});