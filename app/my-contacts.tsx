import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';

type Contact = {
  _id?: string;
  category?: string;
  title?: string;
  content?: string;
  status?: string;
  adminMemo?: string;
  createdAt?: string;
};

export default function MyContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  const loadContacts = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setMessage('');

      const savedUser = await AsyncStorage.getItem('clach_user');

      if (!savedUser) {
        setContacts([]);
        setMessage('로그인 정보가 없습니다. 다시 로그인해주세요.');
        return;
      }

      const user = JSON.parse(savedUser);
      const email = user.email || '';
      const baseUrl = getBaseUrl();

      const urls = [
        `${baseUrl}/api/my-contacts?userEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/my-contacts?userEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/api/contacts/my?userEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/contacts/my?userEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/api/contacts?userEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/contacts?userEmail=${encodeURIComponent(email)}`,
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url);
          const data = await safeJson(response);

          if (response.ok) {
            if (Array.isArray(data)) {
              setContacts(data);
              return;
            }

            if (Array.isArray(data?.contacts)) {
              setContacts(data.contacts);
              return;
            }

            if (Array.isArray(data?.data)) {
              setContacts(data.data);
              return;
            }
          }
        } catch {
          continue;
        }
      }

      setContacts([]);
      setMessage('문의 내역을 불러오지 못했어요.');
    } catch {
      setContacts([]);
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>내 문의 내역</Text>

          <Pressable style={styles.headerButton} onPress={loadContacts}>
            <Text style={styles.refresh}>{loading ? '…' : '↻'}</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>SUPPORT HISTORY</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>문의</Text>
          <Text style={styles.heroTitle}>내 문의 내역</Text>
          <Text style={styles.heroText}>
            내가 보낸 문의와 처리 상태를 확인할 수 있습니다.
          </Text>
        </View>

        <Pressable style={styles.writeButton} onPress={() => router.push('/support' as any)}>
          <Text style={styles.writeButtonText}>새 문의 작성하기</Text>
        </Pressable>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>문의 목록</Text>

        {contacts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>?</Text>
            </View>

            <Text style={styles.emptyTitle}>아직 문의 내역이 없어요</Text>
            <Text style={styles.emptyText}>
              오류나 계정 문제가 있으면 문의를 보내주세요.
            </Text>
          </View>
        ) : (
          contacts.map((item, index) => (
            <View key={item._id || String(index)} style={styles.contactCard}>
              <View style={styles.cardTop}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category || '문의'}</Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status || '접수'}</Text>
                </View>
              </View>

              <Text style={styles.contactTitle}>{item.title || '제목 없음'}</Text>

              <Text style={styles.contactContent} numberOfLines={4}>
                {item.content || '내용 없음'}
              </Text>

              {item.adminMemo ? (
                <View style={styles.memoBox}>
                  <Text style={styles.memoLabel}>관리자 답변</Text>
                  <Text style={styles.memoText}>{item.adminMemo}</Text>
                </View>
              ) : (
                <View style={styles.waitBox}>
                  <Text style={styles.waitText}>답변 대기 중</Text>
                </View>
              )}
            </View>
          ))
        )}

        <Pressable style={styles.blueButton} onPress={loadContacts}>
          <Text style={styles.blueButtonText}>
            {loading ? '불러오는 중...' : '내역 새로고침'}
          </Text>
        </Pressable>

        <Pressable style={styles.blackButton} onPress={() => router.push('/support' as any)}>
          <Text style={styles.blackButtonText}>새 문의 작성하기</Text>
        </Pressable>

        <Pressable style={styles.outlineButton} onPress={() => router.back()}>
          <Text style={styles.outlineText}>돌아가기</Text>
        </Pressable>

        <Pressable style={styles.homeButton} onPress={() => router.replace('/home' as any)}>
          <Text style={styles.homeButtonText}>홈으로 이동</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navButton} onPress={() => router.replace('/home' as any)}>
          <Text style={styles.navItem}>홈</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={() => router.push('/room-list' as any)}>
          <Text style={styles.navItem}>탐색</Text>
        </Pressable>

        <Pressable style={styles.plusButton} onPress={() => router.push('/create-room' as any)}>
          <Text style={styles.navPlus}>＋</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={() => router.push('/profile' as any)}>
          <Text style={styles.navItem}>프로필</Text>
        </Pressable>
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
    paddingBottom: 130,
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
  refresh: {
    color: BRAND.blue,
    fontSize: 26,
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
    fontSize: 30,
    fontWeight: '900',
    marginTop: 10,
  },
  heroText: {
    color: BRAND.white,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
  },
  writeButton: {
    marginTop: 18,
    height: 58,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
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
  sectionTitle: {
    color: BRAND.blue,
    marginTop: 32,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 22,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIconText: {
    color: BRAND.black,
    fontSize: 28,
    fontWeight: '900',
  },
  emptyTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: BRAND.black,
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
  },
  contactCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: BRAND.yellow,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryText: {
    color: BRAND.black,
    fontSize: 12,
    fontWeight: '900',
  },
  statusBadge: {
    backgroundColor: BRAND.blue,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusText: {
    color: BRAND.white,
    fontSize: 12,
    fontWeight: '900',
  },
  contactTitle: {
    color: BRAND.black,
    fontSize: 18,
    fontWeight: '900',
  },
  contactContent: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  memoBox: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    padding: 14,
  },
  memoLabel: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  memoText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 20,
  },
  waitBox: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.black,
    padding: 14,
  },
  waitText: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
  },
  blueButton: {
    marginTop: 28,
    height: 58,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  blackButton: {
    marginTop: 14,
    height: 58,
    borderRadius: 16,
    backgroundColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackButtonText: {
    color: BRAND.white,
    fontSize: 15,
    fontWeight: '900',
  },
  outlineButton: {
    marginTop: 14,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  homeButton: {
    marginTop: 14,
    height: 56,
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: BRAND.black,
    fontSize: 15,
    fontWeight: '900',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 92,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    backgroundColor: BRAND.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 18,
  },
  navButton: {
    flex: 1,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    flex: 1,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItem: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '700',
  },
  navPlus: {
    color: BRAND.black,
    fontSize: 30,
    fontWeight: '900',
  },
});