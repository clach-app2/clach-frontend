import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';
import BottomNav from '../components/BottomNav';

type User = {
  name?: string;
  nickname?: string;
  email?: string;
  isPremium?: boolean;
  aiUsageCount?: number;
  aiModeratorUsageCount?: number;
  aiUsageDate?: string;
};

export default function PremiumScreen() {
  const [user, setUser] = useState<User>({
    name: '토론가',
    email: '',
    isPremium: false,
    aiUsageCount: 0,
    aiModeratorUsageCount: 0,
    aiUsageDate: '',
  });

  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const FREE_SUMMARY_LIMIT = 2;
  const PREMIUM_SUMMARY_LIMIT = 20;

  const FREE_MODERATOR_LIMIT = 3;
  const PREMIUM_MODERATOR_LIMIT = 30;

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

 const loadUser = async () => {
  try {
    setMessage('');

    const savedUser = await AsyncStorage.getItem('clach_user');
    const premiumValue = await AsyncStorage.getItem('clach_premium');

    let localUser: User | null = null;

    if (savedUser) {
      localUser = JSON.parse(savedUser);

      const temporaryPremium =
        localUser?.isPremium === true || premiumValue === 'true';

      setUser({
        ...localUser,
        name:
          localUser?.name ||
          localUser?.nickname ||
          '토론가',
        email: localUser?.email || '',
        isPremium: temporaryPremium,
        aiUsageCount: Number(
          localUser?.aiUsageCount || 0
        ),
        aiModeratorUsageCount: Number(
          localUser?.aiModeratorUsageCount || 0
        ),
        aiUsageDate: localUser?.aiUsageDate || '',
      });

      setIsPremium(temporaryPremium);
    }

    const email = localUser?.email || '';

    if (!email) {
      setMessage(
        '로그인 정보를 찾지 못해 서버 사용량을 확인할 수 없습니다.'
      );
      return;
    }

    const baseUrl = getBaseUrl();
    const encodedEmail = encodeURIComponent(email);

    const urls = [
      `${baseUrl}/api/users/by-email/${encodedEmail}`,
      `${baseUrl}/users/by-email/${encodedEmail}`,
      `${baseUrl}/api/user/${encodedEmail}`,
      `${baseUrl}/user/${encodedEmail}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        const data = await safeJson(res);

        if (!res.ok) {
          continue;
        }

        const serverUser = data?.user || {};
        const summaryUsage = data?.usage?.summary;
        const moderatorUsage = data?.usage?.moderator;

        const nextUser: User = {
          ...localUser,
          ...serverUser,

          name:
            serverUser.name ||
            serverUser.nickname ||
            localUser?.name ||
            localUser?.nickname ||
            '토론가',

          nickname:
            serverUser.nickname ||
            serverUser.name ||
            localUser?.nickname ||
            localUser?.name ||
            '토론가',

          email:
            serverUser.email ||
            localUser?.email ||
            '',

          isPremium: serverUser.isPremium === true,

          aiUsageCount: Number(
            summaryUsage?.used ??
              serverUser.aiUsageCount ??
              0
          ),

          aiModeratorUsageCount: Number(
            moderatorUsage?.used ??
              serverUser.aiModeratorUsageCount ??
              0
          ),

          aiUsageDate:
            data?.usage?.date ||
            serverUser.aiUsageDate ||
            '',
        };

        setUser(nextUser);
        setIsPremium(nextUser.isPremium === true);

        await AsyncStorage.setItem(
          'clach_user',
          JSON.stringify(nextUser)
        );

        if (nextUser.isPremium === true) {
          await AsyncStorage.setItem(
            'clach_premium',
            'true'
          );
        } else {
          await AsyncStorage.removeItem(
            'clach_premium'
          );
        }

        return;
      } catch {
        continue;
      }
    }

    setMessage(
      '서버에서 최신 Premium 상태와 AI 사용량을 불러오지 못했습니다.'
    );
  } catch {
    setMessage('사용자 정보를 불러오지 못했습니다.');
  }
};

  const openPurchaseNotice = () => {
    Alert.alert(
      'CLACH Premium',
      'Apple 인앱결제와 Google Play 결제를 연결한 뒤 실제 구독 구매가 가능해집니다.',
      [
        {
          text: '확인',
        },
      ]
    );
  };

  const activateDevelopmentPremium = async () => {
    if (loading) return;

    if (!user.email) {
      Alert.alert(
        '로그인 필요',
        '프리미엄 테스트를 위해 로그인 정보가 필요합니다.'
      );
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const baseUrl = getBaseUrl();

      const urls = [
        `${baseUrl}/api/payment/premium`,
        `${baseUrl}/payment/premium`,
        `${baseUrl}/api/payments/premium`,
        `${baseUrl}/payments/premium`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              userEmail: user.email,
            }),
          });

          const data = await safeJson(res);

          if (!res.ok) {
            if (
              typeof data === 'object' &&
              data !== null &&
              data?.message
            ) {
              setMessage(data.message);
            }

            continue;
          }

          const nextUser: User = {
            ...user,
            ...(data?.user || {}),
            isPremium: true,
          };

          setUser(nextUser);
          setIsPremium(true);

          await AsyncStorage.setItem(
            'clach_user',
            JSON.stringify(nextUser)
          );

          await AsyncStorage.setItem('clach_premium', 'true');

          Alert.alert(
            '개발 테스트 완료',
            '개발 환경에서 Premium 상태가 활성화되었습니다.'
          );

          return;
        } catch {
          continue;
        }
      }

      setMessage('프리미엄 테스트 API를 찾지 못했습니다.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const deactivateDevelopmentPremium = async () => {
    const nextUser: User = {
      ...user,
      isPremium: false,
    };

    setUser(nextUser);
    setIsPremium(false);

    await AsyncStorage.setItem(
      'clach_user',
      JSON.stringify(nextUser)
    );

    await AsyncStorage.removeItem('clach_premium');

    Alert.alert(
      '테스트 해제',
      '이 기기의 개발용 Premium 표시가 해제되었습니다.'
    );
  };

  useEffect(() => {
    loadUser();
  }, []);

  const summaryUsed = Number(user.aiUsageCount || 0);
  const moderatorUsed = Number(user.aiModeratorUsageCount || 0);

  const summaryLimit = isPremium
    ? PREMIUM_SUMMARY_LIMIT
    : FREE_SUMMARY_LIMIT;

  const moderatorLimit = isPremium
    ? PREMIUM_MODERATOR_LIMIT
    : FREE_MODERATOR_LIMIT;

  const summaryRemain = Math.max(
    0,
    summaryLimit - summaryUsed
  );

  const moderatorRemain = Math.max(
    0,
    moderatorLimit - moderatorUsed
  );

  const summaryPercent = Math.min(
    100,
    Math.round((summaryUsed / summaryLimit) * 100)
  );

  const moderatorPercent = Math.min(
    100,
    Math.round((moderatorUsed / moderatorLimit) * 100)
  );

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>프리미엄</Text>

          <Pressable
            style={styles.headerButton}
            onPress={() => router.replace('/home' as any)}
          >
            <Text style={styles.homeText}>홈</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>KEEP THE DEBATE GOING</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>
            {isPremium ? 'PREMIUM ACTIVE' : 'CLACH PREMIUM'}
          </Text>

          <Text style={styles.heroTitle}>
            {isPremium
              ? '더 오래, 더 많이 토론하고 있어요'
              : '대화를 더 오래 이어가세요'}
          </Text>

          <Text style={styles.heroText}>
            무료 사용자도 AI 요약과 AI 중재자를 사용할 수 있습니다.
            Premium은 더 좋은 AI가 아니라 더 긴 토론 시간과 더 많은
            사용 횟수를 제공합니다.
          </Text>
        </View>

        <View style={styles.sameAiCard}>
          <Text style={styles.sameAiLabel}>SAME AI QUALITY</Text>
          <Text style={styles.sameAiTitle}>
            무료와 Premium의 AI 품질은 같습니다
          </Text>
          <Text style={styles.sameAiText}>
            누구나 같은 AI 요약과 중재자 기능을 사용할 수 있습니다.
            Premium은 사용 횟수와 토론 가능 시간을 늘려주는 플랜입니다.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>현재 플랜</Text>

        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanTextBox}>
            <Text style={styles.currentPlanLabel}>
              CURRENT PLAN
            </Text>

            <Text style={styles.currentPlanTitle}>
              {isPremium ? 'CLACH Premium' : 'CLACH Free'}
            </Text>

            <Text style={styles.currentPlanEmail}>
              {user.email || '로그인 정보 없음'}
            </Text>
          </View>

          <View
            style={
              isPremium
                ? styles.premiumCircle
                : styles.freeCircle
            }
          >
            <Text style={styles.circleText}>
              {isPremium ? 'PRO' : 'FREE'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>오늘 AI 사용량</Text>

        <UsageCard
          title="AI 요약"
          used={summaryUsed}
          limit={summaryLimit}
          remain={summaryRemain}
          percent={summaryPercent}
        />

        <UsageCard
          title="AI 중재자"
          used={moderatorUsed}
          limit={moderatorLimit}
          remain={moderatorRemain}
          percent={moderatorPercent}
        />

        <Text style={styles.sectionTitle}>무료와 Premium 비교</Text>

        <View style={styles.compareColumn}>
          <View style={styles.freePlanCard}>
            <View style={styles.planHeaderRow}>
              <View>
                <Text style={styles.freePlanLabel}>FREE</Text>
                <Text style={styles.freePlanPrice}>₩0</Text>
              </View>

              {!isPremium ? (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>현재 플랜</Text>
                </View>
              ) : null}
            </View>

            <PlanFeature
              title="토론방 시간"
              value="30분"
              dark={false}
            />

            <PlanFeature
              title="AI 요약"
              value="하루 2회"
              dark={false}
            />

            <PlanFeature
              title="AI 중재자"
              value="하루 3회"
              dark={false}
            />

            <PlanFeature
              title="시간 연장"
              value="사용 불가"
              dark={false}
            />

            <PlanFeature
              title="AI 품질"
              value="Premium과 동일"
              dark={false}
            />
          </View>

          <View style={styles.premiumPlanCard}>
            <View style={styles.planHeaderRow}>
              <View>
                <Text style={styles.premiumPlanLabel}>
                  PREMIUM
                </Text>

                <Text style={styles.premiumPlanPrice}>
                  월 구독
                </Text>
              </View>

              {isPremium ? (
                <View style={styles.premiumCurrentBadge}>
                  <Text style={styles.premiumCurrentText}>
                    사용 중
                  </Text>
                </View>
              ) : null}
            </View>

            <PlanFeature
              title="토론방 시간"
              value="최대 120분"
              dark
            />

            <PlanFeature
              title="AI 요약"
              value="하루 20회"
              dark
            />

            <PlanFeature
              title="AI 중재자"
              value="하루 30회"
              dark
            />

            <PlanFeature
              title="시간 연장"
              value="방마다 최대 6회"
              dark
            />

            <PlanFeature
              title="AI 품질"
              value="무료와 동일"
              dark
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Premium을 사용하는 이유
        </Text>

        <BenefitCard
          number="01"
          title="대화를 더 오래 이어가기"
          text="무료 토론방은 30분이지만 Premium은 최대 120분까지 설정할 수 있습니다."
        />

        <BenefitCard
          number="02"
          title="끝나기 전에 시간 연장하기"
          text="토론이 더 필요할 때 5분씩 시간을 연장해 대화를 이어갈 수 있습니다."
        />

        <BenefitCard
          number="03"
          title="AI 기능을 더 자주 사용하기"
          text="무료 사용자도 AI를 사용할 수 있으며, Premium은 하루 사용 가능 횟수가 더 많습니다."
        />

        <BenefitCard
          number="04"
          title="더 많은 토론을 진행하기"
          text="토론을 자주 진행하는 사용자가 사용량 제한 때문에 대화를 멈추지 않도록 도와줍니다."
        />

        {!isPremium ? (
          <Pressable
            style={styles.purchaseButton}
            onPress={openPurchaseNotice}
          >
            <Text style={styles.purchaseButtonText}>
              Premium 구독 준비 중
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.continueButton}
            onPress={() =>
              router.push('/room-list' as any)
            }
          >
            <Text style={styles.continueButtonText}>
              토론방으로 이동
            </Text>
          </Pressable>
        )}

        <Pressable
          style={styles.freeContinueButton}
          onPress={() =>
            router.push('/room-list' as any)
          }
        >
          <Text style={styles.freeContinueText}>
            무료로 계속 사용하기
          </Text>
        </Pressable>

        {__DEV__ ? (
          <View style={styles.developmentCard}>
            <Text style={styles.developmentLabel}>
              DEVELOPMENT ONLY
            </Text>

            <Text style={styles.developmentTitle}>
              개발 테스트용 Premium
            </Text>

            <Text style={styles.developmentText}>
              아래 버튼은 개발 환경에서만 표시됩니다. 실제 출시 앱에서는
              자동으로 숨겨집니다.
            </Text>

            {isPremium ? (
              <Pressable
                style={styles.developmentOffButton}
                onPress={deactivateDevelopmentPremium}
              >
                <Text style={styles.developmentOffText}>
                  테스트 Premium 해제
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.developmentOnButton,
                  loading && styles.disabledButton,
                ]}
                onPress={activateDevelopmentPremium}
                disabled={loading}
              >
                <Text style={styles.developmentOnText}>
                  {loading
                    ? '활성화 중...'
                    : '테스트 Premium 활성화'}
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            실제 출시 전 필요한 작업
          </Text>

          <Text style={styles.infoText}>
            Apple 인앱결제와 Google Play 결제를 연결하고, 구매 영수증을
            서버에서 확인한 뒤 Premium 상태를 활성화해야 합니다.
            계좌번호는 앱 코드에 입력하지 않습니다.
          </Text>
        </View>
      </ScrollView>

      <BottomNav active="profile" />
    </View>
  );
}

function UsageCard({
  title,
  used,
  limit,
  remain,
  percent,
}: {
  title: string;
  used: number;
  limit: number;
  remain: number;
  percent: number;
}) {
  return (
    <View style={styles.usageCard}>
      <View style={styles.usageTopRow}>
        <Text style={styles.usageTitle}>{title}</Text>

        <Text style={styles.usageCount}>
          {used}/{limit}
        </Text>
      </View>

      <View style={styles.usageBar}>
        <View
          style={[
            styles.usageFill,
            {
              width: `${percent}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.usageRemain}>
        오늘 {remain}회 더 사용할 수 있습니다.
      </Text>
    </View>
  );
}

function PlanFeature({
  title,
  value,
  dark,
}: {
  title: string;
  value: string;
  dark: boolean;
}) {
  return (
    <View style={styles.planFeatureRow}>
      <Text
        style={
          dark
            ? styles.planFeatureTitleDark
            : styles.planFeatureTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          dark
            ? styles.planFeatureValueDark
            : styles.planFeatureValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function BenefitCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.benefitCard}>
      <View style={styles.benefitNumber}>
        <Text style={styles.benefitNumberText}>{number}</Text>
      </View>

      <View style={styles.benefitTextBox}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  container: {
    paddingTop: 54,
    paddingHorizontal: 24,
    paddingBottom: 160,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 56,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    color: BRAND.black,
    fontSize: 42,
    fontWeight: '300',
  },
  headerTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  homeText: {
    color: BRAND.blue,
    fontSize: 14,
    fontWeight: '900',
  },
  brandBox: {
    marginTop: 28,
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
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
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
    fontSize: 29,
    fontWeight: '900',
    marginTop: 10,
    lineHeight: 37,
  },
  heroText: {
    color: BRAND.white,
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
  },
  sameAiCard: {
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: BRAND.yellow,
    padding: 20,
  },
  sameAiLabel: {
    color: BRAND.blue,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sameAiTitle: {
    color: BRAND.black,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
    lineHeight: 27,
  },
  sameAiText: {
    color: BRAND.black,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  noticeCard: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
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
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 30,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  currentPlanCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentPlanTextBox: {
    flex: 1,
    paddingRight: 12,
  },
  currentPlanLabel: {
    color: BRAND.blue,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  currentPlanTitle: {
    color: BRAND.black,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
  },
  currentPlanEmail: {
    color: BRAND.black,
    fontSize: 12,
    marginTop: 5,
  },
  premiumCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: BRAND.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  usageCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    marginBottom: 12,
  },
  usageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  usageCount: {
    color: BRAND.blue,
    fontSize: 16,
    fontWeight: '900',
  },
  usageBar: {
    height: 10,
    borderRadius: 999,
    backgroundColor: BRAND.line,
    overflow: 'hidden',
    marginTop: 14,
  },
  usageFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: BRAND.blue,
  },
  usageRemain: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  compareColumn: {
    gap: 14,
  },
  freePlanCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 20,
  },
  premiumPlanCard: {
    borderRadius: 22,
    backgroundColor: BRAND.black,
    padding: 20,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  freePlanLabel: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  freePlanPrice: {
    color: BRAND.black,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },
  premiumPlanLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  premiumPlanPrice: {
    color: BRAND.white,
    fontSize: 27,
    fontWeight: '900',
    marginTop: 6,
  },
  currentBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.yellow,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  currentBadgeText: {
    color: BRAND.black,
    fontSize: 11,
    fontWeight: '900',
  },
  premiumCurrentBadge: {
    borderRadius: 999,
    backgroundColor: BRAND.blue,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  premiumCurrentText: {
    color: BRAND.white,
    fontSize: 11,
    fontWeight: '900',
  },
  planFeatureRow: {
    minHeight: 46,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planFeatureTitle: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '700',
  },
  planFeatureValue: {
    color: BRAND.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  planFeatureTitleDark: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '700',
  },
  planFeatureValueDark: {
    color: BRAND.yellow,
    fontSize: 13,
    fontWeight: '900',
  },
  benefitCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
  },
  benefitNumber: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitNumberText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '900',
  },
  benefitTextBox: {
    flex: 1,
    marginLeft: 14,
  },
  benefitTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  benefitText: {
    color: BRAND.black,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  purchaseButton: {
    marginTop: 24,
    height: 60,
    borderRadius: 17,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '900',
  },
  continueButton: {
    marginTop: 24,
    height: 60,
    borderRadius: 17,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '900',
  },
  freeContinueButton: {
    marginTop: 12,
    height: 56,
    borderRadius: 17,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeContinueText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  developmentCard: {
    marginTop: 22,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BRAND.blue,
    padding: 18,
  },
  developmentLabel: {
    color: BRAND.blue,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  developmentTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },
  developmentText: {
    color: BRAND.black,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  developmentOnButton: {
    marginTop: 16,
    height: 52,
    borderRadius: 15,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  developmentOnText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '900',
  },
  developmentOffButton: {
    marginTop: 16,
    height: 52,
    borderRadius: 15,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  developmentOffText: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
  },
  infoCard: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#F2F2F2',
    padding: 18,
  },
  infoTitle: {
    color: BRAND.black,
    fontSize: 16,
    fontWeight: '900',
  },
  infoText: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
  },
});