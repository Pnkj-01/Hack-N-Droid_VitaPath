import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Switch, Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { useGroupContext } from '../context/GroupContext';
import { useAuthContext } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function GroupSettingsScreen() {
  const [inviteDialogVisible, setInviteDialogVisible] = React.useState(false);
  const [inviteCode, setInviteCode] = React.useState('');
  const { activeGroup, toggleLocationSharing, generateInviteCode, removeGroupMember } = useGroupContext();
  const { user } = useAuthContext();

  if (!activeGroup) return <LoadingSpinner />;

  const currentMember = activeGroup.members.find(m => m.user_id === user?.id);
  const isAdmin = currentMember?.role === 'admin';

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Your Settings</List.Subheader>
        <List.Item
          title="Location Sharing"
          right={() => (
            <Switch
              value={currentMember?.location_sharing}
              onValueChange={toggleLocationSharing}
            />
          )}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Members</List.Subheader>
        {activeGroup.members.map(member => (
          <List.Item
            key={member.id}
            title={member.nickname || 'Group Member'}
            description={`Role: ${member.role}`}
            right={props => 
              isAdmin && member.user_id !== user?.id ? (
                <Button
                  {...props}
                  onPress={() => removeGroupMember(member.user_id)}
                >
                  Remove
                </Button>
              ) : null
            }
          />
        ))}
      </List.Section>

      {isAdmin && (
        <View style={styles.adminSection}>
          <Button
            mode="contained"
            onPress={() => setInviteDialogVisible(true)}
          >
            Generate Invite Code
          </Button>
        </View>
      )}

      <Portal>
        <Dialog
          visible={inviteDialogVisible}
          onDismiss={() => setInviteDialogVisible(false)}
        >
          <Dialog.Title>Invite Code</Dialog.Title>
          <Dialog.Content>
            <TextInput
              value={inviteCode}
              editable={false}
              right={<TextInput.Icon icon="content-copy" onPress={() => {/* Copy to clipboard */}} />}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setInviteDialogVisible(false)}>Close</Button>
            <Button onPress={async () => {
              const code = await generateInviteCode();
              setInviteCode(code);
            }}>
              Generate New Code
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  adminSection: {
    padding: 16,
    gap: 8,
  },
}); 