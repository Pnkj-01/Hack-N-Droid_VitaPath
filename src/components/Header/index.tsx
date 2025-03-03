import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Avatar } from '../Avatar';

export function Header(props: NativeStackHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{props.route.name}</Text>
      <Avatar />
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
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  }
});