import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, iconSize, radius, spacing, touch } from '../theme';
import { AppText } from './AppText';

export interface SelectOption<T> {
  value: T;
  label: string;
}

interface SelectFieldProps<T> {
  label: string;
  value: T | undefined;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  error?: string;
}

/**
 * A field that opens a large, easy-to-tap list. Used for day / month / year so both
 * solar and lunar dates can be picked the same way (no native date picker knows lunar months).
 */
export function SelectField<T>({ label, value, options, onChange, placeholder = 'Chọn', error }: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <View style={styles.wrap}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? 'chưa chọn'}`}
        accessibilityHint="Mở danh sách để chọn"
        style={[styles.field, error ? styles.fieldError : null]}
      >
        <AppText variant="body" color={selected ? colors.text : colors.textSecondary} style={styles.flex}>
          {selected?.label ?? placeholder}
        </AppText>
        <ChevronDown size={iconSize.sm} color={colors.textSecondary} />
      </Pressable>
      {error && (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      )}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.scrim}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Đóng danh sách"
          />
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <AppText variant="heading" style={styles.sheetTitle}>
              {label}
            </AppText>
            <FlatList
              data={options}
              keyExtractor={o => String(o.value)}
              initialScrollIndex={Math.max(0, options.findIndex(o => o.value === value))}
              getItemLayout={(_, index) => ({ length: ROW, offset: ROW * index, index })}
              renderItem={({ item }) => {
                const isSel = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSel }}
                    style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  >
                    <AppText variant={isSel ? 'bodyStrong' : 'body'} style={styles.flex}>
                      {item.label}
                    </AppText>
                    {isSel && <Check size={iconSize.md} color={colors.primary} />}
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const ROW = 56;

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs + 2, flex: 1 },
  flex: { flex: 1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.minHeight + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  fieldError: { borderColor: colors.danger, borderWidth: 2 },
  scrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '60%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sheetTitle: { marginBottom: spacing.sm },
  option: {
    height: ROW,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionPressed: { backgroundColor: colors.surfaceSunken },
});
