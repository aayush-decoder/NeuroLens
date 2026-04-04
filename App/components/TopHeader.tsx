import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TopHeaderProps {
  title?: string;
  onMenuPress: () => void;
}

export default function TopHeader({ title = 'Adaptive Reader', onMenuPress }: TopHeaderProps) {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        isDark ? styles.headerDark : null,
        { paddingTop: Math.max(insets.top, 8) },
      ]}>
      <Pressable
        style={[styles.menuButton, isDark ? styles.menuButtonDark : null]}
        onPress={onMenuPress}
        hitSlop={8}>
        <Text style={styles.menuIcon}>☰</Text>
      </Pressable>

      <Text style={[styles.title, isDark ? styles.titleDark : null]}>{title}</Text>

      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerDark: {
    backgroundColor: '#0F141B',
    borderBottomColor: '#2D3748',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF4FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonDark: {
    backgroundColor: '#1A2431',
  },
  menuIcon: {
    fontSize: 20,
    color: '#1A6C97',
    fontWeight: '700',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#122744',
    fontSize: 16,
    fontWeight: '700',
  },
  titleDark: {
    color: '#E8F2FF',
  },
  placeholder: {
    width: 40,
  },
});
