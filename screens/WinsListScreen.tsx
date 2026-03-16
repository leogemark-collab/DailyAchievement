import React, { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { WinsTheme } from '@/constants/wins-theme';
import { useWins } from '@/hooks/use-wins';
import { useTypedNavigation } from '@/navigation/typed-navigation';
import { getTheme } from '@/constants/theme-utils';
import { useTheme } from '@/hooks/use-theme';
import type { Win } from '@/types/win';

const editIcon = '\u270F\uFE0F';
const deleteIcon = '\u2715';

export default function WinsListScreen() {
  const navigation = useTypedNavigation();
  const { wins, stats, userName, deleteWin, editWin } = useWins();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const overlayColor = isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(15, 23, 42, 0.4)';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleDeleteWin = (id: string, text: string) => {
    Alert.alert('Delete Win', `Are you sure you want to delete "${text}"?`, [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Delete',
        onPress: () => deleteWin(id),
        style: 'destructive',
      },
    ]);
  };

  const handleEditWin = (id: string, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      editWin(editingId, editText);
      setEditingId(null);
      setEditText('');
    }
  };

  const renderItem = ({ item }: { item: Win }) => (
    <View
      style={[
        styles.listItem,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderLeftColor: theme.colors.accent,
          borderLeftWidth: 4,
        },
        theme.shadows.soft,
      ]}
    >
      <Pressable
        onPress={() => handleEditWin(item.id, item.text)}
        style={styles.winContent}
      >
        <Text style={[styles.winText, { color: theme.colors.text }]}>{item.text}</Text>
        <Text style={[styles.winDate, { color: theme.colors.textMuted }]}>{item.date}</Text>
      </Pressable>
      <View style={styles.actionButtons}>
        <Pressable
          onPress={() => handleEditWin(item.id, item.text)}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: theme.colors.accentSoft,
              borderColor: theme.colors.border,
            },
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Text style={styles.actionButtonText}>{editIcon}</Text>
        </Pressable>
        <Pressable
          onPress={() => handleDeleteWin(item.id, item.text)}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: theme.colors.dangerSoft,
              borderColor: theme.colors.border,
            },
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Text style={styles.actionButtonText}>{deleteIcon}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <FlatList
        data={wins}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { backgroundColor: theme.colors.background }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Your Wins</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{`Total wins recorded: ${stats.totalWins}`}</Text>
          </View>
        }
        ListEmptyComponent={
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.card,
            ]}
          >
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No wins yet</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              Add your first small win on the dashboard to get started.
            </Text>
            <PrimaryButton
              label="Go to Dashboard"
              variant="ghost"
              onPress={() => navigation.navigate('dashboard', { name: userName || 'Friend' })}
            />
          </View>
        }
      />

      <Modal
        visible={!!editingId}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingId(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: overlayColor }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.card,
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Win</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}
              placeholder="Edit your win..."
              placeholderTextColor={theme.colors.textMuted}
              value={editText}
              onChangeText={setEditText}
              selectionColor={theme.colors.accent}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: theme.colors.border },
                  pressed && styles.modalButtonPressed,
                ]}
                onPress={() => setEditingId(null)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.textMuted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.saveButton,
                  { backgroundColor: theme.colors.accent },
                  pressed && styles.modalButtonPressed,
                ]}
                onPress={handleSaveEdit}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.onAccent }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.md,
    paddingBottom: WinsTheme.spacing.xl,
  },
  header: {
    marginBottom: WinsTheme.spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: WinsTheme.colors.text,
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: WinsTheme.colors.textMuted,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 20,
  },
  listItem: {
    backgroundColor: WinsTheme.colors.surface,
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
    borderWidth: 1,
    borderColor: WinsTheme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: WinsTheme.spacing.md,
  },
  winContent: {
    flex: 1,
  },
  winText: {
    fontSize: 16,
    fontWeight: '600',
    color: WinsTheme.colors.text,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 22,
  },
  winDate: {
    marginTop: 6,
    fontSize: 13,
    color: WinsTheme.colors.textMuted,
    fontFamily: WinsTheme.fonts.body,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.sm,
  },
  actionButton: {
    padding: WinsTheme.spacing.sm,
    borderRadius: WinsTheme.radius.md,
    borderWidth: 1,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    marginTop: WinsTheme.spacing.xl,
    backgroundColor: WinsTheme.colors.surface,
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    borderColor: WinsTheme.colors.border,
    gap: WinsTheme.spacing.md,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: WinsTheme.colors.text,
    fontFamily: WinsTheme.fonts.title,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: WinsTheme.colors.textMuted,
    fontFamily: WinsTheme.fonts.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '86%',
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.md,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
    fontSize: 16,
    fontFamily: WinsTheme.fonts.body,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.md,
    marginTop: WinsTheme.spacing.md,
  },
  modalButton: {
    flex: 1,
    borderRadius: WinsTheme.radius.md,
    paddingVertical: WinsTheme.spacing.md,
    alignItems: 'center',
  },
  modalButtonPressed: {
    opacity: 0.7,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  saveButton: {},
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
});

