import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../constants/config';

type Message = {
  id?: string;
  _id?: string;
  room?: string;
  user: string;
  userEmail?: string;
  text: string;
  scoreAdded?: number;
  createdAt?: string;
};

export default function ChatScreen() {
  const params = useLocalSearchParams();

  const roomTitle = params.title ? String(params.title) : '실시간 토론방';

  const userEmail = params.userEmail
    ? String(params.userEmail)
    : 'guest@clach.app';

  const userName = params.userName
    ? String(params.userName)
    : '게스트';

  const scrollRef = useRef<ScrollView | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<any>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  const [remaining, setRemaining] = useState(600);
  const [ended, setEnded] = useState(false);

  const [position, setPosition] = useState('');
  const [activePanel, setActivePanel] = useState<'info' | 'menu' | null>(null);

  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [isSuspended, setIsSuspended] = useState(false);
  const [remainingText, setRemainingText] = useState('');
  const [badWordCount, setBadWordCount] = useState(0);

  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    loadBlockedUsers();
    getModerationStatus();
    getTimer();
    getMessages();
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (ended) return;

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = Math.max(0, prev - 1);

        saveTimer(next, next <= 0);

        if (next <= 0) {
          setEnded(true);
        }

        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [ended]);

  useEffect(() => {
    if (messages.length === 0) return;

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const connectSocket = () => {
    const socket = io(SERVER_URL);

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('소켓 연결 성공:', socket.id);
    });

    socket.on('receive_message', (data: Message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...data,
          id: data.id || Date.now().toString(),
        },
      ]);
    });

    socket.on('message_blocked', (data: any) => {
      Alert.alert('메시지 차단', data.message || '메시지가 차단되었습니다.');
      setBadWordCount(data.badWordCount || 0);
    });

    socket.on('account_suspended', (data: any) => {
      setIsSuspended(true);
      setRemainingText(data.remainingText || '');
      Alert.alert('계정 정지', data.message || '현재 계정이 정지되었습니다.');
    });

    socket.on('disconnect', () => {
      console.log('소켓 연결 해제');
    });
  };

  const getMessages = async () => {
    try {
      const response = await fetch(
        `${SERVER_URL}/messages/${encodeURIComponent(roomTitle)}`
      );

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.log('메시지 불러오기 실패:', err);
    }
  };

  const getTimer = async () => {
    try {
      const response = await fetch(
        `${SERVER_URL}/timer/${encodeURIComponent(
          roomTitle
        )}?userEmail=${encodeURIComponent(userEmail)}`
      );

      const data = await response.json();

      setRemaining(data.remaining ?? 600);
      setEnded(Boolean(data.ended));
    } catch (err) {
      console.log('타이머 불러오기 실패:', err);
    }
  };

  const saveTimer = async (nextRemaining: number, nextEnded: boolean) => {
    try {
      await fetch(`${SERVER_URL}/timer/${encodeURIComponent(roomTitle)}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          remaining: nextRemaining,
          ended: nextEnded,
        }),
      });
    } catch (err) {
      console.log('타이머 저장 실패:', err);
    }
  };

  const extendTimer = async () => {
    try {
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

      if (!response.ok) {
        Alert.alert('연장 실패', data.message || '시간 연장에 실패했습니다.');
        return;
      }

      setRemaining(data.remaining || remaining + 300);
      setEnded(false);

      Alert.alert('연장 완료', '토론 시간이 5분 연장되었습니다.');
    } catch (err) {
      console.log('시간 연장 실패:', err);
      Alert.alert('서버 연결 실패', '백엔드 서버 연결을 확인해주세요.');
    }
  };

  const resetTimer = async () => {
    Alert.alert('시간 초기화', '내 토론 시간을 10분으로 초기화할까요?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '초기화',
        onPress: async () => {
          try {
            const response = await fetch(
              `${SERVER_URL}/timer/${encodeURIComponent(roomTitle)}/reset`,
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

            setRemaining(data.remaining || 600);
            setEnded(false);
          } catch (err) {
            console.log('타이머 초기화 실패:', err);
          }
        },
      },
    ]);
  };

  const getModerationStatus = async () => {
    try {
      const response = await fetch(
        `${SERVER_URL}/moderation/status?userEmail=${encodeURIComponent(
          userEmail
        )}`
      );

      const data = await response.json();

      setIsSuspended(Boolean(data.suspended));
      setRemainingText(data.remainingText || '');
      setBadWordCount(data.badWordCount || 0);
    } catch (err) {
      console.log('제재 상태 확인 실패:', err);
    }
  };

  const sendMessage = () => {
    if (!text.trim()) return;

    if (ended || remaining <= 0) {
      Alert.alert('시간 종료', '토론 시간이 종료되었습니다. 5분 연장을 눌러주세요.');
      return;
    }

    if (isSuspended) {
      Alert.alert(
        '계정 정지',
        `현재 채팅이 제한되어 있습니다. 남은 시간: ${
          remainingText || '확인 중'
        }`
      );
      return;
    }

    if (!socketRef.current) {
      Alert.alert('연결 실패', '소켓 서버에 연결되어 있지 않습니다.');
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      room: roomTitle,
      user: userName,
      userEmail,
      text: text.trim(),
      scoreAdded: 0,
    };

    socketRef.current.emit('send_message', message);
    setText('');
  };

  const reportMessage = async (message: Message) => {
    setOpenActionId(null);

    if (!message.userEmail || message.userEmail === userEmail) {
      Alert.alert('신고 불가', '내 메시지 또는 이메일이 없는 메시지는 신고할 수 없습니다.');
      return;
    }

    Alert.alert('메시지 신고', '이 메시지를 신고할까요?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '신고',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${SERVER_URL}/reports`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                room: roomTitle,
                reporterName: userName,
                reporterEmail: userEmail,
                reportedUser: message.user,
                reportedUserEmail: message.userEmail,
                messageText: message.text,
                reason: '부적절한 표현 또는 인신공격 의심',
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              Alert.alert('신고 실패', data.message || '신고 접수에 실패했습니다.');
              return;
            }

            Alert.alert('신고 완료', '신고가 접수되었습니다.');
          } catch (err) {
            console.log('신고 실패:', err);
            Alert.alert('서버 연결 실패', '신고 접수에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const getBlockKey = () => {
    return `blocked_users_${userEmail}`;
  };

  const loadBlockedUsers = async () => {
    try {
      const saved = await AsyncStorage.getItem(getBlockKey());
      const list = saved ? JSON.parse(saved) : [];

      setBlockedUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.log('차단 목록 불러오기 실패:', err);
    }
  };

  const blockUser = async (message: Message) => {
    setOpenActionId(null);

    if (!message.userEmail || message.userEmail === userEmail) {
      Alert.alert('차단 불가', '내 메시지 또는 이메일이 없는 사용자는 차단할 수 없습니다.');
      return;
    }

    Alert.alert('사용자 차단', `${message.user} 사용자를 차단할까요?`, [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '차단',
        style: 'destructive',
        onPress: async () => {
          const next = Array.from(new Set([...blockedUsers, message.userEmail!]));

          setBlockedUsers(next);
          await AsyncStorage.setItem(getBlockKey(), JSON.stringify(next));

          Alert.alert('차단 완료', '이 사용자의 메시지가 내 화면에서 숨겨집니다.');
        },
      },
    ]);
  };

  const choosePosition = (nextPosition: string) => {
    setPosition(nextPosition);
    setActivePanel(null);

    const aiMessage: Message = {
      id: Date.now().toString(),
      room: roomTitle,
      user: 'AI 중재자',
      userEmail: 'ai@clach.app',
      text: `${userName}님이 "${nextPosition}" 입장을 선택했습니다. 주장에는 이유와 근거를 함께 말해보세요.`,
      scoreAdded: 0,
    };

    setMessages((prev) => [...prev, aiMessage]);
  };

  const togglePanel = (panel: 'info' | 'menu') => {
    setOpenActionId(null);
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const toggleMessageAction = (message: Message, index: number) => {
    const key = message._id || message.id || String(index);

    setActivePanel(null);
    setOpenActionId((prev) => (prev === key ? null : key));
  };

  const goVoice = () => {
    setActivePanel(null);

    router.push({
      pathname: '/voice',
      params: {
        room: roomTitle,
        userEmail,
        userName,
      },
    });
  };

  const goSummary = () => {
    setActivePanel(null);

    router.push({
      pathname: '/summary',
      params: {
        room: roomTitle,
        userEmail,
        userName,
      },
    });
  };

  const goRooms = () => {
    setActivePanel(null);

    router.push({
      pathname: '/rooms',
      params: {
        userEmail,
        userName,
      },
    });
  };

  const goSettings = () => {
    setActivePanel(null);

    router.push({
      pathname: '/settings',
      params: {
        userEmail,
        userName,
      },
    });
  };

  const formatTime = (seconds: number) => {
    const safe = Math.max(0, seconds);
    const min = Math.floor(safe / 60);
    const sec = safe % 60;

    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const visibleMessages = messages.filter((message) => {
    if (!message.userEmail) return true;
    return !blockedUsers.includes(message.userEmail);
  });

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
    >
      <View style={styles.container}>
        <View style={styles.topTimerCard}>
          <View>
            <Text style={styles.timerLabel}>남은 시간</Text>
            <Text style={styles.timerText}>{formatTime(remaining)}</Text>
          </View>

          <View style={styles.timerButtonArea}>
            <TouchableOpacity style={styles.extendButton} onPress={extendTimer}>
              <Text style={styles.extendText}>+5분 연장</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
              <Text style={styles.resetText}>초기화</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.quickBar}>
          <TouchableOpacity
            style={[
              styles.quickButton,
              activePanel === 'info' && styles.activeQuickButton,
            ]}
            onPress={() => togglePanel('info')}
          >
            <Text
              style={[
                styles.quickText,
                activePanel === 'info' && styles.activeQuickText,
              ]}
            >
              토론 정보
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickButton,
              activePanel === 'menu' && styles.activeQuickButton,
            ]}
            onPress={() => togglePanel('menu')}
          >
            <Text
              style={[
                styles.quickText,
                activePanel === 'menu' && styles.activeQuickText,
              ]}
            >
              기능 메뉴
            </Text>
          </TouchableOpacity>
        </View>

        {activePanel === 'info' && (
          <View style={styles.fixedPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>토론 정보</Text>

              <TouchableOpacity onPress={() => setActivePanel(null)}>
                <Text style={styles.panelClose}>닫기</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.panelSubTitle}>내 입장 선택</Text>

            <View style={styles.positionRow}>
              {['찬성', '반대', '중립'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.positionButton,
                    position === item && styles.activePositionButton,
                  ]}
                  onPress={() => choosePosition(item)}
                >
                  <Text
                    style={[
                      styles.positionText,
                      position === item && styles.activePositionText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.positionGuide}>
              현재 내 입장: {position || '아직 선택하지 않음'}
            </Text>

            <Text style={styles.infoDesc}>
              “왜냐하면”, “근거”, “예를 들어” 같은 표현을 넣으면 더 좋은 토론이 됩니다.
            </Text>
          </View>
        )}

        {activePanel === 'menu' && (
          <View style={styles.fixedPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>기능 메뉴</Text>

              <TouchableOpacity onPress={() => setActivePanel(null)}>
                <Text style={styles.panelClose}>닫기</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.menuButton} onPress={goVoice}>
              <Text style={styles.menuText}>음성 토론</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={goSummary}>
              <Text style={styles.menuText}>AI 요약 보기</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={goRooms}>
              <Text style={styles.menuText}>토론방 목록</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={goSettings}>
              <Text style={styles.menuText}>설정</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>CLACH DEBATE</Text>
          <Text style={styles.title}>{roomTitle}</Text>

          <Text style={styles.userText}>{userName}님</Text>
          <Text style={styles.emailText}>{userEmail}</Text>

          {isSuspended && (
            <View style={styles.suspendedCard}>
              <Text style={styles.suspendedTitle}>계정 정지 중</Text>
              <Text style={styles.suspendedText}>
                남은 시간: {remainingText || '확인 중'}
              </Text>
            </View>
          )}

          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>토론 원칙</Text>
            <Text style={styles.warningText}>
              욕설 또는 인신공격은 차단됩니다. 경고 3회 누적 시 1시간 정지되고,
              반복 시 정지 시간이 2배씩 증가합니다.
            </Text>
            <Text style={styles.warningSubText}>현재 경고: {badWordCount}/3회</Text>
          </View>

          <View style={styles.messageArea}>
            {visibleMessages.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>아직 메시지가 없습니다</Text>
                <Text style={styles.emptyText}>
                  첫 의견을 작성해서 토론을 시작해보세요.
                </Text>
              </View>
            ) : (
              visibleMessages.map((message, index) => {
                const isMe = message.userEmail === userEmail;
                const isAI = message.userEmail === 'ai@clach.app';
                const actionKey = message._id || message.id || String(index);
                const actionOpen = openActionId === actionKey;

                return (
                  <View
                    key={actionKey}
                    style={[
                      styles.messageCard,
                      isMe && styles.myMessageCard,
                      isAI && styles.aiMessageCard,
                    ]}
                  >
                    <View style={styles.messageTopRow}>
                      <View style={styles.nameArea}>
                        <Text
                          style={[
                            styles.messageUser,
                            isMe && styles.myMessageUser,
                            isAI && styles.aiMessageUser,
                          ]}
                        >
                          {message.user}
                        </Text>

                        {!isMe && !isAI && (
                          <TouchableOpacity
                            style={styles.moreButton}
                            onPress={() => toggleMessageAction(message, index)}
                          >
                            <Text style={styles.moreText}>⋯</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {message.scoreAdded ? (
                        <Text style={styles.scoreText}>
                          +{message.scoreAdded}점
                        </Text>
                      ) : null}
                    </View>

                    {actionOpen && !isMe && !isAI && (
                      <View style={styles.actionMenu}>
                        <TouchableOpacity
                          style={styles.reportButton}
                          onPress={() => reportMessage(message)}
                        >
                          <Text style={styles.reportText}>신고</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.blockButton}
                          onPress={() => blockUser(message)}
                        >
                          <Text style={styles.blockText}>차단</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <Text style={styles.messageText}>{message.text}</Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        <View
          style={[
            styles.inputArea,
            keyboardHeight > 0 && styles.inputAreaKeyboardOpen,
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder={
              ended
                ? '토론 시간이 종료되었습니다'
                : isSuspended
                ? '계정 정지 중입니다'
                : '메시지를 입력하세요'
            }
            placeholderTextColor="#777"
            value={text}
            onChangeText={setText}
            editable={!ended && !isSuspended}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (ended || isSuspended) && styles.disabledSendButton,
            ]}
            onPress={sendMessage}
            disabled={ended || isSuspended}
          >
            <Text style={styles.sendText}>전송</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#050505',
  },

  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  topTimerCard: {
    backgroundColor: '#071b13',
    borderBottomWidth: 1,
    borderColor: '#00ff99',
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  timerLabel: {
    color: '#00ff99',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  timerText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },

  timerButtonArea: {
    flexDirection: 'row',
    gap: 8,
  },

  extendButton: {
    backgroundColor: '#00ff99',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },

  extendText: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },

  resetButton: {
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
  },

  resetText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: 'bold',
  },

  quickBar: {
    backgroundColor: '#050505',
    borderBottomWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 10,
  },

  quickButton: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },

  activeQuickButton: {
    backgroundColor: '#00ff99',
    borderColor: '#00ff99',
  },

  quickText: {
    color: '#00ff99',
    fontSize: 15,
    fontWeight: 'bold',
  },

  activeQuickText: {
    color: '#000',
  },

  fixedPanel: {
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderColor: '#333',
    padding: 16,
  },

  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  panelTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
  },

  panelClose: {
    color: '#00ff99',
    fontSize: 14,
    fontWeight: 'bold',
  },

  panelSubTitle: {
    color: '#00ff99',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  positionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },

  positionButton: {
    flex: 1,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#333',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  activePositionButton: {
    backgroundColor: '#00ff99',
    borderColor: '#00ff99',
  },

  positionText: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: 'bold',
  },

  activePositionText: {
    color: '#000',
  },

  positionGuide: {
    color: '#00ff99',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  infoDesc: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 20,
  },

  menuButton: {
    backgroundColor: '#171717',
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 10,
    alignItems: 'center',
  },

  menuText: {
    color: '#00ff99',
    fontSize: 15,
    fontWeight: 'bold',
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingTop: 22,
    paddingBottom: 30,
  },

  label: {
    color: '#00ff99',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  userText: {
    color: '#00ff99',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  emailText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 16,
  },

  suspendedCard: {
    backgroundColor: '#221111',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ff4444',
    marginBottom: 14,
  },

  suspendedTitle: {
    color: '#ff5555',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  suspendedText: {
    color: '#ffd1d1',
    fontSize: 14,
    fontWeight: 'bold',
  },

  warningCard: {
    backgroundColor: '#1c1605',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffcc00',
    marginBottom: 14,
  },

  warningTitle: {
    color: '#ffcc00',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  warningText: {
    color: '#fff2b8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },

  warningSubText: {
    color: '#ffcc00',
    fontSize: 13,
    fontWeight: 'bold',
  },

  messageArea: {
    marginBottom: 20,
  },

  emptyCard: {
    backgroundColor: '#111',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#222',
  },

  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  emptyText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 21,
  },

  messageCard: {
    backgroundColor: '#111',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 12,
  },

  myMessageCard: {
    backgroundColor: '#071b13',
    borderColor: '#00ff99',
  },

  aiMessageCard: {
    backgroundColor: '#1c1605',
    borderColor: '#ffcc00',
  },

  messageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  nameArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  messageUser: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  myMessageUser: {
    color: '#00ff99',
  },

  aiMessageUser: {
    color: '#ffcc00',
  },

  moreButton: {
    marginLeft: 8,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#333',
    width: 30,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  moreText: {
    color: '#aaa',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -4,
  },

  scoreText: {
    color: '#00ff99',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  actionMenu: {
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },

  reportButton: {
    flex: 1,
    backgroundColor: '#221111',
    borderWidth: 1,
    borderColor: '#ff4444',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },

  reportText: {
    color: '#ff7777',
    fontSize: 13,
    fontWeight: 'bold',
  },

  blockButton: {
    flex: 1,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#444',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },

  blockText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: 'bold',
  },

  messageText: {
    color: '#eee',
    fontSize: 15,
    lineHeight: 23,
  },

  inputArea: {
    backgroundColor: '#050505',
    borderTopWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 18 : 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
  },

  inputAreaKeyboardOpen: {
    paddingBottom: 8,
  },

  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 90,
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 21,
  },

  sendButton: {
    backgroundColor: '#00ff99',
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },

  disabledSendButton: {
    backgroundColor: '#333',
  },

  sendText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },
});