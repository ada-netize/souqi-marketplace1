import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, AppButton, AppInput, SectionHeader, EmptyState, StatCard, Badge } from "../../components/ui";
import { useApp } from "../../auth-context";
import { colors, spacing, radius } from "../../theme";
import { request } from "../../api";
import { normalizePhone, isValidPhone } from "../../helpers";

function planLabel(plan) {
  if (plan === "souqi_store_basic") return "متجر Basic";
  if (plan === "souqi_store_plus") return "متجر Plus";
  if (plan === "souqi_store_pro") return "متجر Pro";
  return "الخطة المجانية";
}

export default function ProfileScreen({ navigation }) {
  const { token, profile, refreshProfile, logout, markNotificationsRead } = useApp();
  const user = profile?.user;
  const [form, setForm] = useState({ fullName: user?.full_name || "", phone: user?.phone || "", cityId: user?.city_id ? String(user.city_id) : "" });

  useEffect(() => {
    if (user) setForm({ fullName: user.full_name || "", phone: user.phone || "", cityId: user.city_id ? String(user.city_id) : "" });
  }, [user]);

  const quickStats = useMemo(() => ({ listings: profile?.myListings?.length || 0, favorites: profile?.favorites?.length || 0, notifications: profile?.notifications?.length || 0, offers: profile?.offers?.length || 0 }), [profile]);
  if (!user) return <Screen><View style={styles.centered}><Text style={styles.metaDark}>جارٍ تحميل الحساب...</Text></View></Screen>;

  const saveProfile = async () => {
    try {
      const payload = { ...form, fullName: String(form.fullName || "").trim(), phone: normalizePhone(form.phone) };
      if (!payload.fullName) return Alert.alert("تنبيه", "اكتب الاسم الكامل");
      if (payload.phone && !isValidPhone(payload.phone)) return Alert.alert("تنبيه", "اكتب رقم جوال صحيحًا بالأرقام فقط");
      await request("/api/user/profile", { method: "PUT", body: payload }, token);
      await refreshProfile();
      Alert.alert("تم", "تم حفظ بيانات الحساب");
    } catch (error) {
      Alert.alert("خطأ", error?.message || "فشل حفظ الحساب");
    }
  };

  return (
    <Screen scroll contentStyle={styles.container}>
      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.avatarCircle}><Ionicons name="person" size={30} color={colors.primaryDark} /></View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.name}>{user.full_name}</Text>
            <Text style={styles.meta}>{user.email || user.phone || "بدون بريد"}</Text>
          </View>
        </View>
        <View style={styles.badgesRow}>
          <Badge title="مستخدم عادي" tone="success" />
          <Badge title={planLabel(user.subscription_plan)} />
        </View>
        <Text style={styles.meta}>الحالة: {user.subscription_status === "active" ? "فعالة" : "غير فعالة"}{user.trusted_badge ? " • شارة موثوق" : ""}</Text>
      </Card>

      <View style={styles.statsRow}><StatCard label="إعلاناتي" value={String(quickStats.listings)} /><StatCard label="المفضلة" value={String(quickStats.favorites)} /></View>
      <View style={styles.statsRow}><StatCard label="الإشعارات" value={String(quickStats.notifications)} /><StatCard label="العروض" value={String(quickStats.offers)} /></View>

      <Card>
        <SectionHeader title="اختصارات سريعة" subtitle="تنقل أسرع لأهم الشاشات داخل حسابك." />
        <View style={styles.shortcutsWrap}>
          <TouchableOpacity style={styles.shortcut} onPress={() => navigation.navigate("AddEditListing")}><Ionicons name="add-circle" size={18} color={colors.primaryDark} /><Text style={styles.shortcutTitle}>إضافة إعلان</Text></TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => navigation.navigate("FavoritesHub")}><Ionicons name="heart" size={18} color={colors.primaryDark} /><Text style={styles.shortcutTitle}>المفضلة</Text></TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => navigation.navigate("PlansHub")}><Ionicons name="flash" size={18} color={colors.primaryDark} /><Text style={styles.shortcutTitle}>الباقات والترقيات</Text></TouchableOpacity>
        </View>
      </Card>

      <Card>
        <SectionHeader title="بيانات الحساب" subtitle="حدّث معلوماتك الأساسية بسهولة." />
        <AppInput label="الاسم الكامل" placeholder="الاسم" value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} />
        <AppInput label="رقم الهاتف" placeholder="05xxxxxxxx" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: normalizePhone(v) })} keyboardType="phone-pad" maxLength={15} textContentType="telephoneNumber" />
        <AppButton title="حفظ البيانات" onPress={saveProfile} />
      </Card>

      <Card>
        <SectionHeader title="إعلاناتي" actionText="إضافة جديد" onAction={() => navigation.navigate("AddEditListing")} />
        {(profile?.myListings || []).length === 0 ? <EmptyState title="لا توجد إعلانات" text="ابدأ بإضافة أول إعلان لك داخل سوقي." /> : (profile.myListings || []).map((item) => (
          <TouchableOpacity key={item.id} style={styles.listRow} onPress={() => navigation.navigate("ListingDetails", { id: item.id })}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowMeta}>{item.price} ₪ • {item.status === "sold" ? "تم البيع" : item.status}</Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Card>
        <SectionHeader title="الإشعارات" actionText="تعليم كمقروء" onAction={markNotificationsRead} />
        {(profile?.notifications || []).length === 0 ? <EmptyState title="لا توجد إشعارات" text="عندما يصلك شيء جديد سيظهر هنا." /> : (profile.notifications || []).slice(0, 5).map((item) => (
          <View key={item.id} style={styles.noteRow}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.rowMeta}>{item.message}</Text></View>
        ))}
      </Card>

      <AppButton title="تسجيل الخروج" variant="secondary" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  metaDark: { color: colors.textSoft },
  heroCard: { gap: spacing.sm, backgroundColor: colors.primary, borderColor: colors.primary },
  heroTop: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  avatarCircle: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  heroTextWrap: { flex: 1 },
  name: { fontSize: 26, fontWeight: "900", color: colors.white, textAlign: "right" },
  meta: { color: "rgba(255,255,255,0.88)", textAlign: "right", lineHeight: 22 },
  badgesRow: { flexDirection: "row-reverse", gap: spacing.sm, flexWrap: "wrap", marginTop: 4 },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  shortcutsWrap: { gap: spacing.sm },
  shortcut: { backgroundColor: colors.primarySofter, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  shortcutTitle: { color: colors.text, fontWeight: "900", textAlign: "right" },
  listRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { color: colors.text, fontWeight: "900", textAlign: "right" },
  rowMeta: { marginTop: 6, color: colors.textSoft, textAlign: "right", lineHeight: 21 },
  noteRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
});
