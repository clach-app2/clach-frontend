import { useState } from 'react';
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
import { SERVER_URL } from '../constants/config';

export default function VoiceScreen() {
  const params = useLocalSearchParams();

  const room = params.room ? String(params.room) : '전체 토론';

  const userEmail = params.userEmail
    ? String(params.userEmail)
    : 'guest@clach.app';

  const userName = params.userName
    ? String(params.userName)
    : '게스트';

  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  const saveVoiceMemo = async () => {
    if (saving) return;

    if (!memo.trim()) {
      Alert.alert('내용 필요', '음성 토론 메모 내용을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${SERVER_URL}/voice-memo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room,
          text: memo.trim(),
          userEmail,
          userName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('저장 실패', data.message || '음성 메모 저장에 실패했습니다.');
        return;
      }

      Alert.alert('저장 완료', data.message || '음성 토론 메모가 저장되었습니다.');
      setMemo('');
    } catch (err) {
      console.log('음성 메모 저장 실패:', err);
      Alert.alert(
        '서버 연결 실패',
        '백엔드 서버가 켜져 있는지, constants/config.ts의 SERVER_URL 주소가 맞는지 확인해주세요.'
      );
    } finally {
      setSaving(false);
    }
  };

  const goChat = () => {
    router.push({
      pathname: '/chat',
      params: {
        title: room,
        userEmail,
        userName,
      },
    });
  };

  const goSummary = () => {
    router.push({
      pathname: '/summary',
      params: {
        room,
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
      <Text style={styles.label}>CLACH VOICE</Text>
      <Text style={styles.title}>음성 토론</Text>

      <Text style={styles.userText}>{userName}님 계정</Text>
      <Text style={styles.emailText}>{userEmail}</Text>

      <View style={styles.serverCard}>
        <Text style={styles.serverTitle}>서버 연결 주소</Text>
        <Text style={styles.serverText}>{SERVER_URL}</Text>
        <Text style={styles.serverDesc}>
          서버 주소는 constants/config.ts에서 관리됩니다.
        </Text>
      </View>

      <View style={styles.roomCard}>
        <Text style={styles.roomLabel}>현재 토론방</Text>
        <Text style={styles.roomTitle}>{room}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>음성 토론 메모</Text>
        <Text style={styles.infoText}>
          실제 음성 녹음 기능을 붙이기 전 단계에서는 음성으로 말한 내용을 글로 적어 저장합니다.
          저장된 메모는 AI 요약에 함께 반영됩니다.
        </Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputTitle}>메모 내용</Text>

        <TextInput
          style={styles.textArea}
          placeholder="예: 찬성 측은 AI가 학습 효율을 높인다고 주장했고, 반대 측은 의존성이 커질 수 있다고 말했습니다."
          placeholderTextColor="#777"
          value={memo}
          onChangeText={setMemo}
          multiline
          textAlignVertical="top"
          editable={!saving}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, saving && styles.disabledButton]}
        onPress={saveVoiceMemo}
        disabled={saving}
      >
        {saving ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#000" />
            <Text style={styles.buttonText}>저장 중...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>음성 메모 저장하기</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.goldButton} onPress={goSummary}>
        <Text style={styles.goldButtonText}>AI 요약 보기</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.outlineButton} onPress={goChat}>
        <Text style={styles.outlineText}>채팅방으로 돌아가기</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.outlineButton} onPress={goRooms}>
        <Text style={styles.outlineText}>토론방 목록</Text>
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
    marginBottom: 8,
  },

  userText: {
    color: '#00ff99',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  emailText: {
    color: '#888',
    fontSize: 13,
    marginBottom: 20,
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

  roomCard: {
    backgroundColor: '#071b13',
    borderRadius: 22,
    padding: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
  },

  infoCard: {
    backgroundColor: '#111',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 18,
  },

  infoTitle: {
    color: '#00ff99',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  infoText: {
    color: '#aaa',
    fontSize: 15,
    lineHeight: 24,
  },

  inputCard: {
    backgroundColor: '#111',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 18,
  },

  inputTitle: {
    color: '#00ff99',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 14,
  },

  textArea: {
    backgroundColor: '#050505',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 220,
    lineHeight: 24,
  },

  button: {
    backgroundColor: '#00ff99',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 14,
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

  goldButton: {
    backgroundColor: '#1c1605',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffcc00',
    marginBottom: 14,
  },

  goldButtonText: {
    color: '#ffcc00',
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