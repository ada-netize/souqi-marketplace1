import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, SectionHeader, EmptyState, Card, Badge } from "../../components/ui";
import { useApp } from "../../auth-context";
import { spacing, colors } from "../../theme";

export default function MessagesScreen({ navigation }) {
  const { profile, refreshProfile } = useApp();
  const conversations = profile?.conversations || [];

  return (
    <Screen scroll contentStyle={styles.container}>
      <Card style={styles.heroCard}>
        <Text style={styles.heroBadge}>MESSAGES</Text>
        <Text style={styles.heroTitle}>رسائلك في واجهة أوضح</Text>
        <Text style={styles.heroText}>كل محادثاتك مرتبة بشكل احترافي، مع التركيز على آخر الرسائل وعدد غير المقروء من مكان واحد.</Text>
      </Card>

      <SectionHeader title="المحادثات" subtitle="افتح المحادثة أو حدّث القائمة بسرعة." actionText="تحديث" onAction={refreshProfile} />
      {conversations.length === 0 ? <EmptyState title="لا توجد محادثات" text="ابدأ محادثة من صفحة أي إعلان لتظهر هنا." /> : null}
      {conversations.map((conv) => (
        <TouchableOpacity key={conv.id} activeOpacity={0.94} onPress={() => navigation.navigate("Conversation", { id: conv.id })}>
          <Card style={styles.itemCard}>
            <View style={styles.itemTop}>
              <View style={styles.arrowWrap}><Ionicons name="chevron-back" size={16} color={colors.textMuted} /></View>
              {conv.unread ? <Badge title={`${conv.unread} جديد`} tone="success" /> : <Badge title="مقروء" />}
            </View>
            <Text style={styles.title}>{conv.otherUser?.full_name}</Text>
            <Text style={styles.meta}>{conv.listing?.title}</Text>
            <Text numberOfLines={2} style={styles.message}>{conv.lastMessage?.message || "لا توجد رسائل بعد"}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  heroCard: { backgroundColor: colors.primarySofter },
  heroBadge: { alignSelf: "flex-end", backgroundColor: colors.primarySoft, color: colors.primaryDark, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, overflow: "hidden", fontSize: 12, fontWeight: "900" },
  heroTitle: { marginTop: 14, color: colors.text, fontSize: 28, fontWeight: "900", textAlign: "right" },
  heroText: { marginTop: 10, color: colors.textSoft, textAlign: "right", lineHeight: 23 },
  itemCard: { gap: 8 },
  itemTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  arrowWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceAlt },
  title: { color: colors.text, fontSize: 19, fontWeight: "900", textAlign: "right" },
  meta: { marginTop: 2, color: colors.textSoft, textAlign: "right" },
  message: { marginTop: 6, color: colors.text, textAlign: "right", lineHeight: 22 },
});
