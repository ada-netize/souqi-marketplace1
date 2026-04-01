import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, Card, AppButton, AppInput } from "../../components/ui";
import { useApp } from "../../auth-context";
import { colors, spacing, radius } from "../../theme";
import { normalizeEmail, isValidEmail } from "../../helpers";

export default function LoginScreen({ navigation }) {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      const normalizedEmail = normalizeEmail(email);
      if (!isValidEmail(normalizedEmail)) return Alert.alert("تنبيه", "اكتب بريدًا إلكترونيًا صحيحًا");
      if (!password || password.length < 6) return Alert.alert("تنبيه", "اكتب كلمة مرور صحيحة");
      setLoading(true);
      await login(normalizedEmail, password);
    } catch (error) {
      Alert.alert("خطأ", error?.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.container}>
      <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.badge}>SOUQI</Text>
        <Text style={styles.title}>سجل دخولك بأناقة</Text>
        <Text style={styles.subtitle}>واجهة نظيفة وآمنة للدخول إلى سوقي، لإدارة الإعلانات والمحادثات والحساب من مكان واحد.</Text>
      </LinearGradient>

      <Card style={styles.formCard}>
        <AppInput label="البريد الإلكتروني" placeholder="example@email.com" value={email} onChangeText={(value) => setEmail(normalizeEmail(value))} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" />
        <AppInput label="كلمة المرور" placeholder="أدخل كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" />
        <AppButton title={loading ? "جارٍ الدخول..." : "تسجيل الدخول"} onPress={handleLogin} loading={loading} />

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>إنشاء حساب جديد</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("OtpAuth")}>
          <Text style={styles.link}>الدخول برقم الهاتف وكود OTP</Text>
        </TouchableOpacity>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.lg },
  hero: { borderRadius: radius.xxl, padding: spacing.xl },
  formCard: { marginTop: -12 },
  badge: { alignSelf: "flex-end", backgroundColor: "rgba(255,255,255,0.16)", color: colors.white, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, overflow: "hidden", fontSize: 12, fontWeight: "900" },
  title: { marginTop: spacing.md, fontSize: 34, fontWeight: "900", color: colors.white, textAlign: "right" },
  subtitle: { marginTop: 10, fontSize: 15, lineHeight: 24, color: "#DEF5E7", textAlign: "right" },
  link: { marginTop: spacing.md, color: colors.primary, textAlign: "right", fontSize: 14, fontWeight: "800" },
});
