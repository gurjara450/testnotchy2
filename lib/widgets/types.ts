import { LucideIcon } from "lucide-react";

export interface WidgetProps {
  id: string;
  // Add any common widget props here
}

export interface Widget<T extends WidgetProps = WidgetProps> {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  component: React.ComponentType<T>;
  defaultProps?: Partial<T>;
}

export interface WidgetInstance<T extends WidgetProps = WidgetProps> {
  id: string;
  widgetType: string;
  props?: Partial<T>;
  position: number;
} 