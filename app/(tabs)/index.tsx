import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>AI DEBATE APP</Text>
      </View>

      <Text style={styles.logo}>CLACH</Text>

      <Text style={styles.title}>
        토론을 기록하고{'\n'}
        AI에게 분석받으세요
      </Text>

      <Text style={styles.subtitle}>
        실시간 토론, 채팅 저장, AI 요약, 조언까지 한 번에 제공하는 토론 플랫폼
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/login')}
      >
        <Text style={styles.buttonText}>시작하기</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.outlineButton}
        onPress={() => router.push('/signup')}
      >
        <Text style={styles.outlineText}>회원가입</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Debate smarter with CLACH
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    padding: 26,
    justifyContent: 'center',
  },

  badge: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#00ff99',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 24,
    backgroundColor: '#071b13',
  },

  badgeText: {
    color: '#00ff99',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },

  logo: {
    color: '#00ff99',
    fontSize: 54,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 18,
  },

  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 45,
    marginBottom: 18,
  },

  subtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 46,
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

  outlineButton: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
  },

  outlineText: {
    color: '#00ff99',
    fontSize: 17,
    fontWeight: 'bold',
  },

  footer: {
    color: '#555',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 13,
  },
});