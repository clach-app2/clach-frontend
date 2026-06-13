export const VOICE_CONFIG = {
  provider: 'agora',
  appId: '',
  useMockMode: true,
};

export const getVoiceModeText = () => {
  if (VOICE_CONFIG.useMockMode || !VOICE_CONFIG.appId) {
    return '현재는 테스트 음성 모드입니다. 실제 실시간 통화는 Agora App ID 연결 후 사용할 수 있습니다.';
  }

  return '실시간 음성통화 연결 준비 완료';
};