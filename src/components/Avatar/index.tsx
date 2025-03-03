import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { useAppAuth } from '../../hooks/useAppAuth';

export function Avatar() {
  const { user } = useAppAuth();

  return (
    <Image
      source={
        user?.avatar_url
          ? { uri: user.avatar_url }
          : require('../../assets/default.png')
      }
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e1e1e1',
  }
});