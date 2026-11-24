import {
  Box,
  ChartNoAxesColumnIncreasing,
  Cloud,
  CodeXml,
  Cpu,
  Database,
  Layers,
  Network,
  Rocket,
  Settings,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react';
const icons = {
  box: Box,
  chart: ChartNoAxesColumnIncreasing,
  cloud: Cloud,
  code: CodeXml,
  cpu: Cpu,
  database: Database,
  layers: Layers,
  network: Network,
  rocket: Rocket,
  settings: Settings,
  shield: ShieldCheck,
  target: Target,
  zap: Zap,
};
export function Icon({ name }: { name: keyof typeof icons }) {
  const Component = icons[name];
  return <Component aria-hidden="true" strokeWidth={1.7} />;
}
