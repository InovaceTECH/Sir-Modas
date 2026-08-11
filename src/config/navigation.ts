import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  CircleDollarSign,
  LayoutDashboard,
  Package,
  Settings,
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
  { label: "Produtos", href: "/produtos", icon: Package },
  { label: "Estoque", href: "/estoque", icon: Boxes },
  { label: "Caixa", href: "/caixa", icon: CircleDollarSign },
  { label: "Clientes e fiado", href: "/clientes", icon: Users },
  { label: "Trocas", href: "/trocas", icon: ArrowLeftRight },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];
