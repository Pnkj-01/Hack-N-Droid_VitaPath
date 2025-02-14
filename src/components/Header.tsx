import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, IconButton, Menu, Avatar } from 'react-native-paper';
import { useAuthContext } from '../context/AuthContext';
import { useGroupContext } from '../context/GroupContext';

export function Header() {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const { user, signOut } = useAuthContext();
  const { activeGroup } = useGroupContext();

  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
        />
        <Text variant="titleLarge">SafeCity</Text>
      </View>

      {activeGroup && (
        <View style={styles.groupSection}>
          <Text variant="titleMedium">{activeGroup.name}</Text>
          <Text variant="bodySmall">
            {activeGroup.members.length} members
          </Text>
        </View>
      )}

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <IconButton
            icon={() => (
              <Avatar.Image
                size={40}
                source={
                  user?.avatar_url
                    ? { uri: user.avatar_url }
                    : require('../../assets/default-avatar.png')
                }
              />
            )}
            onPress={() => setMenuVisible(true)}
          />
        }
      >
        <Menu.Item 
          onPress={() => {/* Navigate to profile */}} 
          title="Profile" 
        />
        <Menu.Item 
          onPress={() => {/* Navigate to groups */}} 
          title="My Groups" 
        />
        <Menu.Item 
          onPress={() => {/* Navigate to settings */}} 
          title="Settings" 
        />
        <Menu.Item 
          onPress={signOut} 
          title="Sign Out" 
        />
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  groupSection: {
    alignItems: 'center',
  },
}); 