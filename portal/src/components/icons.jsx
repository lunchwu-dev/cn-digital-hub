/**
 * 图标注册表：统一使用 @ant-design/icons 的 Outlined 线性系列。
 * 24×24 网格、round cap / round join 由 antd 图标保证；尺寸由使用处控制（16 / 20 / 24）。
 */
import {
  AreaChartOutlined,
  DeploymentUnitOutlined,
  RadarChartOutlined,
  ShopOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  FileSearchOutlined,
  BellOutlined,
  PieChartOutlined,
  ToolOutlined,
  ApiOutlined,
  CloudServerOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

export const ICONS = {
  AreaChartOutlined,
  DeploymentUnitOutlined,
  RadarChartOutlined,
  ShopOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  FileSearchOutlined,
  BellOutlined,
  PieChartOutlined,
  ToolOutlined,
  ApiOutlined,
  CloudServerOutlined,
  AppstoreOutlined,
};

export function IconByName({ name, style }) {
  const Cmp = ICONS[name] || ToolOutlined;
  return <Cmp style={style} />;
}
