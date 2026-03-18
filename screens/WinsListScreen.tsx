import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { WIN_CATEGORIES, getCategoryMeta } from '@/constants/win-categories';
import { WinsTheme } from '@/constants/wins-theme';
import { useWins } from '@/hooks/use-wins';
import { useTypedNavigation } from '@/navigation/typed-navigation';
import { getTheme } from '@/constants/theme-utils';
import { useTheme } from '@/hooks/use-theme';
import type { Win } from '@/types/win';

const editIcon = '\u270F\uFE0F';
const deleteIcon = '\u2715';
const allCategories = [{ key: 'all', label: 'All', emoji: '' }, ...WIN_CATEGORIES] as const;
type CategoryFilterKey = (typeof allCategories)[number]['key'];

export default function WinsListScreen() {
  const navigation = useTypedNavigation();
  const { wins, stats, userName, deleteWin, editWin } = useWins();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const overlayColor = isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(15, 23, 42, 0.4)';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilterKey>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const isFiltering = searchQuery.trim().length > 0 || activeCategory !== 'all';

  const filteredWins = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return wins.filter((win) => {
      const matchesQuery = normalizedQuery
        ? win.text.toLowerCase().includes(normalizedQuery)
        : true;
      const matchesCategory = activeCategory === 'all' ? true : win.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [wins, searchQuery, activeCategory]);

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

  const renderItem = ({ item }: { item: Win }) => {
    const meta = getCategoryMeta(item.category);
    return (
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
        <View style={styles.winMeta}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: theme.colors.accentSoft,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.categoryBadgeText, { color: theme.colors.text }]}>
              {meta.emoji} {meta.label}
            </Text>
          </View>
          <Text style={[styles.winDate, { color: theme.colors.textMuted }]}>{item.date}</Text>
        </View>
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
  };

  return (
    <ScreenContainer>
      <FlatList
        data={filteredWins}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { backgroundColor: theme.colors.background }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Your Wins</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              {`Total wins recorded: ${stats.totalWins}`}
            </Text>
            <View style={styles.searchBlock}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search wins..."
                placeholderTextColor={theme.colors.textMuted}
                selectionColor={theme.colors.accent}
                style={[
                  styles.searchInput,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceAlt,
                  },
                ]}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChips}
              >
                {allCategories.map((category) => {
                  const isActive = category.key === activeCategory;
                  return (
                    <Pressable
                      key={category.key}
                      onPress={() => setActiveCategory(category.key)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isActive ? theme.colors.accent : theme.colors.surfaceAlt,
                          borderColor: isActive ? theme.colors.accent : theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: isActive ? theme.colors.onAccent : theme.colors.text },
                        ]}
                      >
                        {category.emoji ? `${category.emoji} ` : ''}
                        {category.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
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
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              {isFiltering ? 'No wins found' : 'No wins yet'}
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              {isFiltering
                ? 'No wins match your search or filters. Try adjusting them.'
                : 'Add your first small win on the dashboard to get started.'}
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
  searchBlock: {
    marginTop: WinsTheme.spacing.md,
    gap: WinsTheme.spacing.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    paddingHorizontal: WinsTheme.spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: WinsTheme.fonts.body,
  },
  filterChips: {
    gap: WinsTheme.spacing.sm,
    paddingBottom: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
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
  winMeta: {
    marginTop: WinsTheme.spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: WinsTheme.spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
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

