import { CATEGORY_OPTIONS, type Category } from "@/lib/categories";

import {
  BagIcon,
  BoltIcon,
  BusIcon,
  CupIcon,
  DotsIcon,
  FilmIcon,
  FoodIcon,
  HeartPulseIcon,
  HomeIcon,
  IncomeIcon,
  WifiIcon,
} from "@/components/shared/icons";

const ICON_BY_CATEGORY: Record<Category, typeof FoodIcon> = {
  FOOD: FoodIcon,
  INTERNET: WifiIcon,
  DRINKS: CupIcon,
  TRANSPORT: BusIcon,
  RENT: HomeIcon,
  UTILITIES: BoltIcon,
  HEALTH: HeartPulseIcon,
  ENTERTAINMENT: FilmIcon,
  SHOPPING: BagIcon,
  OTHER: DotsIcon,
};

const CATEGORY_BY_LABEL = new Map(
  CATEGORY_OPTIONS.map((option) => [option.label, option.value]),
);

/**
 * Icon for a transaction row, matched from the category label it already
 * shows (income rows get the income icon).
 */
export function TransactionIcon({
  kind,
  label,
  size = 18,
}: {
  kind: "expense" | "income";
  label: string;
  size?: number;
}) {
  if (kind === "income") {
    return <IncomeIcon size={size} />;
  }

  const category = CATEGORY_BY_LABEL.get(label);
  const Icon = category ? ICON_BY_CATEGORY[category] : DotsIcon;

  return <Icon size={size} />;
}
