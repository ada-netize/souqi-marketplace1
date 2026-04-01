import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, shadow, spacing } from "../theme";

export function Screen({ children, scroll = false, contentStyle, style }) {
  if (scroll) {
    return (
      <SafeAreaView style={[styles.screen, style]}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, style]}>
      <View style={[styles.screenInner, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AppButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const inactive = disabled || loading;
  const primary = variant === "primary";

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} disabled={inactive} style={style}>
      {primary ? (
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, styles.buttonPrimary, inactive && styles.buttonDisabled]}
        >
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.buttonText, styles.buttonTextPrimary, textStyle]}>{title}</Text>}
        </LinearGradient>
      ) : (
        <View style={[styles.button, styles.buttonSecondary, inactive && styles.buttonDisabled]}>
          {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.buttonText, styles.buttonTextSecondary, textStyle]}>{title}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

export function AppInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  multiline = false,
  style,
  rightLabel,
  ...rest
}) {
  return (
    <View style={styles.inputWrap}>
      {(label || rightLabel) ? (
        <View style={styles.inputHead}>
          {rightLabel ? <Text style={styles.inputRightLabel}>{rightLabel}</Text> : <View />}
          {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
        </View>
      ) : null}
      <TextInput
        style={[styles.input, multiline ? styles.inputMultiline : null, styles.inputRtl, style]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        {...rest}
      />
    </View>
  );
}

export function SectionHeader({ title, subtitle, actionText, onAction, style }) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionText && onAction ? (
        <TouchableOpacity onPress={onAction} style={styles.actionChip}>
          <Text style={styles.actionLink}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Badge({ title, tone = "default", style }) {
  const toneStyle =
    tone === "success"
      ? styles.badgeSuccess
      : tone === "warning"
      ? styles.badgeWarning
      : tone === "danger"
      ? styles.badgeDanger
      : styles.badgeDefault;

  return <Text style={[styles.badge, toneStyle, style]}>{title}</Text>;
}

export function ChipsRow({ items, selected, onSelect, labelKey = "name_ar", valueKey = "id" }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
      {items.map((item) => {
        const value = String(item[valueKey]);
        const active = String(selected) === value;
        return (
          <TouchableOpacity key={value} activeOpacity={0.92} onPress={() => onSelect(value)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{item[labelKey]}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function EmptyState({ title, text }) {
  return (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </Card>
  );
}

export function StatCard({ label, value }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenInner: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 132 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  button: {
    minHeight: 56,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  buttonPrimary: { ...shadow, shadowOpacity: 0.11, elevation: 10 },
  buttonSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: "900" },
  buttonTextPrimary: { color: colors.white },
  buttonTextSecondary: { color: colors.primaryDark },
  inputWrap: { marginBottom: spacing.md },
  inputHead: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: { color: colors.text, fontSize: 14, fontWeight: "800", textAlign: "right" },
  inputRightLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  input: {
    minHeight: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  inputRtl: { textAlign: "right" },
  inputMultiline: { minHeight: 128, paddingTop: 16, paddingBottom: 16 },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: "900", textAlign: "right" },
  sectionSubtitle: { marginTop: 6, color: colors.textSoft, textAlign: "right", lineHeight: 22 },
  actionChip: { backgroundColor: colors.primarySofter, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.border },
  actionLink: { color: colors.primaryDark, fontWeight: "900", fontSize: 13 },
  badge: { overflow: "hidden", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, fontSize: 12, fontWeight: "900" },
  badgeDefault: { backgroundColor: colors.surfaceMuted, color: colors.textSoft },
  badgeSuccess: { backgroundColor: colors.primarySoft, color: colors.primaryDark },
  badgeWarning: { backgroundColor: "#FFF4D8", color: colors.warning },
  badgeDanger: { backgroundColor: "#FFE5E5", color: colors.danger },
  chipsRow: { flexDirection: "row-reverse", gap: 10, paddingVertical: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "800" },
  chipTextActive: { color: colors.white },
  emptyCard: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xl },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "900", textAlign: "center" },
  emptyText: { marginTop: 8, color: colors.textSoft, lineHeight: 22, textAlign: "center" },
  statCard: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 118 },
  statValue: { color: colors.primaryDark, fontSize: 28, fontWeight: "900" },
  statLabel: { marginTop: 8, color: colors.textSoft, fontWeight: "800" },
});
