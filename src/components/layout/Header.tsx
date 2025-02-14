import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';

export default function Header() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <BlurView intensity={80} style={styles.header}>
      <TouchableOpacity 
        onPress={() => navigation.openDrawer()}
        style={styles.menuButton}
      >
        <Ionicons name="menu" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.rightButtons}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuButton: {
    padding: 8,
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 8,
  }
}); 