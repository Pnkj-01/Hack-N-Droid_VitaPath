import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { useAppAuth } from '../services/auth';

export function UserAvatar() {
  const { user } = useAppAuth();

  return (
    <Image
      source={
        user?.avatar_url
          ? { uri: user.avatar_url }
          : require('../assets/default.png')
      }
      style={styles.image}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e1e1e1',
  }
});