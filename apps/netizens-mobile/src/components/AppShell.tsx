import type { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme/tokens';

export type PrimaryTab = {
  key: 'world' | 'search' | 'messages' | 'notifications' | 'profile';
  label: string;
  href: '/world' | '/search' | '/messages' | '/notifications' | '/profile';
  accessibilityLabel: string;
};

export const PRIMARY_TABS: readonly PrimaryTab[] = [
  { key: 'world', label: 'World', href: '/world', accessibilityLabel: 'Open World' },
  { key: 'search', label: 'Search', href: '/search', accessibilityLabel: 'Open Search' },
  { key: 'messages', label: 'Messages', href: '/messages', accessibilityLabel: 'Open Messages' },
  { key: 'notifications', label: 'Notifications', href: '/notifications', accessibilityLabel: 'Open Notifications' },
  { key: 'profile', label: 'Profile', href: '/profile', accessibilityLabel: 'Open Profile' },
] as const;

type AppShellProps = {
  title: string;
  breadcrumb?: readonly string[];
  children: ReactNode;
};

export function AppShell({ title, breadcrumb = [], children }: AppShellProps) {
  const depthLabel = breadcrumb.join(' / ');

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        {depthLabel ? <Text style={styles.breadcrumb}>{depthLabel}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  breadcrumb: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
});
