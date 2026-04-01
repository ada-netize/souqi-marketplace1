import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const colors = {
  bg: "#f6fbf8",
  surface: "#ffffff",
  text: "#0f1728",
  textSoft: "#5b677a",
  border: "#d8e7dc",
  primary: "#1f8f5f",
  primarySoft: "#e1f5eb",
  white: "#ffffff",
  danger: "#d54c4c",
};

function StatCard({ title, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

export default function ProfileScreen({ profile, onRefreshProfile, onLogout }) {
  const user = profile?.user;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{user?.full_name || "المستخدم"}</Text>
        <Text style={styles.heroText}>
          {user?.email || user?.phone || "بدون بيانات"}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard title="إعلاناتي" value={String(profile?.myListings?.length || 0)} />
        <StatCard title="مفضلتي" value={String(profile?.favorites?.length || 0)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>معلومات الحساب</Text>
        <Text style={styles.cardText}>الهاتف: {user?.phone || "—"}</Text>
        <Text style={styles.cardText}>المدينة: {user?.city_id || "—"}</Text>
        <Text style={styles.cardText}>النوع: {user?.role || "—"}</Text>
        <Text style={styles.cardText}>موثّق: {user?.is_verified ? "نعم" : "لا"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>إعلاناتي</Text>
        {(profile?.myListings || []).length === 0 ? (
          <Text style={styles.cardText}>لا توجد إعلانات بعد.</Text>
        ) : (
          (profile?.myListings || []).map((item) => (
            <View key={item.id} style={styles.rowItem}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>
                {Number(item.price || 0).toLocaleString()} ₪ • {item.status}
              </Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onRefreshProfile} activeOpacity={0.9}>
        <Text style={styles.primaryBtnText}>تحديث الحساب</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.9}>
        <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "right",
  },
  heroText: {
    color: "#eafff2",
    fontSize: 14,
    marginTop: 8,
    textAlign: "right",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
  },
  statValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "right",
  },
  statTitle: {
    color: colors.textSoft,
    fontSize: 13,
    marginTop: 6,
    textAlign: "right",
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 10,
  },
  cardText: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
    marginBottom: 6,
  },
  rowItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2ee",
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "right",
  },
  rowMeta: {
    color: colors.textSoft,
    fontSize: 13,
    marginTop: 6,
    textAlign: "right",
  },
  primaryBtn: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  logoutBtn: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#f1caca",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "800",
  },
});
