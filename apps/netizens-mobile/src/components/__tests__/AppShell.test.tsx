import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { AppShell, PRIMARY_TABS } from '../AppShell';
import { motionDurationMs } from '../../theme/tokens';

describe('NETIZENS AppShell', () => {
  test('defines the five primary mobile destinations with World first', () => {
    expect(PRIMARY_TABS.map((tab) => tab.key)).toEqual([
      'world',
      'search',
      'messages',
      'notifications',
      'profile',
    ]);
    expect(PRIMARY_TABS[0]?.href).toBe('/world');
    expect(PRIMARY_TABS.every((tab) => tab.accessibilityLabel.length > 0)).toBe(true);
  });

  test('renders structural depth and screen content', () => {
    render(
      <AppShell title="Crews" breadcrumb={['World', 'Crews']}>
        <Text>Campus and community groups</Text>
      </AppShell>,
    );

    expect(screen.getByText('Crews')).toBeTruthy();
    expect(screen.getByText('World / Crews')).toBeTruthy();
    expect(screen.getByText('Campus and community groups')).toBeTruthy();
  });

  test('removes nonessential transition time when reduced motion is enabled', () => {
    expect(motionDurationMs(false)).toBeGreaterThan(0);
    expect(motionDurationMs(true)).toBe(0);
  });
});
