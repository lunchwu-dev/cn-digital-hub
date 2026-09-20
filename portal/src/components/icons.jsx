/**
 * 图标注册表：统一使用 @ant-design/icons 的 Outlined 线性系列。
 * 24×24 网格、round cap / round join 由 antd 图标保证；尺寸由使用处控制（16 / 20 / 24）。
 *
 * ★ 纪律：只登记 Outlined 线性系列（含 LikeOutlined）。**不得登记 Filled 面版图标**
 *   （如 LikeFilled）——「状态」一律靠颜色 / 底色 / 形状结构表达，不靠线↔面切换。
 *   例：TagLike 的「已点赞」态 = LikeOutlined + c.brand 色 + c.brandSubtle 胶囊底。
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
  LikeOutlined,
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
  LikeOutlined,
};

export function IconByName({ name, style }) {
  const Cmp = ICONS[name] || ToolOutlined;
  return <Cmp style={style} />;
}
