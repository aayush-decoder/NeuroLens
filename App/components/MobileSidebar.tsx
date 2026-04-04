import { useRouter, usePathname } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { loadDocuments, loadProfile, type ReaderDocument } from '@/lib/adaptive-store';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Mobile sidebar drawer component similar to webapp's AppSidebar.
 * Can be shown/hidden with animated slide from the left.
 */
interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const [profile, setProfile] = useState({ name: 'Reader', email: 'reader@example.com' });
  const [documents, setDocuments] = useState<ReaderDocument[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['dashboard']));

  const sidebarX = useSharedValue(-300);

  useEffect(() => {
    sidebarX.value = withTiming(isOpen ? 0 : -300, {
      duration: 260,
      easing: Easing.out(Easing.quad),
    });
  }, [isOpen, sidebarX]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [savedProfile, savedDocs] = await Promise.all([loadProfile(), loadDocuments()]);
        setProfile(savedProfile);
        setDocuments(savedDocs);
      };
      void load();
    }, []),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sidebarX.value }],
  }));

  const handleNavigate = (route: string) => {
    router.push(route as any);
    onClose();
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const isActive = (route: string) => {
    if (route === '/(tabs)') return pathname === '/(tabs)' || pathname.startsWith('/(tabs)/index');
    return pathname.includes(route.replace('/(tabs)/', ''));
  };

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <Pressable
          style={[
            styles.overlay,
            isDark ? styles.overlayDark : null,
          ]}
          onPress={onClose}
        />
      )}

      {/* Sidebar panel */}
      <Animated.View
        style={[
          styles.sidebar,
          isDark ? styles.sidebarDark : null,
          animatedStyle,
          { paddingTop: Math.max(insets.top, 16) },
        ]}
        entering={isOpen ? FadeInLeft.duration(260) : undefined}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logo, isDark ? styles.logoDark : null]}>
              <Text style={styles.logoText}>EN</Text>
            </View>
            <View>
              <Text style={[styles.appName, isDark ? styles.appNameDark : null]}>
                NeuroLens
              </Text>
              <Text style={[styles.appSub, isDark ? styles.appSubDark : null]}>
                Adaptive Reader
              </Text>
            </View>
          </View>

          {/* Navigation section */}
          <View style={styles.section}>
            <Pressable
              style={[
                styles.navButton,
                isDark ? styles.navButtonDark : null,
                isActive('/(tabs)') ? (isDark ? styles.navButtonActiveDark : styles.navButtonActive) : null,
              ]}
              onPress={() => handleNavigate('/(tabs)')}>
              <Text style={[styles.navIcon, isDark ? styles.navIconDark : null]}>🏠</Text>
              <Text style={[styles.navLabel, isDark ? styles.navLabelDark : null]}>Home</Text>
            </Pressable>

            <Pressable
              style={[
                styles.navButton,
                isDark ? styles.navButtonDark : null,
                isActive('reader') ? (isDark ? styles.navButtonActiveDark : styles.navButtonActive) : null,
              ]}
              onPress={() => handleNavigate('/(tabs)/reader')}>
              <Text style={[styles.navIcon, isDark ? styles.navIconDark : null]}>📖</Text>
              <Text style={[styles.navLabel, isDark ? styles.navLabelDark : null]}>Reader</Text>
            </Pressable>

            <Pressable
              style={[
                styles.navButton,
                isDark ? styles.navButtonDark : null,
                isActive('explore') ? (isDark ? styles.navButtonActiveDark : styles.navButtonActive) : null,
              ]}
              onPress={() => handleNavigate('/(tabs)/explore')}>
              <Text style={[styles.navIcon, isDark ? styles.navIconDark : null]}>📊</Text>
              <Text style={[styles.navLabel, isDark ? styles.navLabelDark : null]}>Dashboard</Text>
            </Pressable>

            <Pressable
              style={[
                styles.navButton,
                isDark ? styles.navButtonDark : null,
                isActive('profile') ? (isDark ? styles.navButtonActiveDark : styles.navButtonActive) : null,
              ]}
              onPress={() => handleNavigate('/(tabs)/profile')}>
              <Text style={[styles.navIcon, isDark ? styles.navIconDark : null]}>👤</Text>
              <Text style={[styles.navLabel, isDark ? styles.navLabelDark : null]}>Profile</Text>
            </Pressable>
          </View>

          {/* Folders section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
                Documents
              </Text>
              <Text style={[styles.documentCount, isDark ? styles.documentCountDark : null]}>
                {documents.length}
              </Text>
            </View>

            {documents.slice(0, 5).map((doc) => (
              <Pressable
                key={doc.id}
                style={[styles.docButton, isDark ? styles.docButtonDark : null]}
                onPress={() => {
                  handleNavigate('/(tabs)/reader');
                }}>
                <Text style={[styles.docIcon, isDark ? styles.docIconDark : null]}>📄</Text>
                <Text
                  style={[styles.docLabel, isDark ? styles.docLabelDark : null]}
                  numberOfLines={1}>
                  {doc.title}
                </Text>
              </Pressable>
            ))}

            {documents.length > 5 && (
              <Text style={[styles.docHint, isDark ? styles.docHintDark : null]}>
                +{documents.length - 5} more
              </Text>
            )}
          </View>

          {/* User profile section */}
          <View style={styles.section}>
            <View style={[styles.profileCard, isDark ? styles.profileCardDark : null]}>
              <View style={[styles.userAvatar, isDark ? styles.userAvatarDark : null]}>
                <Text style={styles.userInitial}>
                  {profile.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'R'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, isDark ? styles.userNameDark : null]}>
                  {profile.name}
                </Text>
                <Text style={[styles.userEmail, isDark ? styles.userEmailDark : null]}>
                  {profile.email}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer action */}
        <View
          style={[
            styles.footer,
            isDark ? styles.footerDark : null,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}>
          <Pressable
            style={[styles.importButton, isDark ? styles.importButtonDark : null]}
            onPress={() => {
              handleNavigate('/modal');
            }}>
            <Text style={styles.importButtonIcon}>➕</Text>
            <Text style={styles.importButtonText}>Import Document</Text>
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 998,
  },
  overlayDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    zIndex: 999,
    flexDirection: 'column',
  },
  sidebarDark: {
    backgroundColor: '#1A1F2E',
    borderRightColor: '#2D3748',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 8,
  },
  headerDark: {
    borderBottomColor: '#2D3748',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1A6C97',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoDark: {
    backgroundColor: '#2A5F87',
  },
  logoText: {
    color: '#EFF8FF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  appName: {
    color: '#122744',
    fontSize: 16,
    fontWeight: '800',
  },
  appNameDark: {
    color: '#E8F2FF',
  },
  appSub: {
    color: '#667A95',
    fontSize: 11,
    fontWeight: '500',
  },
  appSubDark: {
    color: '#9CB0CC',
  },
  section: {
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#34516E',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionTitleDark: {
    color: '#96ABC9',
  },
  documentCount: {
    color: '#4F6180',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#EFF4FB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  documentCountDark: {
    color: '#A8BCD8',
    backgroundColor: '#243244',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  navButtonDark: {
    backgroundColor: 'transparent',
  },
  navButtonActive: {
    backgroundColor: '#E2EEF7',
  },
  navButtonActiveDark: {
    backgroundColor: '#2D4A5E',
  },
  navIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  navIconDark: {
    color: '#C0D8FF',
  },
  navLabel: {
    flex: 1,
    color: '#2D3F59',
    fontSize: 14,
    fontWeight: '600',
  },
  navLabelDark: {
    color: '#D4E2F4',
  },
  docButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FC',
    marginHorizontal: 0,
  },
  docButtonDark: {
    backgroundColor: '#243244',
  },
  docIcon: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  docIconDark: {
    color: '#C0D8FF',
  },
  docLabel: {
    flex: 1,
    color: '#2D3F59',
    fontSize: 12,
    fontWeight: '500',
  },
  docLabelDark: {
    color: '#B8C6D8',
  },
  docHint: {
    color: '#718199',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  docHintDark: {
    color: '#96ABC9',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F0F5FB',
    borderWidth: 1,
    borderColor: '#D8E0EA',
  },
  profileCardDark: {
    backgroundColor: '#243244',
    borderColor: '#3D5A7A',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1A6C97',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarDark: {
    backgroundColor: '#2A5F87',
  },
  userInitial: {
    color: '#EFF8FF',
    fontSize: 12,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#122744',
    fontSize: 12,
    fontWeight: '700',
  },
  userNameDark: {
    color: '#E8F2FF',
  },
  userEmail: {
    color: '#667A95',
    fontSize: 10,
    fontWeight: '400',
  },
  userEmailDark: {
    color: '#98ADC6',
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerDark: {
    borderTopColor: '#2D3748',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1A6C97',
  },
  importButtonDark: {
    backgroundColor: '#2A5F87',
  },
  importButtonIcon: {
    fontSize: 16,
  },
  importButtonText: {
    color: '#EFF8FF',
    fontSize: 12,
    fontWeight: '700',
  },
});
