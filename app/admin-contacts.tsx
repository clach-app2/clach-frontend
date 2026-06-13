import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { BRAND } from '../constants/brand';
import { SERVER_URL } from '../constants/config';

type Contact = {
  _id?: string;
  category?: string;
  title?: string;
  content?: string;
  userName?: string;
  userEmail?: string;
  status?: string;
  adminMemo?: string;
  createdAt?: string;
};

export default function AdminContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [adminEmail, setAdminEmail] = useState('');
  const [memoText, setMemoText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAdmin();
  }, []);

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

  const loadAdmin = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('clach_user');

      if (!savedUser) {
        setMessage('로그인 정보가 없습니다. 다시 로그인해주세요.');
        return;
      }

      const user = JSON.parse(savedUser);
      const email = user.email || '';

      setAdminEmail(email);
      loadContacts(email);
    } catch {
      setMessage('관리자 정보를 불러오지 못했어요.');
    }
  };

  const loadContacts = async (email = adminEmail) => {
    if (loading) return;

    if (!email) {
      setMessage('관리자 이메일을 찾을 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const baseUrl = getBaseUrl();

      const urls = [
        `${baseUrl}/api/contacts?adminEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/contacts?adminEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/api/admin/contacts?adminEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/admin/contacts?adminEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/api/contact?adminEmail=${encodeURIComponent(email)}`,
        `${baseUrl}/contact?adminEmail=${encodeURIComponent(email)}`,
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
      setMessage('문의 목록 API를 찾지 못했어요. 서버 코드를 확인해야 합니다.');
    } catch {
      setContacts([]);
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async (contactId: string, status: string) => {
    try {
      setLoading(true);
      setMessage('');

      const baseUrl = getBaseUrl();

      const bodyData = {
        adminEmail,
        status,
        adminMemo: memoText.trim(),
      };

      const urls = [
        `${baseUrl}/api/contacts/${contactId}/status`,
        `${baseUrl}/contacts/${contactId}/status`,
        `${baseUrl}/api/admin/contacts/${contactId}/status`,
        `${baseUrl}/admin/contacts/${contactId}/status`,
        `${baseUrl}/api/contact/${contactId}/status`,
        `${baseUrl}/contact/${contactId}/status`,
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData),
          });

          const data = await safeJson(response);

          if (response.ok) {
            setMemoText('');
            Alert.alert('완료', data?.message || '문의 상태가 변경되었습니다.');
            loadContacts();
            return;
          }

          if (typeof data === 'object' && data?.message) {
            setMessage(data.message);
          }
        } catch {
          continue;
        }
      }

      setMessage('문의 상태 변경 API를 찾지 못했어요.');
    } catch {
      setMessage('서버 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const addTestContact = () => {
    const testContact: Contact = {
      _id: Date.now().toString(),
      category: '테스트',
      title: '테스트 문의입니다',
      content: '관리자 문의 관리 화면 테스트용 문의 내용입니다.',
      userName: '테스트 사용자',
      userEmail: 'test@clach.app',
      status: '접수',
      adminMemo: '',
    };

    setContacts((prev) => [testContact, ...prev]);
    setMessage('화면 테스트용 문의가 추가되었습니다.');
  };

  const clearMemo = () => {
    setMemoText('');
    setMessage('관리자 메모가 지워졌습니다.');
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>관리자 문의 관리</Text>

          <Pressable style={styles.headerButton} onPress={() => loadContacts()}>
            <Text style={styles.refresh}>{loading ? '…' : '↻'}</Text>
          </Pressable>
        </View>

        <View style={styles.brandBox}>
          <Text style={styles.logo}>CLACH</Text>
          <Text style={styles.slogan}>ADMIN SUPPORT CENTER</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>관리자</Text>
          <Text style={styles.heroTitle}>문의 관리</Text>
          <Text style={styles.heroText}>
            사용자가 보낸 문의를 확인하고 상태와 관리자 메모를 남길 수 있습니다.
          </Text>
        </View>

        {message ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>안내</Text>
            <Text style={styles.noticeText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.adminCard}>
          <Text style={styles.adminLabel}>관리자 이메일</Text>
          <Text style={styles.adminEmail}>{adminEmail || '이메일 없음'}</Text>
        </View>

        <Text style={styles.label}>관리자 메모</Text>

        <TextInput
          style={styles.memoInput}
          placeholder="처리 내용 또는 답변 메모를 입력하세요."
          placeholderTextColor="#777"
          value={memoText}
          onChangeText={setMemoText}
          multiline
        />

        <View style={styles.memoButtonRow}>
          <Pressable style={styles.memoSmallButton} onPress={clearMemo}>
            <Text style={styles.memoSmallText}>메모 지우기</Text>
          </Pressable>

          <Pressable style={styles.memoSmallButton} onPress={addTestContact}>
            <Text style={styles.memoSmallText}>테스트 추가</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>문의 목록</Text>

        {contacts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>?</Text>
            </View>

            <Text style={styles.emptyTitle}>문의가 없어요</Text>
            <Text style={styles.emptyText}>
              접수된 문의가 있으면 여기에 표시됩니다.
            </Text>
          </View>
        ) : (
          contacts.map((contact, index) => (
            <View key={contact._id || String(index)} style={styles.contactCard}>
              <View style={styles.cardTop}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{contact.category || '문의'}</Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{contact.status || '접수'}</Text>
                </View>
              </View>

              <Text style={styles.contactTitle}>{contact.title || '제목 없음'}</Text>

              <Text style={styles.labelSmall}>사용자</Text>
              <Text style={styles.normalText}>
                {contact.userName || '익명'} · {contact.userEmail || '이메일 없음'}
              </Text>

              <Text style={styles.labelSmall}>문의 내용</Text>
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>
                  {contact.content || '문의 내용 없음'}
                </Text>
              </View>

              {contact.adminMemo ? (
                <View style={styles.memoBox}>
                  <Text style={styles.memoLabel}>기존 관리자 메모</Text>
                  <Text style={styles.memoText}>{contact.adminMemo}</Text>
                </View>
              ) : null}

              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.progressButton}
                  onPress={() =>
                    contact._id && updateContactStatus(contact._id, '처리중')
                  }
                >
                  <Text style={styles.progressText}>처리중</Text>
                </Pressable>

                <Pressable
                  style={styles.completeButton}
                  onPress={() =>
                    contact._id && updateContactStatus(contact._id, '처리완료')
                  }
                >
                  <Text style={styles.completeText}>처리완료</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Pressable style={styles.blueButton} onPress={() => loadContacts()}>
          <Text style={styles.blueButtonText}>
            {loading ? '불러오는 중...' : '문의 목록 새로고침'}
          </Text>
        </Pressable>

        <Pressable style={styles.blackButton} onPress={() => router.push('/settings' as any)}>
          <Text style={styles.blackButtonText}>설정으로 이동</Text>
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
  adminCard: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 18,
  },
  adminLabel: {
    color: BRAND.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  adminEmail: {
    color: BRAND.black,
    marginTop: 8,
    fontSize: 14,
    fontWeight: '800',
  },
  label: {
    color: BRAND.black,
    marginTop: 26,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '900',
  },
  memoInput: {
    minHeight: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 16,
    paddingTop: 16,
    color: BRAND.black,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  memoButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  memoSmallButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoSmallText: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
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
    gap: 8,
    marginBottom: 14,
  },
  categoryBadge: {
    flex: 1,
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
  labelSmall: {
    color: BRAND.blue,
    marginTop: 16,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  normalText: {
    color: BRAND.black,
    fontSize: 14,
    lineHeight: 21,
  },
  messageBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.black,
    padding: 14,
  },
  messageText: {
    color: BRAND.black,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  progressButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: BRAND.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: BRAND.black,
    fontSize: 13,
    fontWeight: '900',
  },
  completeButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeText: {
    color: BRAND.white,
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