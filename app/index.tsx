import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND } from '../constants/brand';

export default function IndexScreen() {
  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('clach_user');

      setTimeout(() => {
        if (savedUser) {
          router.replace('/home' as any);
        }
      }, 700);
    } catch (err) {
      console.log('자동 로그인 확인 실패:', err);
    }
  };

  return (
    <View style={styles.safe}>
      <View style={styles.logoMark}>
        <View style={styles.yellowShapeOne} />
        <View style={styles.yellowShapeTwo} />
      </View>

      <Text style={styles.logo}>CLACH</Text>
      <Text style={styles.slogan}>DEBATE. CHALLENGE. GROW.</Text>

      <View style={styles.heroBox}>
        <Text style={styles.heroTitle}>생각이 부딪히고,</Text>
        <Text style={styles.heroBlue}>더 나은 결론으로.</Text>

        <Text style={styles.heroText}>
          실시간 토론, AI 요약, 랭킹으로 더 똑똑하게 토론하세요.
        </Text>
      </View>

      <View style={styles.featureRow}>
        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>AI</Text>
          <Text style={styles.featureText}>AI 요약</Text>
        </View>

        <View style={styles.featureCardYellow}>
          <Text style={styles.featureIconBlack}>◎</Text>
          <Text style={styles.featureTextBlack}>실시간 토론</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>#</Text>
          <Text style={styles.featureText}>랭킹</Text>
        </View>
      </View>

      <ActivityIndicator color={BRAND.blue} style={styles.loading} />

      <Pressable style={styles.loginButton} onPress={() => router.replace('/login')}>
        <Text style={styles.loginButtonText}>시작하기</Text>
      </Pressable>

      <Pressable style={styles.signupButton} onPress={() => router.push('/signup')}>
        <Text style={styles.signupButtonText}>회원가입</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.white,
    paddingHorizontal: 28,
    paddingTop: 110,
    paddingBottom: 46,
    alignItems: 'center',
  },
  logoMark: {
    width: 110,
    height: 80,
    marginBottom: 28,
    position: 'relative',
  },
  yellowShapeOne: {
    position: 'absolute',
    width: 82,
    height: 28,
    backgroundColor: BRAND.yellow,
    transform: [{ rotate: '-45deg' }],
    top: 15,
    left: 10,
  },
  yellowShapeTwo: {
    position: 'absolute',
    width: 55,
    height: 28,
    backgroundColor: BRAND.yellow,
    transform: [{ rotate: '-45deg' }],
    top: 48,
    left: 48,
  },
  logo: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 14,
    color: BRAND.black,
  },
  slogan: {
    marginTop: 10,
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 4,
  },
  heroBox: {
    marginTop: 70,
    alignSelf: 'stretch',
  },
  heroTitle: {
    color: BRAND.black,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 42,
  },
  heroBlue: {
    color: BRAND.blue,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 42,
  },
  heroText: {
    color: BRAND.black,
    marginTop: 16,
    fontSize: 15,
    lineHeight: 23,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 36,
    alignSelf: 'stretch',
  },
  featureCard: {
    flex: 1,
    minHeight: 100,
    borderRadius: 18,
    backgroundColor: BRAND.blue,
    padding: 14,
    justifyContent: 'space-between',
  },
  featureCardYellow: {
    flex: 1,
    minHeight: 100,
    borderRadius: 18,
    backgroundColor: BRAND.yellow,
    padding: 14,
    justifyContent: 'space-between',
  },
  featureIcon: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '900',
  },
  featureIconBlack: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  featureText: {
    color: BRAND.white,
    fontSize: 13,
    fontWeight: '900',
  },
  featureTextBlack: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
  },
  loading: {
    marginTop: 34,
  },
  loginButton: {
    marginTop: 'auto',
    height: 60,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '900',
  },
  signupButton: {
    marginTop: 14,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.black,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
});