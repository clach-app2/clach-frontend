import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

const SERVER_URL = 'http://172.30.1.39:3000';

export default function ModeratorScreen() {
  const params = useLocalSearchParams();

  const roomTitle = params.room ? String(params.room) : '전체 토론';

  const userEmail = params.userEmail
    ? String(params.userEmail)
    : 'guest@clach.app';

  const userName = params.userName
    ? String(params.userName)
    : '게스트';

  const [messages, setMessages] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState('AI 중재자가 토론을 분석하고 있습니다...');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await fetch(
        `${SERVER_URL}/messages/${encodeURIComponent(roomTitle)}`
      );

      const data = await response.json();
      const list = data.messages || [];

      setMessages(list);
      makeModeratorAnalysis(list);
    } catch (err) {
      console.log('중재자 메시지 불러오기 실패:', err);
      setAnalysis('토론 내용을 불러오지 못했습니다.');
    }
  };

  const makeModeratorAnalysis = (list: any[]) => {
    if (list.length === 0) {
      setAnalysis(
        '아직 이 토론방에는 분석할 메시지가 없습니다.\n\n먼저 서로의 의견을 남긴 뒤 AI 중재자를 다시 확인해주세요.'
      );
      return;
    }

    const text = list.map((msg) => msg.text || '').join(' ');
    const messageCount = list.length;

    const hasStrongWords =
      text.includes('멍청') ||
      text.includes('바보') ||
      text.includes('꺼져') ||
      text.includes('닥쳐') ||
      text.includes('노답') ||
      text.includes('개소리');

    const hasReasonWords =
      text.includes('왜냐하면') ||
      text.includes('근거') ||
      text.includes('예를 들어') ||
      text.includes('자료') ||
      text.includes('통계') ||
      text.includes('이유');

    const hasQuestion =
      text.includes('?') ||
      text.includes('왜') ||
      text.includes('어떻게') ||
      text.includes('근거가 뭐');

    let result = '';

    result += `AI 중재자 분석\n\n`;
    result += `분석 대상 토론방: ${roomTitle}\n`;
    result += `분석 메시지 수: ${messageCount}개\n\n`;

    result += `1. 현재 토론 상태\n`;

    if (messageCount <= 2) {
      result += `아직 토론 초반입니다. 서로의 입장을 더 충분히 말할 필요가 있습니다.\n\n`;
    } else if (messageCount <= 6) {
      result += `토론이 시작되어 의견이 오가고 있습니다. 이제 주장만 말하기보다 이유와 근거를 붙이면 좋습니다.\n\n`;
    } else {
      result += `어느 정도 토론이 진행되었습니다. 지금부터는 핵심 쟁점을 정리하고, 서로의 주장 차이를 비교하는 단계가 좋습니다.\n\n`;
    }

    result += `2. 토론 태도 점검\n`;

    if (hasStrongWords) {
      result += `감정적인 표현이나 상대를 공격하는 표현이 감지되었습니다. 토론에서는 사람을 공격하지 말고 주장과 근거를 비판해야 합니다.\n\n`;
    } else {
      result += `현재까지는 큰 인신공격 표현 없이 토론이 진행되고 있습니다. 이 흐름을 유지하면 좋습니다.\n\n`;
    }

    result += `3. 근거 사용 점검\n`;

    if (hasReasonWords) {
      result += `이유, 근거, 예시를 사용하려는 흐름이 보입니다. 좋은 토론 방향입니다.\n\n`;
    } else {
      result += `아직 근거 표현이 부족합니다. “왜냐하면”, “예를 들어”, “자료에 따르면” 같은 방식으로 주장을 보강하면 좋습니다.\n\n`;
    }

    result += `4. 질문과 반박\n`;

    if (hasQuestion) {
      result += `상대에게 질문하는 흐름이 있습니다. 질문은 좋은 토론 방식입니다. 다만 비꼬는 질문보다 확인하는 질문이 더 좋습니다.\n\n`;
    } else {
      result += `상대 주장에 질문이 부족합니다. “그 근거는 무엇인가요?”, “그 예시는 어떤 상황인가요?”처럼 질문하면 토론이 깊어집니다.\n\n`;
    }

    result += `5. AI 중재자 권장 발언\n`;
    result += `- “상대 의견의 핵심은 이해했습니다. 다만 제 생각은 다릅니다.”\n`;
    result += `- “그 주장에 대한 근거를 조금 더 설명해줄 수 있나요?”\n`;
    result += `- “사람이 아니라 주장 자체에 대해 반박해보겠습니다.”\n`;
    result += `- “우리가 지금 다투는 핵심 쟁점은 무엇인지 정리해봅시다.”\n\n`;

    result += `6. 다음 토론 방향\n`;
    result += `지금부터는 각자 주장 1개, 근거 1개, 예시 1개씩 말하는 방식으로 진행하면 더 공정하고 설득력 있는 토론이 됩니다.`;

    setAnalysis(result);
  };

  const goChat = () => {
    if (roomTitle === '전체 토론') {
      goRooms();
      return;
    }

    router.push({
      pathname: '/chat',
      params: {
        title: roomTitle,
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

  const goSummary = () => {
    router.push({
      pathname: '/summary',
      params: {
        room: roomTitle,
        userEmail,
        userName,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>CLACH AI MODERATOR</Text>
      <Text style={styles.title}>AI 중재자</Text>

      <Text style={styles.roomText}>중재 대상: {roomTitle}</Text>
      <Text style={styles.userText}>{userName}님 토론 중재 화면</Text>

      <Text style={styles.subtitle}>
        AI 중재자는 토론 원칙에 맞게 발언 태도, 근거 사용, 논점 흐름을 점검합니다.
      </Text>

      <View style={styles.rulesCard}>
        <Text style={styles.rulesTitle}>토론 원칙</Text>
        <Text style={styles.rule}>1. 사람을 공격하지 말고 주장을 비판하기</Text>
        <Text style={styles.rule}>2. 주장에는 이유와 근거 붙이기</Text>
        <Text style={styles.rule}>3. 상대 말을 끊지 않고 핵심을 이해하기</Text>
        <Text style={styles.rule}>4. 감정 표현보다 논리와 예시 사용하기</Text>
        <Text style={styles.rule}>5. 결론보다 쟁점을 먼저 정리하기</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>중재 분석 결과</Text>
        <Text style={styles.analysis}>{analysis}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={goChat}>
        <Text style={styles.buttonText}>
          {roomTitle === '전체 토론' ? '토론방으로 돌아가기' : '채팅방으로 돌아가기'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.outlineButton} onPress={goSummary}>
        <Text style={styles.outlineText}>AI 요약 보기</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.outlineButton} onPress={goRooms}>
        <Text style={styles.outlineText}>토론방 목록으로 이동</Text>
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

  roomText: {
    color: '#00ff99',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  userText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  subtitle: {
    color: '#888',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
  },

  rulesCard: {
    backgroundColor: '#071b13',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00ff99',
    marginBottom: 18,
  },

  rulesTitle: {
    color: '#00ff99',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 14,
  },

  rule: {
    color: '#d5ffe9',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 6,
  },

  card: {
    backgroundColor: '#111',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 18,
  },

  cardTitle: {
    color: '#00ff99',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 18,
  },

  analysis: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 27,
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
    fontSize: 17,
    fontWeight: 'bold',
  },

  outlineButton: {
    backgroundColor: '#171717',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 14,
  },

  outlineText: {
    color: '#00ff99',
    fontSize: 17,
    fontWeight: 'bold',
  },
});