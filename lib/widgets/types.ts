import { LucideIcon } from "lucide-react";

export interface Widget {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  component: React.ComponentType<any>;
  defaultProps?: Record<string, any>;
}

export interface WidgetInstance {
  id: string;
  widgetType: string;
  props?: Record<string, any>;
  position: number;
} 