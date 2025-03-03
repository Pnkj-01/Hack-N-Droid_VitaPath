import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { UserAvatar } from '../UserAvatar';

interface HeaderProps {
  title?: string;
  route?: { name: string };
}

export function Header({ title, route }: HeaderProps) {
  const displayTitle = title || route?.name || 'SafeCity';

  return (
    <View style={[styles.container, Platform.OS === 'web' && styles.webContainer]}>
      <Text style={[styles.title, Platform.OS === 'web' && styles.webTitle]}>
        {displayTitle}
      </Text>
      <UserAvatar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  webContainer: {
    backgroundColor: '#1a73e8',
    height: 64,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  webTitle: {
    color: '#fff',
    fontSize: 24,
  }
});