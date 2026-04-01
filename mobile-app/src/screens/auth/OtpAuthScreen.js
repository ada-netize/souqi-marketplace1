import React, { useState } from "react";
import { Text, StyleSheet, Alert } from "react-native";
import { Screen, Card, AppButton, AppInput } from "../../components/ui";
import { spacing, colors } from "../../theme";
import { useApp } from "../../auth-context";
import { normalizePhone, isValidPhone } from "../../helpers";

export default function OtpAuthScreen() {
  const { requestOtp, verifyOtp } = useApp();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ phone: "", code: "", fullName: "" });
  const [devCode, setDevCode] = useState("");

  const sendCode = async () => {
    try {
      const phone = normalizePhone(form.phone);
      if (!isValidPhone(phone)) return Alert.alert("تنبيه", "اكتب رقم جوال صحيحًا بالأرقام فقط");
      setLoading(true);
      const data = await requestOtp(phone);
      setForm((prev) => ({ ...prev, phone }));
      setDevCode(data?.devCode || "");
      Alert.alert("تم", data?.devCode ? `رمز التحقق: ${data.devCode}` : "تم إرسال رمز التحقق بنجاح");
    } catch (error) {
      Alert.alert("خطأ", error?.message || "فشل إرسال الكود");
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    try {
      const payload = { ...form, phone: normalizePhone(form.phone), code: String(form.code || "").replace(/\D+/g, "") };
      if (!isValidPhone(payload.phone)) return Alert.alert("تنبيه", "اكتب رقم جوال صحيحًا");
      if (!payload.code) return Alert.alert("تنبيه", "أدخل رمز التحقق");
      setLoading(true);
      await verifyOtp(payload);
    } catch (error) {
      Alert.alert("خطأ", error?.message || "فشل التحقق");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>الدخول بكود OTP</Text>
        <Text style={styles.subtitle}>أدخل رقم الهاتف ثم رمز التحقق. إذا كان الرقم جديدًا سيتم إنشاء الحساب من نفس الشاشة.</Text>
        <AppInput label="رقم الهاتف" placeholder="05xxxxxxxx" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: normalizePhone(v) })} keyboardType="phone-pad" maxLength={15} textContentType="telephoneNumber" />
        <AppInput label="الاسم الكامل إذا كان الرقم جديدًا" placeholder="الاسم الكامل" value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} />
        <AppButton title={loading ? "جارٍ الإرسال..." : "إرسال الكود"} onPress={sendCode} loading={loading} />
        <AppInput label="الكود" placeholder="أدخل الكود" value={form.code} onChangeText={(v) => setForm({ ...form, code: String(v || "").replace(/\D+/g, "") })} keyboardType="number-pad" maxLength={6} />
        <AppButton title={loading ? "جارٍ التحقق..." : "تأكيد الدخول"} onPress={confirmCode} loading={loading} />
        {devCode ? <Text style={styles.devText}>رمز التحقق: {devCode}</Text> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, justifyContent: "center", flexGrow: 1 },
  card: { backgroundColor: colors.surface },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, textAlign: "right" },
  subtitle: { marginTop: 8, color: colors.textSoft, lineHeight: 22, textAlign: "right", marginBottom: spacing.lg },
  devText: { marginTop: spacing.md, color: colors.primary, textAlign: "right", fontWeight: "800" },
});
