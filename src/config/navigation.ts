import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  CircleDollarSign,
  LayoutDashboard,
  Package,
  ReceiptText,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  priority?: boolean;
};

export const navigation: NavigationItem[] = [
  { label: "Início", href: "/inicio", icon: LayoutDashboard },
  { label: "Nova venda", href: "/vendas/nova", icon: ShoppingBag, priority: true },
  { label: "Vendas", href: "/vendas", icon: ReceiptText },
  { label: "Produtos", href: "/produtos", icon: Package },
  { label: "Estoque", href: "/estoque", icon: Boxes },
  { label: "Financeiro", href: "/caixa", icon: CircleDollarSign },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Trocas", href: "/trocas", icon: ArrowLeftRight },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
];
