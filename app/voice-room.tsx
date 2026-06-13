import React, { useEffect, useRef, useState } from 'react';
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
import { Audio } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';
import { getVoiceModeText } from '../constants/voiceConfig';
import {
  joinVoiceRoom,
  leaveVoiceRoom,
  toggleMic as toggleVoiceMic,
} from '../services/voiceSession';

type VoiceNote = {
  id: string;
  userName: string;
  text: string;
  createdAt: string;
  audioUri?: string | null;
};

type RoomParticipant =
  | string
  | {
      name?: string;
      nickname?: string;
      userName?: string;
      email?: string;
      userEmail?: string;
    };

type RoomData = {
  _id?: string;
  title?: string;
  topic?: string;
  roomType?: string;
  timeLimit?: number;
  status?: string;
  participants?: RoomParticipant[];
};

type VoiceParticipant = {
  id: string;
  name: string;
  email?: string;
  isMe?: boolean;
  micOn: boolean;
  isSpeaking: boolean;
  joinedAt: string;
};

export default function VoiceRoomScreen() {
  const params = useLocalSearchParams<{
    roomId?: string;
    roomTitle?: string;
  }>();

  const roomId = params.roomId || '';
  const scrollRef = useRef<ScrollView>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const [roomTitle, setRoomTitle] = useState(params.roomTitle || '음성 토론방');
  const [topic, setTopic] = useState('');
  const [myName, setMyName] = useState('토론가');
  const [myEmail, setMyEmail] = useState('');

  const [voiceConnected, setVoiceConnected] = useState(false);
  const [liveMicOn, setLiveMicOn] = useState(false);
  const [voiceModeMessage, setVoiceModeMessage] = useState(getVoiceModeText());
  const [sessionLoading, setSessionLoading] = useState(false);

  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [currentSpeakerName, setCurrentSpeakerName] = useState('');

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [lastAudioUri, setLastAudioUri] = useState<string | null>(null);

  const [memo, setMemo] = useState('');
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [aiAdvice, setAiAdvice] = useState('');
  const [message, setMessage] = useState('');
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [savingMemo, setSavingMemo] = useState(false);
  const [askingAi, setAskingAi] = useState(false);

  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [playingLoading, setPlayingLoading] = useState(false);

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

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const min = Math.floor(safeSeconds / 60);
    const sec = safeSeconds % 60;

    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const getMyParticipantId = () => {
    return myEmail || 'me';
  };

  const getParticipantInitial = (name: string) => {
    return name.trim().slice(0, 1) || '토';
  };

  const upsertParticipant = (nextParticipant: VoiceParticipant) => {
    setParticipants((prev) => {
      const exists = prev.some((item) => item.id === nextParticipant.id);

      if (!exists) {
        return [nextParticipant, ...prev];
      }

      return prev.map((item) =>
        item.id === nextParticipant.id
          ? {
              ...item,
              ...nextParticipant,
            }
          : item
      );
    });
  };

  const updateMyParticipant = ({
    micOn,
    isSpeaking,
  }: {
    micOn: boolean;
    isSpeaking: boolean;
  }) => {
    upsertParticipant({
      id: getMyParticipantId(),
      name: myName || '나',
      email: myEmail,
      isMe: true,
      micOn,
      isSpeaking,
      joinedAt: new Date().toISOString(),
    });
  };

  const removeMyParticipant = () => {
    setParticipants((prev) =>
      prev.filter((item) => item.id !== getMyParticipantId())
    );
  };

  const getRoomParticipantName = (participant: RoomParticipant) => {
    if (typeof participant === 'string') {
      return participant;
    }

    return (
      participant.name ||
      participant.nickname ||
      participant.userName ||
      participant.email ||
      participant.userEmail ||
      '참여자'
    );
  };

  const getRoomParticipantEmail = (participant: RoomParticipant) => {
    if (typeof participant === 'string') {
      return participant.includes('@') ? participant : '';
    }

    return participant.email || participant.userEmail || '';
  };

  const seedParticipantsFromRoom = (roomData: RoomData) => {
    if (!Array.isArray(roomData.participants)) return;

    const mappedParticipants: VoiceParticipant[] = roomData.participants.map(
      (participant, index) => {
        const name = getRoomParticipantName(participant);
        const email = getRoomParticipantEmail(participant);

        return {
          id: email || `${name}-${index}`,
          name,
          email,
          isMe: email ? email === myEmail : false,
          micOn: false,
          isSpeaking: false,
          joinedAt: new Date().toISOString(),
        };
      }
    );

    setParticipants((prev) => {
      const merged = [...prev];

      mappedParticipants.forEach((item) => {
        const exists = merged.some((prevItem) => prevItem.id === item.id);

        if (!exists) {
          merged.push(item);
        }
      });

      return merged;
    });
  };

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('clach_user');

      if (savedUser) {
        const user = JSON.parse(savedUser);
        const finalName = user.name || user.nickname || '토론가';
        const finalEmail = user.email || '';

        setMyName(finalName);
        setMyEmail(finalEmail);
      }
    } catch {
      console.log('사용자 정보 불러오기 실패');
    }
  };

  const loadRoom = async () => {
    if (!roomId) {
      setMessage('토론방 정보를 찾을 수 없습니다.');
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
            const roomData: RoomData = data?.room || data?.data || data;

            if (roomData?.title) {
              setRoomTitle(roomData.title);
            }

            if (roomData?.topic) {
              setTopic(roomData.topic);
            }

            seedParticipantsFromRoom(roomData);
            return;
          }
        } catch {
          continue;
        }
      }

      setMessage('음성 토론방 정보를 불러오지 못했어요.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoadingRoom(false);
    }
  };

  const connectVoiceSession = async () => {
    if (sessionLoading) return;

    try {
      setSessionLoading(true);
      setMessage('');

      const result = await joinVoiceRoom({
        roomId,
        userName: myName,
      });

      if (result.ok) {
        setVoiceConnected(true);
        setLiveMicOn(false);
        setCurrentSpeakerName('');
        updateMyParticipant({
          micOn: false,
          isSpeaking: false,
        });
        setVoiceModeMessage(result.message || getVoiceModeText());

        Alert.alert('음성방 입장', result.message || '음성방에 입장했습니다.');
        return;
      }

      setMessage(result.message || '음성방 입장에 실패했습니다.');
    } catch {
      setMessage('음성방 연결 중 문제가 발생했습니다.');
    } finally {
      setSessionLoading(false);
    }
  };

  const leaveLiveVoiceSession = async () => {
    try {
      await leaveVoiceRoom();

      setVoiceConnected(false);
      setLiveMicOn(false);
      setCurrentSpeakerName('');
      removeMyParticipant();

      Alert.alert('음성방 나가기', '음성방에서 나갔습니다.');
    } catch {
      setMessage('음성방 나가기 중 문제가 발생했습니다.');
    }
  };

  const toggleLiveMic = async () => {
    if (!voiceConnected) {
      Alert.alert('음성방 입장 필요', '먼저 실시간 음성방에 입장해주세요.');
      return;
    }

    try {
      const result = await toggleVoiceMic(liveMicOn);

      if (result.ok) {
        const nextMicOn = result.micOn;

        setLiveMicOn(nextMicOn);
        setVoiceModeMessage(result.message);

        updateMyParticipant({
          micOn: nextMicOn,
          isSpeaking: nextMicOn,
        });

        setCurrentSpeakerName(nextMicOn ? myName : '');
      }
    } catch {
      setMessage('마이크 상태 변경 중 문제가 발생했습니다.');
    }
  };

  const stopPlayingAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setPlayingNoteId(null);

      if (!liveMicOn && !isRecording) {
        setCurrentSpeakerName('');
      }
    } catch {
      setPlayingNoteId(null);
      soundRef.current = null;

      if (!liveMicOn && !isRecording) {
        setCurrentSpeakerName('');
      }
    }
  };

  const playVoiceNote = async (note: VoiceNote) => {
    if (!note.audioUri) {
      Alert.alert('재생 불가', '녹음 파일이 없습니다.');
      return;
    }

    if (playingNoteId === note.id) {
      await stopPlayingAudio();
      return;
    }

    try {
      setPlayingLoading(true);

      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: note.audioUri },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setPlayingNoteId(note.id);
      setCurrentSpeakerName(note.userName);

      setParticipants((prev) =>
        prev.map((item) => ({
          ...item,
          isSpeaking: item.name === note.userName,
        }))
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        if (status.didJustFinish) {
          stopPlayingAudio();
          setParticipants((prev) =>
            prev.map((item) => ({
              ...item,
              isSpeaking: false,
            }))
          );
        }
      });
    } catch (err) {
      console.log('음성 재생 오류:', err);
      Alert.alert('재생 실패', '녹음 파일을 재생하지 못했습니다.');
    } finally {
      setPlayingLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      setMessage('');
      await stopPlayingAudio();

      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('마이크 권한 필요', '음성 토론을 위해 마이크 권한이 필요합니다.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();

      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      await newRecording.startAsync();

      setRecording(newRecording);
      setIsRecording(true);
      setRecordSeconds(0);
      setLastAudioUri(null);
      setCurrentSpeakerName(myName);

      updateMyParticipant({
        micOn: liveMicOn,
        isSpeaking: true,
      });
    } catch (err) {
      console.log('녹음 시작 오류:', err);
      Alert.alert('녹음 실패', '마이크 녹음을 시작하지 못했습니다.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();

      setRecording(null);
      setIsRecording(false);
      setLastAudioUri(uri || null);

      if (!liveMicOn) {
        setCurrentSpeakerName('');
      }

      updateMyParticipant({
        micOn: liveMicOn,
        isSpeaking: liveMicOn,
      });

      const newNote: VoiceNote = {
        id: Date.now().toString(),
        userName: myName,
        text: memo.trim() || '음성 발언이 기록되었습니다. 아래 메모를 추가해보세요.',
        createdAt: new Date().toISOString(),
        audioUri: uri || null,
      };

      setVoiceNotes((prev) => [...prev, newNote]);
      scrollToBottom();

      Alert.alert('녹음 완료', '음성 발언이 기록되었습니다. 재생 버튼으로 다시 들을 수 있습니다.');
    } catch (err) {
      console.log('녹음 종료 오류:', err);
      Alert.alert('녹음 종료 실패', '녹음을 종료하지 못했습니다.');
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
      return;
    }

    await startRecording();
  };

  const saveVoiceMemo = async () => {
    if (savingMemo) return;

    if (!memo.trim() && !lastAudioUri) {
      Alert.alert('메모 필요', '음성 토론 내용을 간단히 적거나 녹음을 먼저 해주세요.');
      return;
    }

    try {
      setSavingMemo(true);
      setMessage('');

      const baseUrl = getBaseUrl();

      const bodyData = {
        room: roomId || roomTitle,
        roomTitle,
        text: memo.trim() || '음성 발언 기록',
        memo: memo.trim() || '음성 발언 기록',
        audioUri: lastAudioUri || '',
        userName: myName,
      };

      const urls = [
        `${baseUrl}/api/voice-memo`,
        `${baseUrl}/voice-memo`,
        `${baseUrl}/api/voice`,
        `${baseUrl}/voice`,
        `${baseUrl}/api/memo`,
        `${baseUrl}/memo`,
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
            const newNote: VoiceNote = {
              id: data?.memo?._id || Date.now().toString(),
              userName: myName,
              text: memo.trim() || '음성 발언 기록',
              createdAt: new Date().toISOString(),
              audioUri: lastAudioUri,
            };

            setVoiceNotes((prev) => [...prev, newNote]);
            setMemo('');
            setLastAudioUri(null);
            Alert.alert('저장 완료', data?.message || '음성 메모가 저장되었습니다.');
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

      setMessage('음성 메모 저장 API를 찾지 못했어요.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setSavingMemo(false);
    }
  };

  const callAiModerator = async () => {
    if (askingAi) return;

    try {
      setAskingAi(true);
      setMessage('');
      setAiAdvice('');

      const baseUrl = getBaseUrl();

      const recentMessages = voiceNotes.map((note) => ({
        userName: note.userName,
        text: note.text,
      }));

      const bodyData = {
        roomTitle,
        topic: topic || roomTitle,
        latestMessage: memo || voiceNotes[voiceNotes.length - 1]?.text || '',
        messages: recentMessages,
        participants: participants.map((item) => ({
          name: item.name,
          micOn: item.micOn,
          isSpeaking: item.isSpeaking,
        })),
        currentSpeakerName,
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
            setAiAdvice(
              data?.advice ||
                data?.summary ||
                'AI 중재자 응답을 가져오지 못했습니다.'
            );
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

      setMessage('AI 중재자 API를 찾지 못했어요.');
    } catch {
      setMessage('AI 중재자 연결을 확인해주세요.');
    } finally {
      setAskingAi(false);
    }
  };

  const endVoiceDebate = () => {
    Alert.alert('음성 토론 종료', 'AI 요약 화면으로 이동할까요?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: 'AI 요약 보기',
        onPress: () =>
          router.push({
            pathname: '/summary' as any,
            params: {
              roomId,
              roomTitle,
            },
          }),
      },
    ]);
  };

  useEffect(() => {
    loadUser();
    loadRoom();
    setVoiceModeMessage(getVoiceModeText());
  }, [roomId]);

  useEffect(() => {
    if (voiceConnected) {
      updateMyParticipant({
        micOn: liveMicOn,
        isSpeaking: liveMicOn || isRecording,
      });
    }
  }, [myName, myEmail]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (isRecording) {
      timer = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }

      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }

      leaveVoiceRoom().catch(() => {});
    };
  }, [recording]);

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>음성 토론방</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {roomTitle}
          </Text>
        </View>

        <Pressable style={styles.headerButton} onPress={endVoiceDebate}>
          <Text style={styles.more}>⋯</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>VOICE DEBATE ROOM</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>음성 토론</Text>
          <Text style={styles.heroTitle}>누가 들어왔고 누가 말하는지 보여줘요</Text>
          <Text style={styles.heroText}>
            참여자 목록, 마이크 상태, 현재 발언자를 확인하면서 음성 토론을 진행할 수 있습니다.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.currentSpeakerCard}>
          <Text style={styles.currentSpeakerLabel}>현재 발언자</Text>

          {currentSpeakerName ? (
            <>
              <Text style={styles.currentSpeakerName}>{currentSpeakerName}</Text>
              <Text style={styles.currentSpeakerText}>
                지금 발언 중이거나 녹음/재생 중입니다.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.currentSpeakerName}>대기 중</Text>
              <Text style={styles.currentSpeakerText}>
                아직 말하고 있는 사람이 없습니다.
              </Text>
            </>
          )}
        </View>

        <View style={styles.participantsCard}>
          <View style={styles.participantsTopRow}>
            <View>
              <Text style={styles.participantsLabel}>참여자</Text>
              <Text style={styles.participantsTitle}>
                {participants.length}명 입장
              </Text>
            </View>

            <View style={voiceConnected ? styles.connectedBadge : styles.disconnectedBadge}>
              <Text style={voiceConnected ? styles.connectedText : styles.disconnectedText}>
                {voiceConnected ? '내가 입장 중' : '미입장'}
              </Text>
            </View>
          </View>

          {participants.length === 0 ? (
            <View style={styles.emptyParticipantBox}>
              <Text style={styles.emptyParticipantTitle}>아직 입장한 사람이 없어요</Text>
              <Text style={styles.emptyParticipantText}>
                음성방 입장 버튼을 누르면 내 이름이 참여자 목록에 표시됩니다.
              </Text>
            </View>
          ) : (
            participants.map((participant) => (
              <View
                key={participant.id}
                style={[
                  styles.participantItem,
                  participant.isSpeaking && styles.participantSpeakingItem,
                ]}
              >
                <View
                  style={[
                    styles.participantAvatar,
                    participant.isSpeaking && styles.participantAvatarSpeaking,
                  ]}
                >
                  <Text style={styles.participantAvatarText}>
                    {getParticipantInitial(participant.name)}
                  </Text>
                </View>

                <View style={styles.participantInfo}>
                  <View style={styles.participantNameRow}>
                    <Text style={styles.participantName} numberOfLines={1}>
                      {participant.name}
                    </Text>

                    {participant.isMe ? (
                      <View style={styles.meBadge}>
                        <Text style={styles.meBadgeText}>나</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.participantStatus}>
                    {participant.isSpeaking
                      ? '발언 중'
                      : participant.micOn
                        ? '마이크 켜짐'
                        : '듣는 중'}
                  </Text>
                </View>

                <View style={participant.micOn ? styles.micOnMiniBadge : styles.micOffMiniBadge}>
                  <Text style={participant.micOn ? styles.micOnMiniText : styles.micOffMiniText}>
                    {participant.micOn ? 'ON' : 'OFF'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.liveSessionCard}>
          <Text style={styles.liveSessionLabel}>실시간 음성방</Text>
          <Text style={styles.liveSessionTitle}>
            {voiceConnected ? '음성방 입장 중' : '음성방 대기 중'}
          </Text>
          <Text style={styles.liveSessionText}>{voiceModeMessage}</Text>

          <View style={styles.liveStatusRow}>
            <View style={voiceConnected ? styles.connectedBadge : styles.disconnectedBadge}>
              <Text style={voiceConnected ? styles.connectedText : styles.disconnectedText}>
                {voiceConnected ? '연결됨' : '미연결'}
              </Text>
            </View>

            <View style={liveMicOn ? styles.micOnBadge : styles.micOffBadge}>
              <Text style={liveMicOn ? styles.micOnText : styles.micOffText}>
                {liveMicOn ? '마이크 ON' : '마이크 OFF'}
              </Text>
            </View>
          </View>

          <View style={styles.liveActionRow}>
            <Pressable
              style={[styles.liveJoinButton, sessionLoading && styles.disabledButton]}
              onPress={voiceConnected ? leaveLiveVoiceSession : connectVoiceSession}
              disabled={sessionLoading}
            >
              <Text style={styles.liveJoinButtonText}>
                {sessionLoading
                  ? '처리 중'
                  : voiceConnected
                    ? '음성방 나가기'
                    : '음성방 입장'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.liveMicButton,
                liveMicOn && styles.liveMicButtonOn,
                !voiceConnected && styles.disabledButton,
              ]}
              onPress={toggleLiveMic}
              disabled={!voiceConnected}
            >
              <Text style={liveMicOn ? styles.liveMicButtonTextOn : styles.liveMicButtonText}>
                {liveMicOn ? '마이크 끄기' : '마이크 켜기'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View>
            <Text style={styles.statusLabel}>녹음 상태</Text>
            <Text style={styles.statusTitle}>
              {isRecording ? '발언 녹음 중' : playingNoteId ? '음성 재생 중' : '대기 중'}
            </Text>
            <Text style={styles.statusText}>
              {isRecording
                ? `녹음 시간 ${formatTime(recordSeconds)}`
                : loadingRoom
                  ? '방 정보를 불러오는 중입니다.'
                  : playingNoteId
                    ? '녹음된 발언을 재생하고 있습니다.'
                    : '마이크 버튼을 눌러 발언을 기록하세요.'}
            </Text>
          </View>

          <View style={isRecording || playingNoteId ? styles.liveDot : styles.waitDot} />
        </View>

        <View style={styles.micBox}>
          <Pressable
            style={isRecording ? styles.stopMicButton : styles.startMicButton}
            onPress={toggleRecording}
          >
            <Text style={styles.micIcon}>{isRecording ? '■' : '🎙️'}</Text>
            <Text style={isRecording ? styles.stopMicText : styles.startMicText}>
              {isRecording ? '녹음 종료' : '녹음 시작'}
            </Text>
          </Pressable>

          <Text style={styles.micGuide}>
            위쪽은 실시간 음성방 테스트 모드이고, 이 버튼은 발언을 녹음/재생하는 기능입니다.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>음성 발언 메모</Text>

        <TextInput
          style={styles.memoInput}
          placeholder="방금 말한 내용을 간단히 적어주세요."
          placeholderTextColor="#777"
          value={memo}
          onChangeText={setMemo}
          multiline
        />

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.saveButton, savingMemo && styles.disabledButton]}
            onPress={saveVoiceMemo}
            disabled={savingMemo}
          >
            <Text style={styles.saveButtonText}>
              {savingMemo ? '저장 중' : '메모 저장'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.aiButton, askingAi && styles.disabledButton]}
            onPress={callAiModerator}
            disabled={askingAi}
          >
            <Text style={styles.aiButtonText}>
              {askingAi ? 'AI 분석 중' : 'AI 중재자 호출'}
            </Text>
          </Pressable>
        </View>

        {lastAudioUri ? (
          <View style={styles.audioCard}>
            <Text style={styles.audioTitle}>최근 녹음 완료</Text>
            <Text style={styles.audioText}>
              아래 발언 기록에서 재생할 수 있습니다.
            </Text>
          </View>
        ) : null}

        {aiAdvice ? (
          <View style={styles.aiResultCard}>
            <Text style={styles.aiResultTitle}>AI 토론 중재자</Text>
            <Text style={styles.aiResultText}>{aiAdvice}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>발언 기록</Text>

        {voiceNotes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>아직 발언 기록이 없어요</Text>
            <Text style={styles.emptyText}>
              녹음 시작 버튼을 누르고 발언한 뒤 재생 버튼으로 다시 들어보세요.
            </Text>
          </View>
        ) : (
          voiceNotes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteTopRow}>
                <Text style={styles.noteUser}>{note.userName}</Text>
                <Text style={styles.noteTime}>
                  {new Date(note.createdAt).toLocaleTimeString()}
                </Text>
              </View>

              <Text style={styles.noteText}>{note.text}</Text>

              {note.audioUri ? (
                <Pressable
                  style={[
                    styles.playButton,
                    playingNoteId === note.id && styles.stopPlayButton,
                    playingLoading && styles.disabledButton,
                  ]}
                  onPress={() => playVoiceNote(note)}
                  disabled={playingLoading}
                >
                  <Text
                    style={[
                      styles.playButtonText,
                      playingNoteId === note.id && styles.stopPlayButtonText,
                    ]}
                  >
                    {playingNoteId === note.id ? '정지' : '녹음 재생'}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.noteAudio}>녹음 파일 없음</Text>
              )}
            </View>
          ))
        )}

        <View style={styles.endCard}>
          <Text style={styles.endTitle}>토론을 마쳤나요?</Text>
          <Text style={styles.endText}>
            음성 토론이 끝나면 AI 요약 화면으로 이동해 전체 토론을 정리할 수 있습니다.
          </Text>

          <Pressable style={styles.endButton} onPress={endVoiceDebate}>
            <Text style={styles.endButtonText}>AI 요약 화면으로 이동</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
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
    fontSize: 18,
    fontWeight: '900',
  },
  headerSub: {
    color: BRAND.black,
    fontSize: 11,
    marginTop: 3,
  },
  more: {
    color: BRAND.black,
    fontSize: 30,
    fontWeight: '900',
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 70,
  },
  brandBox: {
    marginBottom: 24,
  },
  logo: {
    color: BRAND.black,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 11,
  },
  slogan: {
    marginTop: 8,
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  heroCard: {
    borderRadius: 26,
    backgroundColor: BRAND.blue,
    padding: 24,
  },
  heroLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  heroTitle: {
    color: BRAND.white,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 10,
    lineHeight: 36,
  },
  heroText: {
    color: BRAND.white,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
  },
  noticeCard: {
    marginTop: 18,
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
  currentSpeakerCard: {
    marginTop: 22,
    borderRadius: 22,
    backgroundColor: BRAND.yellow,
    padding: 20,
  },
  currentSpeakerLabel: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  currentSpeakerName: {
    color: BRAND.black,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 8,
  },
  currentSpeakerText: {
    color: BRAND.black,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  participantsCard: {
    marginTop: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
  },
  participantsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantsLabel: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  participantsTitle: {
    color: BRAND.black,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 5,
  },
  emptyParticipantBox: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
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
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantSpeakingItem: {
    borderColor: BRAND.blue,
    borderWidth: 2,
    backgroundColor: '#F7FAFF',
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarSpeaking: {
    backgroundColor: BRAND.blue,
  },
  participantAvatarText: {
    color: BRAND.white,
    fontSize: 20,
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
    maxWidth: 150,
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
  participantStatus: {
    color: BRAND.black,
    fontSize: 12,
    marginTop: 5,
    fontWeight: '700',
  },
  micOnMiniBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.blue,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  micOffMiniBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  micOnMiniText: {
    color: BRAND.white,
    fontSize: 11,
    fontWeight: '900',
  },
  micOffMiniText: {
    color: BRAND.black,
    fontSize: 11,
    fontWeight: '900',
  },
  liveSessionCard: {
    marginTop: 22,
    borderRadius: 22,
    backgroundColor: BRAND.black,
    padding: 20,
  },
  liveSessionLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  liveSessionTitle: {
    color: BRAND.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
  },
  liveSessionText: {
    color: BRAND.white,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  liveStatusRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  connectedBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  disconnectedBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  connectedText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  disconnectedText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  micOnBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.blue,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  micOffBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  micOnText: {
    color: BRAND.white,
    fontSize: 12,
    fontWeight: '900',
  },
  micOffText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  liveActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  liveJoinButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveJoinButtonText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '900',
  },
  liveMicButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveMicButtonOn: {
    backgroundColor: BRAND.white,
  },
  liveMicButtonText: {
    color: BRAND.black,
    fontSize: 14,
    fontWeight: '900',
  },
  liveMicButtonTextOn: {
    color: BRAND.black,
    fontSize: 14,
    fontWeight: '900',
  },
  statusCard: {
    marginTop: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  statusTitle: {
    color: BRAND.black,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  statusText: {
    color: BRAND.black,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 250,
  },
  liveDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BRAND.yellow,
  },
  waitDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BRAND.line,
  },
  micBox: {
    marginTop: 22,
    alignItems: 'center',
  },
  startMicButton: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopMicButton: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  startMicText: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  stopMicText: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '900',
  },
  micGuide: {
    color: BRAND.black,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
  },
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 30,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  memoInput: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 16,
    paddingTop: 16,
    color: BRAND.black,
    fontSize: 15,
    backgroundColor: BRAND.white,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '900',
  },
  aiButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
  },
  audioCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    padding: 16,
  },
  audioTitle: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  audioText: {
    color: BRAND.black,
    fontSize: 12,
    marginTop: 6,
  },
  aiResultCard: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: BRAND.yellow,
    padding: 18,
  },
  aiResultTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  aiResultText: {
    color: BRAND.black,
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
  },
  emptyTitle: {
    color: BRAND.black,
    fontSize: 17,
    fontWeight: '900',
  },
  emptyText: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  noteCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    marginBottom: 12,
  },
  noteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteUser: {
    color: BRAND.blue,
    fontSize: 14,
    fontWeight: '900',
  },
  noteTime: {
    color: '#777',
    fontSize: 12,
    fontWeight: '700',
  },
  noteText: {
    color: BRAND.black,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
  },
  noteAudio: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
  },
  playButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 14,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopPlayButton: {
    backgroundColor: BRAND.black,
  },
  playButtonText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '900',
  },
  stopPlayButtonText: {
    color: BRAND.white,
  },
  endCard: {
    marginTop: 26,
    borderRadius: 22,
    backgroundColor: BRAND.blue,
    padding: 22,
  },
  endTitle: {
    color: BRAND.white,
    fontSize: 20,
    fontWeight: '900',
  },
  endText: {
    color: BRAND.white,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
  },
  endButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '900',
  },
});