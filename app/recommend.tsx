import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function RecommendScreen() {
  const params = useLocalSearchParams();

  const userEmail = params.userEmail
    ? String(params.userEmail)
    : 'guest@clach.app';

  const userName = params.userName
    ? String(params.userName)
    : '게스트';

  const rooms = [
    {
      emoji: '🔥',
      title: '정치 토론방',
      desc: '사회 이슈와 정책에 대해 토론합니다.',
    },
    {
      emoji: '💬',
      title: '연애 토론방',
      desc: '연애, 인간관계, 가치관에 대해 이야기합니다.',
    },
    {
      emoji: '⭐',
      title: '자유 토론방',
      desc: '아무 주제나 자유롭게 토론합니다.',
    },
    {
      emoji: '🤖',
      title: 'AI 토론방',
      desc: '인공지능, 기술, 미래 사회에 대해 토론합니다.',
    },
    {
      emoji: '🎓',
      title: '학교 토론방',
      desc: '공부, 학교생활, 진로에 대해 토론합니다.',
    },
    {
      emoji: '⚽',
      title: '스포츠 토론방',
      desc: '축구, 농구, 야구 등 스포츠 주제를 다룹니다.',
    },
  ];

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

  const goRooms = () => {
    router.push({
      pathname: '/rooms',
      params: {
        userEmail,
        userName,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>CLACH RECOMMEND</Text>
      <Text style={styles.title}>추천 토론방</Text>

      <Text style={styles.userText}>{userName}님에게 추천하는 토론방</Text>

      <Text style={styles.subtitle}>
        관심 있는 주제를 선택하고 바로 토론을 시작하세요.
      </Text>

      {rooms.map((room, index) => (
        <TouchableOpacity
          key={index}
          style={styles.card}
          onPress={() => enterRoom(room.title)}
        >
          <Text style={styles.emoji}>{room.emoji}</Text>

          <View style={styles.cardTextBox}>
            <Text style={styles.cardTitle}>{room.title}</Text>
            <Text style={styles.cardDesc}>{room.desc}</Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.button} onPress={goRooms}>
        <Text style={styles.buttonText}>토론방으로 돌아가기</Text>
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
    marginBottom: 28,
  },

  card: {
    backgroundColor: '#111',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  emoji: {
    fontSize: 34,
    marginRight: 14,
  },

  cardTextBox: {
    flex: 1,
  },

  cardTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  cardDesc: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },

  arrow: {
    color: '#00ff99',
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  button: {
    backgroundColor: '#00ff99',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 18,
  },

  buttonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: 'bold',
  },
});