import React, { useState } from "react";
import { Text, StyleSheet, Alert, View } from "react-native";
import { Screen, Card, AppButton, AppInput, ChipsRow } from "../../components/ui";
import { colors, spacing, radius } from "../../theme";
import { useApp } from "../../auth-context";
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from "../../helpers";

export default function RegisterScreen() {
  const { register, bootstrap } = useApp();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", cityId: "" });

  const handleRegister = async () => {
    try {
      const payload = { ...form, fullName: String(form.fullName || "").trim(), email: normalizeEmail(form.email), phone: normalizePhone(form.phone) };
      if (!payload.fullName) return Alert.alert("تنبيه", "اكتب الاسم الكامل");
      if (!isValidEmail(payload.email)) return Alert.alert("تنبيه", "اكتب بريدًا إلكترونيًا صحيحًا");
      if (!isValidPhone(payload.phone)) return Alert.alert("تنبيه", "اكتب رقم جوال صحيحًا بالأرقام فقط");
      if (!payload.password || payload.password.length < 6) return Alert.alert("تنبيه", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      if (!payload.cityId) return Alert.alert("تنبيه", "اختر المدينة");
      setLoading(true);
      await register(payload);
    } catch (error) {
      Alert.alert("خطأ", error?.message || "فشل إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.container}>
      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>أنشئ حسابك في سوقي</Text>
        <Text style={styles.heroText}>حساب واحد فقط يكفيك للنشر والتواصل وتفعيل المزايا المدفوعة لاحقًا، بنفس هوية أخضر + أبيض مرتبة وواضحة.</Text>
      </Card>

      <Card>
        <AppInput label="الاسم الكامل" placeholder="اكتب اسمك الكامل" value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} />
        <AppInput label="البريد الإلكتروني" placeholder="example@email.com" value={form.email} onChangeText={(v) => setForm({ ...form, email: normalizeEmail(v) })} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" />
        <AppInput label="كلمة المرور" placeholder="كلمة المرور" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry textContentType="newPassword" />
        <AppInput label="رقم الهاتف" placeholder="05xxxxxxxx" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: normalizePhone(v) })} keyboardType="phone-pad" maxLength={15} textContentType="telephoneNumber" />
        <Text style={styles.smallLabel}>نوع الحساب</Text>
        <View style={styles.singleTypeBox}>
          <Text style={styles.singleTypeTitle}>مستخدم عادي</Text>
          <Text style={styles.singleTypeMeta}>تنشر إعلانًا، تتواصل، وتفعل الرفع والباقات من نفس الحساب بدون تقسيمات معقدة.</Text>
        </View>
        <Text style={styles.smallLabel}>المدينة</Text>
        <ChipsRow items={bootstrap?.cities || []} selected={form.cityId} onSelect={(value) => setForm({ ...form, cityId: value })} />
        <AppButton title={loading ? "جارٍ التسجيل..." : "تسجيل الحساب"} onPress={handleRegister} loading={loading} style={styles.topGap} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.lg },
  heroCard: { backgroundColor: colors.primarySofter },
  heroTitle: { fontSize: 30, fontWeight: "900", color: colors.text, textAlign: "right" },
  heroText: { marginTop: 10, fontSize: 15, lineHeight: 24, color: colors.textSoft, textAlign: "right" },
  smallLabel: { marginBottom: 8, color: colors.text, fontSize: 14, fontWeight: "800", textAlign: "right" },
  singleTypeBox: { backgroundColor: colors.primarySofter, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14, marginBottom: spacing.md },
  singleTypeTitle: { color: colors.primaryDark, fontWeight: "900", fontSize: 16, textAlign: "right" },
  singleTypeMeta: { marginTop: 8, color: colors.textSoft, lineHeight: 22, textAlign: "right" },
  topGap: { marginTop: spacing.lg },
});
