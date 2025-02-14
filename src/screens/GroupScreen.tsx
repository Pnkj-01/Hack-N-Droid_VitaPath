import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, FAB, Portal, Modal, TextInput } from 'react-native-paper';
import { useGroupContext } from '../context/GroupContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Group } from '../types';
import { useNavigation } from '@react-navigation/native';

export function GroupScreen() {
  const [createModalVisible, setCreateModalVisible] = React.useState(false);
  const [joinModalVisible, setJoinModalVisible] = React.useState(false);
  const [groupName, setGroupName] = React.useState('');
  const [groupType, setGroupType] = React.useState<Group['type']>('custom');
  const [inviteCode, setInviteCode] = React.useState('');
  const { groups, loading, createGroup, joinGroup, switchGroup, activeGroup } = useGroupContext();
  const navigation = useNavigation();

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <ScrollView>
        {groups.map(group => (
          <Card
            key={group.id}
            style={[
              styles.groupCard,
              activeGroup?.id === group.id && styles.activeGroupCard,
            ]}
            onPress={() => switchGroup(group.id)}
          >
            <Card.Content>
              <Text variant="titleLarge">{group.name}</Text>
              <Text variant="bodyMedium">Type: {group.type}</Text>
              <Text variant="bodyMedium">
                Members: {group.members.length}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Portal>
        <Modal
          visible={createModalVisible}
          onDismiss={() => setCreateModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge">Create New Group</Text>
          <TextInput
            label="Group Name"
            value={groupName}
            onChangeText={setGroupName}
          />
          {/* Add group type selection */}
          <Button
            mode="contained"
            onPress={async () => {
              await createGroup(groupName, groupType);
              setCreateModalVisible(false);
              setGroupName('');
            }}
          >
            Create
          </Button>
        </Modal>

        <Modal
          visible={joinModalVisible}
          onDismiss={() => setJoinModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge">Join Group</Text>
          <TextInput
            label="Invite Code"
            value={inviteCode}
            onChangeText={setInviteCode}
          />
          <Button
            mode="contained"
            onPress={async () => {
              await joinGroup(inviteCode);
              setJoinModalVisible(false);
              setInviteCode('');
            }}
          >
            Join
          </Button>
        </Modal>
      </Portal>

      <FAB.Group
        open={false}
        icon="plus"
        actions={[
          {
            icon: 'account-multiple-plus',
            label: 'Create Group',
            onPress: () => setCreateModalVisible(true),
          },
          {
            icon: 'account-plus',
            label: 'Join Group',
            onPress: () => setJoinModalVisible(true),
          },
        ]}
      />

      {activeGroup && (
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            icon="map"
            onPress={() => navigation.navigate('GroupMap')}
          >
            View Map
          </Button>
          <Button
            mode="contained"
            icon="chat"
            onPress={() => navigation.navigate('GroupChat')}
          >
            Group Chat
          </Button>
          <Button
            mode="contained"
            icon="cog"
            onPress={() => navigation.navigate('GroupSettings')}
          >
            Settings
          </Button>
          <Button
            mode="contained"
            icon="history"
            onPress={() => navigation.navigate('GroupActivity')}
          >
            Activity
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  groupCard: {
    marginBottom: 16,
  },
  activeGroupCard: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    gap: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
}); 