import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, TextInput, IconButton, Avatar } from 'react-native-paper';
import { useGroupContext } from '../context/GroupContext';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  type: 'text' | 'location' | 'alert';
}

export function GroupChatScreen() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const { activeGroup } = useGroupContext();
  const { user } = useAuthContext();
  const flatListRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    if (activeGroup) {
      loadMessages();
      subscribeToMessages();
    }
  }, [activeGroup?.id]);

  const loadMessages = async () => {
    if (!activeGroup) return;

    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', activeGroup.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data.reverse());
    setLoading(false);
  };

  const subscribeToMessages = () => {
    if (!activeGroup) return;

    const subscription = supabase
      .channel(`group-chat-${activeGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${activeGroup.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          flatListRef.current?.scrollToEnd();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !activeGroup) return;

    await supabase.from('group_messages').insert([
      {
        group_id: activeGroup.id,
        user_id: user.id,
        content: newMessage.trim(),
        type: 'text',
      },
    ]);

    setNewMessage('');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const member = activeGroup?.members.find(m => m.user_id === item.user_id);
          const isCurrentUser = item.user_id === user?.id;

          return (
            <View
              style={[
                styles.messageContainer,
                isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
              ]}
            >
              {!isCurrentUser && (
                <Avatar.Text
                  size={32}
                  label={member?.nickname?.[0] || 'U'}
                  style={styles.avatar}
                />
              )}
              <View style={styles.messageContent}>
                {!isCurrentUser && (
                  <Text variant="labelSmall">{member?.nickname || 'User'}</Text>
                )}
                <Text>{item.content}</Text>
                <Text variant="labelSmall" style={styles.timestamp}>
                  {new Date(item.created_at).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          style={styles.input}
          right={
            <TextInput.Icon
              icon="send"
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    padding: 8,
    marginVertical: 4,
    marginHorizontal: 8,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderRadius: 12,
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  avatar: {
    marginRight: 8,
  },
  messageContent: {
    flex: 1,
  },
  timestamp: {
    alignSelf: 'flex-end',
    color: '#666',
  },
  inputContainer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
  },
}); 