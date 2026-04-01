import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Screen, Card, AppButton, AppInput, SectionHeader, Badge, EmptyState } from "../../components/ui";
import { useApp } from "../../auth-context";
import { request } from "../../api";
import { colors, spacing, radius } from "../../theme";
import { money } from "../../helpers";

export default function ConversationScreen({ route }) {
  const { token, startConversation, profile, refreshProfile, sendOffer, respondToOffer } = useApp();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const conversationId = route.params?.id;

  const load = async () => {
    try {
      const res = await request(`/api/user/conversations/${conversationId}`, {}, token);
      setData(res);
    } catch (error) {
      Alert.alert("خطأ", error?.message || "فشل تحميل المحادثة");
    }
  };

  useEffect(() => { load(); }, [conversationId]);
  const listingSold = String(data?.listing?.status || "") === "sold";
  const myUserId = profile?.user?.id;

  const send = async () => {
    try {
      if (!message.trim()) return Alert.alert("تنبيه", "اكتب رسالة أولاً");
      if (listingSold) return Alert.alert("تنبيه", "هذا الإعلان تم بيعه بالفعل");
      setLoading(true);
      await request(`/api/user/conversations/${conversationId}/messages`, { method: "POST", body: { message } }, token);
      setMessage("");
      await load();
      await refreshProfile();
    } catch (error) {
      Alert.alert("خطأ", error?.message || "فشل إرسال الرسالة");
    } finally { setLoading(false); }
  };

  const submitOffer = async () => {
    try {
      if (!offerAmount || Number(offerAmount) <= 0) return Alert.alert("تنبيه", "أدخل عرضًا صحيحًا");
      if (listingSold) return Alert.alert("تنبيه", "لا يمكن إرسال عرض على إعلان تم بيعه");
      setLoading(true);
      await request(`/api/user/offers`, { method: "POST", body: { listingId: data.listing.id, amount: Number(offerAmount) } }, token);
      setOfferAmount("");
      await load();
      await refreshProfile();
      Alert.alert("تم", "تم إرسال العرض بنجاح");
    } catch (error) { Alert.alert("خطأ", error?.message || "فشل إرسال العرض"); }
    finally { setLoading(false); }
  };

  const offers = useMemo(() => data?.offers || [], [data]);
  if (!data) return <Screen><View style={styles.centered}><Text style={styles.meta}>جارٍ تحميل المحادثة...</Text></View></Screen>;

  return (
    <Screen scroll contentStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Text style={styles.title}>{data.listing?.title}</Text>
        <Text style={styles.meta}>{data.otherUser?.full_name} • {data.messages?.length || 0} رسالة</Text>
        {listingSold ? <Text style={styles.soldText}>تم بيع هذا الإعلان، تم إغلاق التفاوض عليه داخل التطبيق.</Text> : null}
      </Card>

      <Card>
        <SectionHeader title="العروض" subtitle="إذا قبل البائع العرض يتحول الإعلان مباشرة إلى تم البيع." />
        {offers.length === 0 ? <EmptyState title="لا توجد عروض" text="عندما يتم إرسال عرض سعر سيظهر هنا." /> : offers.map((offer) => {
          const isMine = Number(offer.buyer_user_id) === Number(myUserId);
          return (
            <View key={offer.id} style={styles.offerBox}>
              <View style={styles.offerHeader}>
                <Badge title={isMine ? "عرضي" : "عرض وارد"} tone={offer.status === "accepted" ? "success" : offer.status === "rejected" ? "danger" : "warning"} />
                <Text style={styles.offerAmount}>{money(offer.amount)}</Text>
              </View>
              <Text style={styles.offerNote}>الحالة: {offer.status}</Text>
              {!isMine && offer.status === "pending" ? (
                <View style={styles.actionsRow}>
                  <AppButton title="قبول" onPress={async () => { await respondToOffer(offer.id, "accept"); await load(); }} style={styles.flexOne} />
                  <AppButton title="رفض" variant="secondary" onPress={async () => { await respondToOffer(offer.id, "reject"); await load(); }} style={styles.flexOne} />
                </View>
              ) : null}
            </View>
          );
        })}
      </Card>

      <Card>
        <SectionHeader title="الرسائل" subtitle="محادثة مرتبة وبسيطة بين الطرفين." />
        {(data.messages || []).length === 0 ? <EmptyState title="لا توجد رسائل" text="ابدأ أول رسالة في هذه المحادثة." /> : data.messages.map((item) => {
          const mine = Number(item.sender_user_id) === Number(myUserId);
          return (
            <View key={item.id} style={[styles.messageWrap, mine ? styles.mineWrap : styles.otherWrap]}>
              <View style={[styles.messageBubble, mine ? styles.mineBubble : styles.otherBubble]}>
                <Text style={styles.messageText}>{item.message}</Text>
                <Text style={styles.messageTime}>{item.created_at}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      {!listingSold ? (
        <Card>
          <SectionHeader title="إرسال رسالة أو عرض" subtitle="التواصل المباشر بين الطرفين فقط داخل سوقي." />
          <AppInput label="رسالتك" placeholder="اكتب رسالتك هنا" value={message} onChangeText={setMessage} multiline editable={!listingSold} />
          <AppButton title={loading ? "جارٍ الإرسال..." : "إرسال الرسالة"} onPress={send} loading={loading} disabled={listingSold} />
          <View style={styles.topGap} />
          <AppInput label="عرض السعر" placeholder="مثال: 2500" value={offerAmount} onChangeText={setOfferAmount} keyboardType="numeric" editable={!listingSold} />
          <AppButton title="إرسال عرض السعر" variant="secondary" onPress={submitOffer} disabled={listingSold} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  headerCard: { backgroundColor: colors.primarySofter },
  title: { color: colors.text, fontSize: 24, fontWeight: "900", textAlign: "right" },
  meta: { marginTop: 8, color: colors.textSoft, textAlign: "right" },
  soldText: { marginTop: spacing.sm, color: colors.warning, fontWeight: "800", textAlign: "right" },
  offerBox: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  offerHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  offerAmount: { color: colors.text, fontSize: 17, fontWeight: "900", textAlign: "right" },
  offerNote: { color: colors.textSoft, textAlign: "right", lineHeight: 22 },
  actionsRow: { flexDirection: "row-reverse", gap: spacing.sm },
  flexOne: { flex: 1 },
  messageWrap: { flexDirection: "row" },
  mineWrap: { justifyContent: "flex-start" },
  otherWrap: { justifyContent: "flex-end" },
  messageBubble: { maxWidth: "88%", borderRadius: radius.xl, paddingHorizontal: 16, paddingVertical: 14 },
  otherBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  mineBubble: { backgroundColor: colors.primarySoft },
  messageText: { color: colors.text, textAlign: "right", lineHeight: 23 },
  messageTime: { marginTop: 8, color: colors.textMuted, fontSize: 11, textAlign: "right" },
  topGap: { height: spacing.sm },
});
