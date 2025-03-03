import React from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

export function YourComponent() {
  const { user } = useAuth();

  const testNavigation = () => {
    console.log('Navigation test clicked');
  };

  return (
    <View style={styles.container}>
      <Image
        source={
          user?.avatar_url
            ? { uri: user.avatar_url }
            : require('../assets/default.png')
        }
        style={styles.image}
      />
      <Text style={styles.text}>Welcome {user?.email || 'Guest'}</Text>
      <TouchableOpacity onPress={testNavigation} style={styles.button}>
        <Text style={styles.buttonText}>Test Navigation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e1e1e1',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  }
});