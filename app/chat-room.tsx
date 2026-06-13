import React, { useEffect, useMemo, useRef, useState } from 'react';
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

type Message = {
  _id?: string;
  id?: string;
  userName?: string;
  userEmail?: string;
  side?: string;
  text?: string;
  message?: string;
  createdAt?: string;
};

type Participant = {
  name?: string;
  nickname?: string;
  email?: string;
  joinedAt?: string;
};

type Room = {
  _id?: string;
  title?: string;
  topic?: string;
  roomType?: string;
  timeLimit?: number;
  maxParticipants?: number;
  participants?: Participant[];
  status?: string;
  endVotes?: unknown[];
  createdAt?: string;
  startedAt?: string;
  endsAt?: string;
  expiresAt?: string;
};

type AiUsage = {
  type: 'summary' | 'moderator';
  used: number;
  limit: number;
  remaining: number;
  isPremium: boolean;
  date: string;
};

export default function ChatRoomScreen() {
  const params = useLocalSearchParams<{
    roomId?: string;
    roomTitle?: string;
  }>();

  const roomId = params.roomId || '';
  const initialRoomTitle = params.roomTitle || '토론방';

  const scrollRef = useRef<ScrollView>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [roomTitle, setRoomTitle] = useState(initialRoomTitle);
  const [topic, setTopic] = useState('');

  const [myName, setMyName] = useState('토론가');
  const [myEmail, setMyEmail] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  const [side, setSide] = useState<'찬성' | '반대' | '중립'>('중립');

  const [messages, setMessages] = useState<Message[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');

  const [showParticipants, setShowParticipants] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const [loadingRoom, setLoadingRoom] = useState(false);
  const [sending, setSending] = useState(false);
  const [votingEnd, setVotingEnd] = useState(false);
  const [extending, setExtending] = useState(false);
  const [askingAi, setAskingAi] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeEnded, setTimeEnded] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');

  const [moderatorUsage, setModeratorUsage] =
  useState<AiUsage | null>(null);
  
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

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const getParticipantName = (participant: Participant) => {
    return participant.name || participant.nickname || participant.email || '참여자';
  };

  const getInitial = (name: string) => {
    return name.trim().slice(0, 1) || '토';
  };

  const getMessageText = (item: Message) => {
    return item.text || item.message || '';
  };

  const getBlockKey = (item: Message) => {
    return item.userEmail || item.userName || '';
  };

  const getRoomEndTime = (targetRoom: Room | null) => {
    if (!targetRoom) return 0;

    if (targetRoom.endsAt) {
      return new Date(targetRoom.endsAt).getTime();
    }

    const baseTime = targetRoom.startedAt || targetRoom.createdAt;

    if (!baseTime) return 0;

    const startedAt = new Date(baseTime).getTime();
    const limitMs = Number(targetRoom.timeLimit || 30) * 60 * 1000;

    return startedAt + limitMs;
  };

  const calculateSecondsLeft = (targetRoom: Room | null) => {
    const endTime = getRoomEndTime(targetRoom);

    if (!endTime) return 0;

    return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  };

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const min = Math.floor(safeSeconds / 60);
    const sec = safeSeconds % 60;

    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const getTimePercent = () => {
    const totalSeconds = Number(room?.timeLimit || 30) * 60;

    if (!totalSeconds) return 0;

    return Math.max(0, Math.min(100, Math.round((secondsLeft / totalSeconds) * 100)));
  };

  const participants = useMemo(() => {
    return Array.isArray(room?.participants) ? room?.participants || [] : [];
  }, [room]);

  const filteredMessages = useMemo(() => {
    return messages.filter((item) => {
      const key = getBlockKey(item);

      if (!key) return true;

      return !blockedUsers.includes(key);
    });
  }, [messages, blockedUsers]);

  const participantCount = participants.length;
  const maxParticipants = room?.maxParticipants || 6;
  const voteCount = room?.endVotes?.length || 0;
  const requiredVotes = Math.floor(Math.max(1, participantCount) / 2) + 1;
  const roomEnded = room?.status === 'ended' || timeEnded;

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('clach_user');
      const premiumValue = await AsyncStorage.getItem('clach_premium');
      const savedBlockedUsers = await AsyncStorage.getItem('clach_blocked_users');

      if (savedBlockedUsers) {
        setBlockedUsers(JSON.parse(savedBlockedUsers));
      }

      if (savedUser) {
        const user = JSON.parse(savedUser);

        setMyName(user.name || user.nickname || '토론가');
        setMyEmail(user.email || '');
        setIsPremium(user.isPremium === true || premiumValue === 'true');
      } else {
        setIsPremium(premiumValue === 'true');
      }
    } catch {
      console.log('사용자 정보 불러오기 실패');
    }
  };

const saveReturnedUser = async (returnedUser: any) => {
  if (!returnedUser || typeof returnedUser !== 'object') {
    return;
  }

  try {
    const savedUser = await AsyncStorage.getItem('clach_user');
    const currentUser = savedUser ? JSON.parse(savedUser) : {};

    const nextUser = {
      ...currentUser,
      ...returnedUser,
    };

    await AsyncStorage.setItem(
      'clach_user',
      JSON.stringify(nextUser)
    );

    setIsPremium(nextUser.isPremium === true);
  } catch {
    console.log('AI 사용량 사용자 정보 저장 실패');
  }
};

  const loadRoom = async () => {
    if (!roomId) {
      setMessage('토론방 ID가 없습니다.');
      return;
    }

    try {
      setLoadingRoom(true);
      setMessage('');

      const baseUrl = getBaseUrl();

      const urls = [
        `${baseUrl}/api/rooms/${roomId}`,
        `${baseUrl}/rooms/${roomId}`,
        `${baseUrl}/api/room/${roomId}`,
        `${baseUrl}/room/${roomId}`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url);
          const data = await safeJson(res);

          if (res.ok) {
            const nextRoom: Room = data?.room || data?.data || data;

            setRoom(nextRoom);
            setRoomTitle(nextRoom.title || initialRoomTitle);
            setTopic(nextRoom.topic || '');

            const nextSecondsLeft = calculateSecondsLeft(nextRoom);
            setSecondsLeft(nextSecondsLeft);
            setTimeEnded(nextRoom.status === 'ended' || nextSecondsLeft <= 0);

            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }

      setMessage('토론방 정보를 불러오지 못했어요.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoadingRoom(false);
    }
  };

  const joinRoom = async () => {
    if (!roomId) return;

    try {
      const baseUrl = getBaseUrl();

      const bodyData = {
        name: myName,
        nickname: myName,
        email: myEmail,
        userEmail: myEmail,
      };

      const urls = [
        `${baseUrl}/api/rooms/${roomId}/join`,
        `${baseUrl}/rooms/${roomId}/join`,
        `${baseUrl}/api/room/${roomId}/join`,
        `${baseUrl}/room/${roomId}/join`,
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
            const nextRoom = data?.room || data?.data;

            if (nextRoom) {
              setRoom(nextRoom);

              const nextSecondsLeft = calculateSecondsLeft(nextRoom);
              setSecondsLeft(nextSecondsLeft);
              setTimeEnded(nextRoom.status === 'ended' || nextSecondsLeft <= 0);
            }

            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }
    } catch {
      setMessage('토론방 입장 처리 중 오류가 발생했습니다.');
    }
  };

  const loadMessages = async () => {
    if (!roomId) return;

    try {
      const baseUrl = getBaseUrl();

      const urls = [
        `${baseUrl}/api/messages/${roomId}`,
        `${baseUrl}/messages/${roomId}`,
        `${baseUrl}/api/chat/${roomId}`,
        `${baseUrl}/chat/${roomId}`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url);
          const data = await safeJson(res);

          if (res.ok) {
            const list = Array.isArray(data?.messages)
              ? data.messages
              : Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data)
                  ? data
                  : [];

            setMessages(list);
            return;
          }
        } catch {
          continue;
        }
      }
    } catch {
      console.log('메시지 불러오기 실패');
    }
  };

  const sendMessage = async () => {
    if (sending) return;

    if (roomEnded) {
      Alert.alert('토론 종료', '토론 시간이 끝났거나 종료된 방입니다. AI 요약을 확인해주세요.');
      return;
    }

    if (!input.trim()) {
      return;
    }

    if (!roomId) {
      setMessage('토론방 ID가 없습니다.');
      return;
    }

    try {
      setSending(true);
      setMessage('');

      const baseUrl = getBaseUrl();
      const text = input.trim();

      const bodyData = {
        roomId,
        room: roomId,
        roomTitle,
        userName: myName,
        userEmail: myEmail,
        side,
        text,
        message: text,
      };

      const urls = [
        `${baseUrl}/api/messages`,
        `${baseUrl}/messages`,
        `${baseUrl}/api/chat`,
        `${baseUrl}/chat`,
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
            setInput('');

            const savedMessage =
              data?.savedMessage || data?.data || data?.messageData || null;

            if (savedMessage && typeof savedMessage === 'object') {
              setMessages((prev) => [...prev, savedMessage]);
            } else {
              await loadMessages();
            }

            scrollToBottom();
            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }

      setMessage('메시지 전송 API를 찾지 못했어요.');
    } catch {
      setMessage('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  const extendFiveMinutes = async () => {
    if (extending) return;

    if (!isPremium) {
      Alert.alert(
        '프리미엄 기능',
        '토론 시간 연장은 프리미엄 기능입니다.',
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

    try {
      setExtending(true);
      setMessage('');

      const baseUrl = getBaseUrl();

      const bodyData = {
        roomId,
        minutes: 5,
        secondsLeft,
        email: myEmail,
        userEmail: myEmail,
      };

      const urls = [
        `${baseUrl}/api/extend-time`,
        `${baseUrl}/extend-time`,
        `${baseUrl}/api/rooms/extend-time`,
        `${baseUrl}/rooms/extend-time`,
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
            const nextRoom = data?.room || data?.data;

            if (nextRoom) {
              setRoom(nextRoom);
              const nextSecondsLeft = calculateSecondsLeft(nextRoom);
              setSecondsLeft(nextSecondsLeft);
              setTimeEnded(false);
            } else {
              setSecondsLeft((prev) => prev + 5 * 60);
              setTimeEnded(false);
            }

            Alert.alert('연장 완료', data?.message || '토론 시간이 5분 연장되었습니다.');
            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }

      setMessage('시간 연장 API를 찾지 못했어요.');
    } catch {
      setMessage('시간 연장 중 오류가 발생했습니다.');
    } finally {
      setExtending(false);
    }
  };

 const askAiModerator = async () => {
  if (askingAi) return;

  if (!myEmail) {
    Alert.alert(
      '로그인 필요',
      'AI 중재자를 사용하려면 로그인 정보가 필요합니다.'
    );
    return;
  }

  const recentMessages = messages.slice(-12).map((item) => ({
    userName: item.userName || '토론가',
    text: getMessageText(item),
    side: item.side || '중립',
  }));

  const hasConversation =
    Boolean(input.trim()) ||
    recentMessages.some((item) => item.text.trim());

  if (!hasConversation) {
    Alert.alert(
      '토론 내용 필요',
      '메시지를 먼저 작성한 뒤 AI 중재자를 호출해주세요.'
    );
    return;
  }

  try {
    setAskingAi(true);
    setAiAdvice('');
    setMessage('');

    const baseUrl = getBaseUrl();

    const bodyData = {
      roomId,
      roomTitle,
      topic,
      latestMessage:
        input.trim() ||
        recentMessages[recentMessages.length - 1]?.text ||
        '',
      messages: recentMessages,
      participants: participants.map((item) => ({
        name: getParticipantName(item),
        email: item.email || '',
      })),

      email: myEmail,
      userEmail: myEmail,
    };

    const urls = [
      `${baseUrl}/api/moderator`,
      `${baseUrl}/moderator`,
      `${baseUrl}/api/ai/moderator`,
      `${baseUrl}/ai/moderator`,
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
          setShowAiPanel(true);

          setAiAdvice(
            data?.advice ||
              '현재 토론 흐름을 유지하면서 근거와 사례를 더 구체적으로 말해보세요.'
          );

          if (data?.usage) {
            setModeratorUsage(data.usage);
          }

          if (data?.user) {
            await saveReturnedUser(data.user);
          }

          return;
        }

        if (res.status === 429) {
          setMessage(
            data?.message ||
              '오늘 사용할 수 있는 AI 중재자 횟수를 모두 사용했습니다.'
          );

          if (data?.usage) {
            setModeratorUsage(data.usage);
          }

          Alert.alert(
            '오늘 사용량을 모두 사용했어요',
            data?.message ||
              'Premium에서는 AI 중재자를 더 많이 사용할 수 있습니다.',
            [
              {
                text: '확인',
                style: 'cancel',
              },
              {
                text: 'Premium 보기',
                onPress: () => router.push('/premium' as any),
              },
            ]
          );

          return;
        }

        if (
          typeof data === 'object' &&
          data !== null &&
          data?.message
        ) {
          setMessage(data.message);
        }
      } catch {
        continue;
      }
    }

    setMessage('AI 중재자 API를 찾지 못했습니다.');
  } catch {
    setMessage('AI 중재자 연결 중 오류가 발생했습니다.');
  } finally {
    setAskingAi(false);
  }
};

  const reportMessage = async (target: Message) => {
    const targetName = target.userName || '사용자';
    const targetEmail = target.userEmail || '';

    Alert.alert(
      '신고하기',
      `${targetName}님의 메시지를 신고할까요?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '신고',
          style: 'destructive',
          onPress: async () => {
            try {
              const baseUrl = getBaseUrl();

              const bodyData = {
                roomId,
                targetName,
                targetEmail,
                reporterName: myName,
                reporterEmail: myEmail,
                reason: '부적절한 메시지',
                messageText: getMessageText(target),
              };

              const urls = [
                `${baseUrl}/api/report`,
                `${baseUrl}/report`,
                `${baseUrl}/api/reports`,
                `${baseUrl}/reports`,
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

                  if (res.ok) {
                    Alert.alert('신고 완료', '신고가 접수되었습니다.');
                    return;
                  }
                } catch {
                  continue;
                }
              }

              Alert.alert('신고 실패', '신고 API를 찾지 못했습니다.');
            } catch {
              Alert.alert('신고 실패', '신고 처리 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const blockUser = async (target: Message) => {
    const key = getBlockKey(target);

    if (!key) {
      Alert.alert('차단 불가', '차단할 사용자 정보를 찾지 못했습니다.');
      return;
    }

    Alert.alert(
      '사용자 차단',
      `${target.userName || '사용자'}님의 메시지를 숨길까요?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '차단',
          style: 'destructive',
          onPress: async () => {
            const nextBlockedUsers = Array.from(new Set([...blockedUsers, key]));

            setBlockedUsers(nextBlockedUsers);
            await AsyncStorage.setItem('clach_blocked_users', JSON.stringify(nextBlockedUsers));

            Alert.alert('차단 완료', '이 사용자의 메시지가 숨겨집니다.');
          },
        },
      ]
    );
  };

  const openMessageMenu = (target: Message) => {
    const isMe = myEmail && target.userEmail === myEmail;

    if (isMe) {
      Alert.alert('내 메시지', '내가 보낸 메시지는 신고하거나 차단할 수 없습니다.');
      return;
    }

    Alert.alert(
      '메시지 관리',
      '이 메시지에 대해 어떤 작업을 할까요?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '신고하기',
          onPress: () => reportMessage(target),
        },
        {
          text: '사용자 차단',
          style: 'destructive',
          onPress: () => blockUser(target),
        },
      ]
    );
  };

  const voteEndDebate = async () => {
    if (votingEnd) return;

    if (roomEnded) {
      openSummary();
      return;
    }

    Alert.alert(
      '토론 종료 투표',
      '토론 종료에 찬성하시겠습니까? 과반수 이상이 찬성하면 토론이 종료됩니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '찬성',
          onPress: async () => {
            try {
              setVotingEnd(true);
              setMessage('');

              const baseUrl = getBaseUrl();

              const bodyData = {
                name: myName,
                nickname: myName,
                email: myEmail,
                userEmail: myEmail,
              };

              const urls = [
                `${baseUrl}/api/rooms/${roomId}/end-vote`,
                `${baseUrl}/rooms/${roomId}/end-vote`,
                `${baseUrl}/api/room/${roomId}/end-vote`,
                `${baseUrl}/room/${roomId}/end-vote`,
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
                    const nextRoom = data?.room || data?.data;

                    if (nextRoom) {
                      setRoom(nextRoom);
                    }

                    Alert.alert(
                      data?.ended ? '토론 종료' : '투표 완료',
                      data?.message || '종료 투표가 접수되었습니다.',
                      data?.ended
                        ? [
                            {
                              text: 'AI 요약 보기',
                              onPress: openSummary,
                            },
                          ]
                        : [{ text: '확인' }]
                    );

                    return;
                  }

                  if (typeof data === 'object' && data?.message) {
                    setMessage(data.message);
                  }
                } catch {
                  continue;
                }
              }

              setMessage('종료 투표 API를 찾지 못했어요.');
            } catch {
              setMessage('종료 투표 중 오류가 발생했습니다.');
            } finally {
              setVotingEnd(false);
            }
          },
        },
      ]
    );
  };

  const leaveRoom = () => {
    Alert.alert(
      '토론방 나가기',
      roomEnded
        ? '토론방에서 나가시겠습니까?'
        : '토론이 종료되지 않았는데 나가면 10분 패널티가 적용될 수 있습니다. 나가시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            try {
              const baseUrl = getBaseUrl();

              const bodyData = {
                email: myEmail,
                userEmail: myEmail,
              };

              const urls = [
                `${baseUrl}/api/rooms/${roomId}/leave`,
                `${baseUrl}/rooms/${roomId}/leave`,
                `${baseUrl}/api/room/${roomId}/leave`,
                `${baseUrl}/room/${roomId}/leave`,
              ];

              for (const url of urls) {
                try {
                  await fetch(url, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bodyData),
                  });

                  break;
                } catch {
                  continue;
                }
              }

              router.replace('/room-list' as any);
            } catch {
              router.replace('/room-list' as any);
            }
          },
        },
      ]
    );
  };

  const openSummary = () => {
    router.push({
      pathname: '/summary' as any,
      params: {
        roomId,
        roomTitle,
      },
    });
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (myName) {
      loadRoom();
      loadMessages();
      joinRoom();
    }
  }, [roomId, myName, myEmail]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadMessages();
      loadRoom();
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, [roomId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = Math.max(0, prev - 1);

        if (next <= 0) {
          setTimeEnded(true);
        }

        return next;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages.length]);

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.safe}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={leaveRoom}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {roomTitle}
            </Text>
            <Text style={styles.headerSub}>
              {participantCount}/{maxParticipants}명 · 종료투표 {voteCount}/{requiredVotes}
            </Text>
          </View>

          <Pressable style={styles.headerButton} onPress={openSummary}>
            <Text style={styles.summaryText}>AI</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={roomEnded ? styles.timerCardEnded : styles.timerCard}>
            <View>
              <Text style={roomEnded ? styles.timerLabelEnded : styles.timerLabel}>
                {roomEnded ? '토론 종료' : '남은 시간'}
              </Text>
              <Text style={roomEnded ? styles.timerNumberEnded : styles.timerNumber}>
                {roomEnded ? '00:00' : formatTime(secondsLeft)}
              </Text>
            </View>

            <View style={styles.timerButtonBox}>
              <Pressable style={styles.timerSummaryButton} onPress={openSummary}>
                <Text style={styles.timerSummaryText}>AI 요약</Text>
              </Pressable>

              <Pressable
                style={[styles.extendButton, extending && styles.disabledButton]}
                onPress={extendFiveMinutes}
                disabled={extending}
              >
                <Text style={styles.extendButtonText}>
                  {extending ? '연장 중' : '+5분'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.timerBar}>
            <View
              style={[
                styles.timerBarFill,
                {
                  width: `${getTimePercent()}%`,
                },
              ]}
            />
          </View>

          <View style={styles.topicCard}>
            <Text style={styles.topicLabel}>토론 주제</Text>
            <Text style={styles.topicTitle}>{roomTitle}</Text>
            <Text style={styles.topicText}>
              {topic || '토론 주제 설명이 없습니다.'}
            </Text>

            <View style={styles.topicInfoRow}>
              <View style={styles.topicPill}>
                <Text style={styles.topicPillText}>
                  {room?.timeLimit || 30}분
                </Text>
              </View>

              <View style={styles.topicPill}>
                <Text style={styles.topicPillText}>
                  {roomEnded ? '종료됨' : '진행 중'}
                </Text>
              </View>

              <View style={styles.topicPill}>
                <Text style={styles.topicPillText}>{side}</Text>
              </View>
            </View>

            <View style={styles.topicButtonRow}>
              <Pressable
                style={styles.participantOpenButton}
                onPress={() => setShowParticipants((prev) => !prev)}
              >
                <Text style={styles.participantOpenText}>
                  {showParticipants ? '참여자 닫기' : '참여자 보기'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.aiModeratorButton}
                onPress={askAiModerator}
                disabled={askingAi}
              >
                <Text style={styles.aiModeratorText}>
                  {askingAi ? 'AI 분석 중' : 'AI 중재자'}
                </Text>
              </Pressable>
            </View>
          </View>

          {showParticipants ? (
            <View style={styles.participantCard}>
              <View style={styles.participantHeaderRow}>
                <View>
                  <Text style={styles.participantLabel}>참여자</Text>
                  <Text style={styles.participantTitle}>
                    {participantCount}/{maxParticipants}명 입장
                  </Text>
                </View>

                <Pressable style={styles.participantRefreshButton} onPress={loadRoom}>
                  <Text style={styles.participantRefreshText}>새로고침</Text>
                </Pressable>
              </View>

              {participants.length === 0 ? (
                <View style={styles.emptyParticipantBox}>
                  <Text style={styles.emptyParticipantTitle}>아직 참여자가 없어요</Text>
                  <Text style={styles.emptyParticipantText}>
                    토론방에 들어온 사람이 여기에 표시됩니다.
                  </Text>
                </View>
              ) : (
                participants.map((participant, index) => {
                  const name = getParticipantName(participant);
                  const isMe = myEmail && participant.email === myEmail;

                  return (
                    <View
                      key={`${participant.email || name}-${index}`}
                      style={isMe ? styles.myParticipantItem : styles.participantItem}
                    >
                      <View style={isMe ? styles.myParticipantAvatar : styles.participantAvatar}>
                        <Text style={styles.participantAvatarText}>
                          {getInitial(name)}
                        </Text>
                      </View>

                      <View style={styles.participantInfo}>
                        <View style={styles.participantNameRow}>
                          <Text style={styles.participantName} numberOfLines={1}>
                            {name}
                          </Text>

                          {isMe ? (
                            <View style={styles.meBadge}>
                              <Text style={styles.meBadgeText}>나</Text>
                            </View>
                          ) : null}
                        </View>

                        <Text style={styles.participantEmail} numberOfLines={1}>
                          {participant.email || '이메일 없음'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : null}

          {showAiPanel ? (
            <View style={styles.aiPanel}>
              <View style={styles.aiPanelTopRow}>
                <Text style={styles.aiPanelTitle}>AI 중재자</Text>

                <Pressable onPress={() => setShowAiPanel(false)}>
                  <Text style={styles.aiPanelClose}>닫기</Text>
                </Pressable>
              </View>

              <Text style={styles.aiPanelText}>
                {aiAdvice || 'AI 중재자 응답이 없습니다.'}
              </Text>
            </View>
          ) : null}

{moderatorUsage ? (
  <View style={styles.aiUsageBox}>
    <Text style={styles.aiUsageText}>
      오늘 사용 {moderatorUsage.used}/{moderatorUsage.limit}회
    </Text>

    <Text style={styles.aiUsageRemain}>
      남은 횟수 {moderatorUsage.remaining}회
    </Text>
  </View>
) : null}

          <View style={styles.sideRow}>
            <Pressable
              style={side === '찬성' ? styles.sideButtonActive : styles.sideButton}
              onPress={() => setSide('찬성')}
              disabled={roomEnded}
            >
              <Text style={side === '찬성' ? styles.sideTextActive : styles.sideText}>
                찬성
              </Text>
            </Pressable>

            <Pressable
              style={side === '반대' ? styles.sideButtonActive : styles.sideButton}
              onPress={() => setSide('반대')}
              disabled={roomEnded}
            >
              <Text style={side === '반대' ? styles.sideTextActive : styles.sideText}>
                반대
              </Text>
            </Pressable>

            <Pressable
              style={side === '중립' ? styles.sideButtonActive : styles.sideButton}
              onPress={() => setSide('중립')}
              disabled={roomEnded}
            >
              <Text style={side === '중립' ? styles.sideTextActive : styles.sideText}>
                중립
              </Text>
            </Pressable>
          </View>

          {message ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>안내</Text>
              <Text style={styles.noticeText}>{message}</Text>
            </View>
          ) : null}

          {loadingRoom ? (
            <Text style={styles.loadingText}>토론방 정보를 불러오는 중...</Text>
          ) : null}

          <Text style={styles.sectionTitle}>토론 메시지</Text>

          {blockedUsers.length > 0 ? (
            <View style={styles.blockNotice}>
              <Text style={styles.blockNoticeText}>
                차단한 사용자 {blockedUsers.length}명의 메시지가 숨겨져 있습니다.
              </Text>

              <Pressable
                onPress={async () => {
                  setBlockedUsers([]);
                  await AsyncStorage.removeItem('clach_blocked_users');
                }}
              >
                <Text style={styles.unblockText}>차단 해제</Text>
              </Pressable>
            </View>
          ) : null}

          {filteredMessages.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>아직 표시할 메시지가 없어요</Text>
              <Text style={styles.emptyText}>
                첫 의견을 남기거나 차단한 사용자를 해제해보세요.
              </Text>
            </View>
          ) : (
            filteredMessages.map((item, index) => {
              const text = getMessageText(item);
              const isMe = myEmail && item.userEmail === myEmail;

              return (
                <View
                  key={item._id || item.id || String(index)}
                  style={isMe ? styles.myMessageCard : styles.otherMessageCard}
                >
                  <View style={styles.messageTopRow}>
                    <Text style={isMe ? styles.myMessageName : styles.otherMessageName}>
                      {item.userName || '토론가'}
                    </Text>

                    <View style={styles.sideBadge}>
                      <Text style={styles.sideBadgeText}>{item.side || '중립'}</Text>
                    </View>

                    <Pressable
                      style={styles.messageMenuButton}
                      onPress={() => openMessageMenu(item)}
                    >
                      <Text style={styles.messageMenuText}>⋯</Text>
                    </Pressable>
                  </View>

                  <Text style={isMe ? styles.myMessageText : styles.otherMessageText}>
                    {text}
                  </Text>
                </View>
              );
            })
          )}

          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>토론 관리</Text>
            <Text style={styles.actionText}>
              {roomEnded
                ? '토론이 종료되었습니다. AI 요약으로 결과를 확인해보세요.'
                : '토론을 끝내려면 과반수 이상이 종료에 찬성해야 합니다.'}
            </Text>

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.voteButton, votingEnd && styles.disabledButton]}
                onPress={voteEndDebate}
                disabled={votingEnd}
              >
                <Text style={styles.voteButtonText}>
                  {roomEnded ? '요약 보기' : votingEnd ? '투표 중...' : '종료 투표'}
                </Text>
              </Pressable>

              <Pressable style={styles.summaryButton} onPress={openSummary}>
                <Text style={styles.summaryButtonText}>AI 요약</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={[styles.input, roomEnded && styles.inputDisabled]}
            placeholder={roomEnded ? '토론이 종료되었습니다' : '메시지를 입력하세요'}
            placeholderTextColor="#777"
            value={input}
            onChangeText={setInput}
            multiline
            editable={!roomEnded}
          />

          <Pressable
            style={[styles.sendButton, (sending || roomEnded) && styles.disabledButton]}
            onPress={sendMessage}
            disabled={sending || roomEnded}
          >
            <Text style={styles.sendButtonText}>
              {roomEnded ? '종료' : sending ? '...' : '전송'}
            </Text>
          </Pressable>
        </View>

        <BottomNav active="rooms" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  header: {
    height: 104,
    paddingTop: 54,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
    backgroundColor: BRAND.white,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 56,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    color: BRAND.black,
    fontSize: 42,
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
  },
  headerSub: {
    color: BRAND.blue,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 3,
  },
  summaryText: {
    color: BRAND.blue,
    fontSize: 16,
    fontWeight: '900',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 170,
  },
  timerCard: {
    borderRadius: 24,
    backgroundColor: BRAND.black,
    padding: 22,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerCardEnded: {
    borderRadius: 24,
    backgroundColor: BRAND.yellow,
    padding: 22,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  timerLabelEnded: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  timerNumber: {
    color: BRAND.white,
    fontSize: 42,
    fontWeight: '900',
    marginTop: 5,
  },
  timerNumberEnded: {
    color: BRAND.black,
    fontSize: 42,
    fontWeight: '900',
    marginTop: 5,
  },
  timerButtonBox: {
    gap: 8,
  },
  timerSummaryButton: {
    borderRadius: 999,
    backgroundColor: BRAND.blue,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  timerSummaryText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '900',
  },
  extendButton: {
    borderRadius: 999,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  extendButtonText: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
  },
  timerBar: {
    height: 9,
    borderRadius: 999,
    backgroundColor: BRAND.line,
    overflow: 'hidden',
    marginBottom: 16,
  },
  timerBarFill: {
    height: 9,
    borderRadius: 999,
    backgroundColor: BRAND.blue,
  },
  topicCard: {
    borderRadius: 24,
    backgroundColor: BRAND.blue,
    padding: 22,
  },
  topicLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  topicTitle: {
    color: BRAND.white,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
    lineHeight: 31,
  },
  topicText: {
    color: BRAND.white,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  topicInfoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  topicPill: {
    borderRadius: 999,
    backgroundColor: BRAND.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  topicPillText: {
    color: BRAND.black,
    fontSize: 11,
    fontWeight: '900',
  },
  topicButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  participantOpenButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantOpenText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '900',
  },
  aiModeratorButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiModeratorText: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
  },
  participantCard: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
  },
  participantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantLabel: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  participantTitle: {
    color: BRAND.black,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 5,
  },
  participantRefreshButton: {
    borderRadius: 999,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  participantRefreshText: {
    color: BRAND.black,
    fontSize: 11,
    fontWeight: '900',
  },
  emptyParticipantBox: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#F2F2F2',
    padding: 16,
  },
  emptyParticipantTitle: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  emptyParticipantText: {
    color: BRAND.black,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  participantItem: {
    marginTop: 14,
    minHeight: 70,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  myParticipantItem: {
    marginTop: 14,
    minHeight: 70,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: BRAND.blue,
    backgroundColor: '#F7FAFF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myParticipantAvatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    color: BRAND.white,
    fontSize: 19,
    fontWeight: '900',
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
    maxWidth: 170,
  },
  participantEmail: {
    color: BRAND.black,
    fontSize: 12,
    marginTop: 5,
  },
  meBadge: {
    marginLeft: 8,
    borderRadius: 999,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  meBadgeText: {
    color: BRAND.black,
    fontSize: 10,
    fontWeight: '900',
  },
  aiPanel: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 18,
  },
  aiPanelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiPanelTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  aiPanelClose: {
    color: BRAND.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  aiPanelText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  aiUsageBox: {
  marginTop: 14,
  borderRadius: 14,
  backgroundColor: BRAND.white,
  paddingHorizontal: 14,
  paddingVertical: 12,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
aiUsageText: {
  color: BRAND.black,
  fontSize: 12,
  fontWeight: '900',
},
aiUsageRemain: {
  color: BRAND.blue,
  fontSize: 12,
  fontWeight: '900',
},
  sideRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  sideButton: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonActive: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideText: {
    color: BRAND.black,
    fontSize: 14,
    fontWeight: '900',
  },
  sideTextActive: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '900',
  },
  noticeCard: {
    marginTop: 16,
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
  loadingText: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
  },
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 24,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  blockNotice: {
    borderRadius: 16,
    backgroundColor: '#F2F2F2',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockNoticeText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  unblockText: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 10,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
  },
  emptyTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  myMessageCard: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 14,
    marginBottom: 12,
  },
  otherMessageCard: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 14,
    marginBottom: 12,
  },
  messageTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  myMessageName: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
    marginRight: 8,
  },
  otherMessageName: {
    color: BRAND.blue,
    fontSize: 13,
    fontWeight: '900',
    marginRight: 8,
  },
  sideBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.black,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sideBadgeText: {
    color: BRAND.white,
    fontSize: 10,
    fontWeight: '900',
  },
  messageMenuButton: {
    marginLeft: 8,
    width: 28,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageMenuText: {
    color: BRAND.black,
    fontSize: 22,
    fontWeight: '900',
    marginTop: -8,
  },
  myMessageText: {
    color: BRAND.black,
    fontSize: 15,
    lineHeight: 22,
  },
  otherMessageText: {
    color: BRAND.black,
    fontSize: 15,
    lineHeight: 22,
  },
  actionCard: {
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: BRAND.black,
    padding: 20,
  },
  actionTitle: {
    color: BRAND.yellow,
    fontSize: 18,
    fontWeight: '900',
  },
  actionText: {
    color: BRAND.white,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  voteButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteButtonText: {
    color: BRAND.black,
    fontSize: 14,
    fontWeight: '900',
  },
  summaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryButtonText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '900',
  },
  inputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 88,
    minHeight: 76,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    backgroundColor: BRAND.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    maxHeight: 90,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    color: BRAND.black,
    fontSize: 15,
    backgroundColor: BRAND.white,
  },
  inputDisabled: {
    backgroundColor: '#F2F2F2',
  },
  sendButton: {
    width: 66,
    height: 52,
    borderRadius: 18,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
  },
});