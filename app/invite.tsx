import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function InviteScreen() {
  const params = useLocalSearchParams();

  const userEmail = params.userEmail
    ? String(params.userEmail)
    : 'guest@clach.app';

  const userName = params.userName
    ? String(params.userName)
    : '게스트';

  const inviteCode = 'CLACH-2026';

  const goRooms = () => {
    router.push({
      pathname: '/rooms',
      params: {
        userEmail,
        userName,
      },
    });
  };

  const copyInvite = () => {
    Alert.alert(
      '초대 코드',
      `${userName}님이 친구를 초대합니다.\n\n친구에게 이 코드를 보내세요: ${inviteCode}`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>CLACH INVITE</Text>
      <Text style={styles.title}>친구 초대</Text>

      <Text style={styles.userText}>{userName}님 계정으로 초대 중</Text>

      <Text style={styles.subtitle}>
        친구를 초대해서 같은 토론방에서 실시간으로 의견을 나눠보세요.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>초대 코드</Text>
        <Text style={styles.code}>{inviteCode}</Text>

        <Text style={styles.desc}>
          이 코드를 친구에게 보내면 CLACH 토론에 참여할 수 있습니다.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>초대 계정</Text>
        <Text style={styles.infoText}>이름: {userName}</Text>
        <Text style={styles.infoText}>이메일: {userEmail}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={copyInvite}>
        <Text style={styles.buttonText}>초대 코드 보기</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={goRooms}>
        <Text style={styles.backText}>토론방으로 돌아가기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
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
    fontSize: 38,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  userText: {
    color: '#00ff99',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  subtitle: {
    color: '#888',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 32,
  },

  card: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 18,
  },

  cardTitle: {
    color: '#00ff99',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
  },

  code: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 14,
  },

  desc: {
    color: '#aaa',
    fontSize: 15,
    lineHeight: 23,
  },

  infoCard: {
    backgroundColor: '#071b13',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#00ff99',
    marginBottom: 18,
  },

  infoTitle: {
    color: '#00ff99',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  infoText: {
    color: '#d5ffe9',
    fontSize: 15,
    marginBottom: 8,
  },

  button: {
    backgroundColor: '#00ff99',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 14,
  },

  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },

  backButton: {
    backgroundColor: '#171717',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },

  backText: {
    color: '#00ff99',
    fontSize: 17,
    fontWeight: 'bold',
  },
});