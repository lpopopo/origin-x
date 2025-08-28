# 底部菜单栏图标说明

为了确保底部菜单栏正常显示，请在 `src/assets/` 目录下放置以下图标文件：

## 必需的图标文件

### 首页图标
- `home.png` - 首页未选中状态图标
- `home-active.png` - 首页选中状态图标

### 工作台图标
- `workspace.png` - 工作台未选中状态图标
- `workspace-active.png` - 工作台选中状态图标

### 我的图标
- `profile.png` - 我的未选中状态图标
- `profile-active.png` - 我的选中状态图标

## 图标规格建议

- **尺寸**: 81x81 像素
- **格式**: PNG（支持透明背景）
- **风格**: 线性图标，简洁明了
- **颜色**: 
  - 未选中状态：建议使用 #7A7E83
  - 选中状态：建议使用 #3cc51f

## 图标来源

您可以使用以下方式获取图标：

1. **图标库**: 
   - [Iconfont](https://www.iconfont.cn/)
   - [Feather Icons](https://feathericons.com/)
   - [Heroicons](https://heroicons.com/)

2. **设计工具**:
   - Figma
   - Sketch
   - Adobe Illustrator

3. **在线生成器**:
   - [Favicon.io](https://favicon.io/)
   - [Icons8](https://icons8.com/)

## 注意事项

- 确保图标文件名与 `src/app.config.ts` 中的配置完全一致
- 图标文件大小建议控制在 10KB 以内
- 测试时确保图标在不同设备上显示清晰
