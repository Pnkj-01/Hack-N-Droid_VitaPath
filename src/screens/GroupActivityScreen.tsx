import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { useGroupContext } from '../context/GroupContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface Activity {
  id: string;
  type: 'join' | 'leave' | 'location' | 'alert';
  user_id: string;
  description: string;
  created_at: string;
}

export function GroupActivityScreen() {
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { activeGroup } = useGroupContext();

  React.useEffect(() => {
    if (activeGroup) {
      loadActivities();
    }
  }, [activeGroup?.id]);

  const loadActivities = async () => {
    // Load activities from your backend
    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <FlatList
      style={styles.container}
      data={activities}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="titleMedium">
                {activeGroup?.members.find(m => m.user_id === item.user_id)?.nickname || 'User'}
              </Text>
              <Chip>{item.type}</Chip>
            </View>
            <Text variant="bodyMedium">{item.description}</Text>
            <Text variant="bodySmall" style={styles.timestamp}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestamp: {
    color: '#666',
    marginTop: 8,
  },
}); 