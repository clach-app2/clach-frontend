import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

const SERVER_URL = 'http://172.30.1.39:3000';

export default function PaymentScreen() {
  const params = useLocalSearchParams();

  const roomTitle = params.room ? String(params.room) : '';
  const userEmail = params.userEmail ? String(params.userEmail) : 'guest@clach.app';
  const userName = params.userName ? String(params.userName) : '게스트';

  const subscribe = async () => {
    try {
      if (roomTitle) {
        const response = await fetch(
          `${SERVER_URL}/timer/${encodeURIComponent(roomTitle)}/extend`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userEmail,
            }),
          }
        );

        const data = await response.json();

        Alert.alert('프리미엄 활성화', data.message || '5분 연장되었습니다.', [
          {
            text: '확인',
            onPress: () =>
              router.replace({
                pathname: '/chat',
                params: {
                  title: roomTitle,
                  userEmail,
                  userName,
                },
              }),
          },
        ]);
      } else {
        Alert.alert('프리미엄 활성화', 'CLACH Premium이 활성화되었습니다.', [
          {
            text: '확인',
            onPress: () =>
              router.replace({
                pathname: '/rooms',
                params: {
                  userEmail,
                  userName,
                },
              }),
          },
        ]);
      }
    } catch (err) {
      Alert.alert('실패', '프리미엄 적용 중 오류가 발생했습니다.');
      console.log(err);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>CLACH PREMIUM</Text>
      <Text style={styles.title}>프리미엄 구독</Text>

      <Text style={styles.subtitle}>
        토론 시간을 늘리고, 더 자세한 AI 분석을 받을 수 있습니다.
      </Text>

      {roomTitle ? (
        <View style={styles.roomCard}>
          <Text style={styles.roomLabel}>연장 대상 토론방</Text>
          <Text style={styles.roomTitle}>{roomTitle}</Text>
          <Text style={styles.roomDesc}>
            {userName}님의 이 토론방 시간만 5분 연장됩니다.
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.planTitle}>Basic</Text>
        <Text style={styles.price}>무료</Text>
        <Text style={styles.desc}>✓ 기본 토론방 참여</Text>
        <Text style={styles.desc}>✓ 기본 채팅 기능</Text>
        <Text style={styles.desc}>✓ 기본 AI 요약</Text>
      </View>

      <View style={styles.premiumCard}>
        <Text style={styles.planTitle}>Premium</Text>
        <Text style={styles.price}>월 4,900원</Text>

        <Text style={styles.desc}>✓ 내 계정의 토론 시간 +5분 연장</Text>
        <Text style={styles.desc}>✓ AI 상세 분석</Text>
        <Text style={styles.desc}>✓ 토론 점수 리포트</Text>
        <Text style={styles.desc}>✓ 프리미엄 랭킹 표시</Text>
        <Text style={styles.desc}>✓ 음성 토론 메모 고급 분석</Text>

        <TouchableOpacity style={styles.payButton} onPress={subscribe}>
          <Text style={styles.payButtonText}>
            {roomTitle ? '+5분 연장하기' : '구독하기'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>안내</Text>
        <Text style={styles.noticeText}>
          현재 결제 기능은 테스트용입니다. 실제 앱스토어 출시 전에는 Apple 인앱결제와 연결해야 합니다.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (roomTitle) {
            router.replace({
              pathname: '/chat',
              params: {
                title: roomTitle,
                userEmail,
                userName,
              },
            });
          } else {
            router.push({
              pathname: '/rooms',
              params: {
                userEmail,
                userName,
              },
            });
          }
        }}
      >
        <Text style={styles.backText}>
          {roomTitle ? '채팅방으로 돌아가기' : '토론방으로 돌아가기'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 70 }} />
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
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  subtitle: {
    color: '#888',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },

  roomCard: {
    backgroundColor: '#101820',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00ff99',
    marginBottom: 18,
  },

  roomLabel: {
    color: '#00ff99',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  roomTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  roomDesc: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 21,
  },

  card: {
    backgroundColor: '#111',
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 18,
  },

  premiumCard: {
    backgroundColor: '#071b13',
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#00ff99',
    marginBottom: 18,
  },

  planTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  price: {
    color: '#00ff99',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  desc: {
    color: '#d5ffe9',
    fontSize: 15,
    marginBottom: 8,
  },

  payButton: {
    backgroundColor: '#00ff99',
    padding: 17,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 18,
  },

  payButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: 'bold',
  },

  noticeCard: {
    backgroundColor: '#1c1605',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffcc00',
    marginBottom: 18,
  },

  noticeTitle: {
    color: '#ffcc00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  noticeText: {
    color: '#fff2b8',
    fontSize: 14,
    lineHeight: 22,
  },

  backButton: {
    backgroundColor: '#171717',
    padding: 17,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },

  backText: {
    color: '#00ff99',
    fontSize: 16,
    fontWeight: 'bold',
  },
});