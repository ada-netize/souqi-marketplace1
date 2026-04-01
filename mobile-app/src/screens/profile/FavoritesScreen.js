import React from "react";
import { StyleSheet } from "react-native";
import { Screen, SectionHeader, EmptyState, Card } from "../../components/ui";
import ListingCard from "../../components/ListingCard";
import { useApp } from "../../auth-context";
import { spacing, colors } from "../../theme";

export default function FavoritesScreen({ navigation }) {
  const { profile, favoriteToggle } = useApp();
  const favorites = profile?.favorites || [];
  const favoriteIds = new Set(profile?.favoriteIds || []);

  return (
    <Screen scroll contentStyle={styles.container}>
      <Card style={styles.heroCard}><SectionHeader title="المفضلة" subtitle="كل الإعلانات التي حفظتها بشكل مرتب لتعود إليها بسرعة." /></Card>
      {favorites.length === 0 ? <EmptyState title="مفضلتك فارغة" text="احفظ الإعلانات المهمة لتعود لها بسرعة." /> : null}
      {favorites.map((item) => <ListingCard key={item.id} item={item} favorite={favoriteIds.has(item.id)} onPress={() => navigation.navigate("ListingDetails", { id: item.id })} onFav={() => favoriteToggle(item.id)} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({ container: { padding: spacing.lg, gap: spacing.lg }, heroCard: { backgroundColor: colors.primarySofter } });
