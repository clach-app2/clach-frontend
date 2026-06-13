import { VOICE_CONFIG } from '../constants/voiceConfig';

type JoinVoiceRoomParams = {
  roomId: string;
  userName: string;
};

export async function joinVoiceRoom({ roomId, userName }: JoinVoiceRoomParams) {
  if (!roomId) {
    return {
      ok: false,
      message: '토론방 ID가 없습니다.',
    };
  }

  if (VOICE_CONFIG.useMockMode || !VOICE_CONFIG.appId) {
    return {
      ok: true,
      mode: 'mock',
      message: `${userName}님이 테스트 음성 모드로 입장했습니다.`,
    };
  }

  return {
    ok: true,
    mode: 'agora',
    message: '실시간 음성방 연결 준비가 완료되었습니다.',
  };
}

export async function leaveVoiceRoom() {
  return {
    ok: true,
    message: '음성방에서 나갔습니다.',
  };
}

export async function toggleMic(currentValue: boolean) {
  return {
    ok: true,
    micOn: !currentValue,
    message: !currentValue ? '마이크가 켜졌습니다.' : '마이크가 꺼졌습니다.',
  };
}