import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, StyleSheet, Alert, View } from "react-native";
import { Screen, Card, AppButton, AppInput } from "../components/ui";
import { colors, spacing } from "../theme";

export default function LoginScreen({ navigation, auth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await auth.login(email, password);
    } catch (error) {
      Alert.alert("خطأ", error?.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.badge}>TRIANGLE MARKET</Text>
          <Text style={styles.title}>سجّل دخولك</Text>
          <Text style={styles.subtitle}>
            واجهة دخول نظيفة وفخمة بنفس روح الموقع، مع ألوان أخضر وأبيض وترتيب مريح.
          </Text>
        </View>

        <Card>
          <AppInput
            label="البريد الإلكتروني"
            placeholder="أدخل البريد الإلكتروني"
            value={email}
            onChangeText={setEmail}
          />

          <AppInput
            label="كلمة المرور"
            placeholder="أدخل كلمة المرور"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />

          <AppButton
            title={loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
            onPress={handleLogin}
            loading={loading}
          />

          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>إنشاء حساب جديد</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("OtpAuth")}>
            <Text style={styles.link}>الدخول برقم الهاتف وكود OTP</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  hero: {
    marginBottom: spacing.sm,
  },
  badge: {
    alignSelf: "flex-end",
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
  },
  title: {
    marginTop: spacing.md,
    fontSize: 34,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSoft,
    textAlign: "right",
  },
  link: {
    marginTop: spacing.md,
    color: colors.primary,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "700",
  },
});
