import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenContainer } from '@/components/screen-container';
import { getTheme } from '@/constants/theme-utils';
import { WIN_CATEGORIES, getCategoryMeta } from '@/constants/win-categories';
import { WinsTheme } from '@/constants/wins-theme';
import { useTheme } from '@/hooks/use-theme';
import { useWins } from '@/hooks/use-wins';
import { useTypedNavigation } from '@/navigation/typed-navigation';
import type { Win } from '@/types/win';

const allCategories = [{ key: 'all', label: 'All', emoji: '' }, ...WIN_CATEGORIES] as const;
type CategoryFilterKey = (typeof allCategories)[number]['key'];

export default function WinsListScreen() {
  const navigation = useTypedNavigation();
  const { wins, stats, userName, deleteWin, editWin } = useWins();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const overlayColor = isDark ? 'rgba(8, 6, 5, 0.72)' : 'rgba(34, 25, 20, 0.38)';
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
    Alert.alert('Delete Moment', `Are you sure you want to delete "${text}"?`, [
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
          },
          theme.shadows.soft,
        ]}
      >
        <View style={[styles.listAccent, { backgroundColor: theme.colors.accent }]} />
        <Pressable onPress={() => handleEditWin(item.id, item.text)} style={styles.winContent}>
          <Text style={[styles.winText, { color: theme.colors.text }]}>{item.text}</Text>
          <View style={styles.winMeta}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: theme.colors.surfaceAlt,
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
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Ionicons name="create-outline" size={18} color={theme.colors.text} />
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
            <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
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
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View
            style={[
              styles.headerCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              theme.shadows.card,
            ]}
          >
            <Text style={[styles.title, { color: theme.colors.text }]}>Moments</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Revisit the wins you logged, search for patterns, and refine the wording when needed.
            </Text>
            <View style={styles.summaryRow}>
              <View
                style={[
                  styles.summaryPill,
                  { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.summaryPillValue, { color: theme.colors.text }]}>
                  {stats.totalWins}
                </Text>
                <Text style={[styles.summaryPillLabel, { color: theme.colors.textMuted }]}>
                  Total wins
                </Text>
              </View>
              <View
                style={[
                  styles.summaryPill,
                  { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.summaryPillValue, { color: theme.colors.text }]}>
                  {filteredWins.length}
                </Text>
                <Text style={[styles.summaryPillLabel, { color: theme.colors.textMuted }]}>
                  Showing
                </Text>
              </View>
            </View>
            <View style={styles.searchBlock}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search your moments..."
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
              {isFiltering ? 'No moments found' : 'No moments yet'}
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              {isFiltering
                ? 'Nothing matches the search or filters you set. Try broadening the view.'
                : 'Log your first win on the Today screen and Dayflow will start building your timeline.'}
            </Text>
            <PrimaryButton
              label="Go to Today"
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
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit moment</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceAlt,
                },
              ]}
              placeholder="Refine the wording..."
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
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceAlt,
                  },
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
  headerCard: {
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.md,
    marginBottom: WinsTheme.spacing.sm,
  },
  searchBlock: {
    gap: WinsTheme.spacing.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    paddingHorizontal: WinsTheme.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: WinsTheme.fonts.body,
  },
  filterChips: {
    gap: WinsTheme.spacing.sm,
    paddingBottom: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.sm,
  },
  summaryPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
  },
  summaryPillValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  summaryPillLabel: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: WinsTheme.fonts.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listItem: {
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: WinsTheme.spacing.md,
    overflow: 'hidden',
  },
  listAccent: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: 999,
  },
  winContent: {
    flex: 1,
  },
  winText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
    lineHeight: 22,
  },
  winMeta: {
    marginTop: WinsTheme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: WinsTheme.spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: WinsTheme.fonts.body,
  },
  winDate: {
    fontSize: 12,
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
    opacity: 0.72,
  },
  emptyState: {
    marginTop: WinsTheme.spacing.xl,
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    borderWidth: 1,
    gap: WinsTheme.spacing.md,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: WinsTheme.fonts.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: WinsTheme.spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: WinsTheme.radius.lg,
    padding: WinsTheme.spacing.lg,
    gap: WinsTheme.spacing.md,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.title,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: WinsTheme.radius.md,
    padding: WinsTheme.spacing.md,
    fontSize: 16,
    fontFamily: WinsTheme.fonts.body,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: WinsTheme.spacing.md,
    marginTop: WinsTheme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    borderRadius: WinsTheme.radius.md,
    paddingVertical: WinsTheme.spacing.md,
    alignItems: 'center',
  },
  modalButtonPressed: {
    opacity: 0.72,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  modalButtonText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: WinsTheme.fonts.body,
  },
});
