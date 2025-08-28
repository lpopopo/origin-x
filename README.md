# Origin-X

一个支持H5和小程序的现代化应用，包含底部菜单栏导航。

## 功能特性

- 🏠 **首页** - 欢迎页面和功能概览
- 🖼️ **工作台** - 图片上传和管理功能
- 👤 **我的** - 用户信息和设置

## 底部菜单栏

应用底部包含三个主要导航选项：

1. **首页** - 展示应用概览和主要功能
2. **工作台** - 提供图片上传、编辑和管理功能
3. **我的** - 显示用户信息、统计数据和设置选项

## 技术特点

- 使用 **vw** 和 **vh** 作为CSS单位，确保在不同设备上的响应式显示
- 支持H5和小程序环境
- 现代化的UI设计，包含渐变背景和卡片式布局
- 响应式网格系统，适配不同屏幕尺寸

## 页面结构

```
src/
├── pages/
│   ├── index/          # 首页
│   ├── workspace/      # 工作台
│   ├── profile/        # 我的
│   ├── login/          # 登录
│   └── register/       # 注册
├── components/         # 公共组件
├── stores/            # 状态管理
└── assets/            # 静态资源
```

## 开发说明

### CSS单位使用
- **vw** (viewport width): 用于水平方向的尺寸，如宽度、边距、字体大小
- **vh** (viewport height): 用于垂直方向的尺寸，如高度、内边距

### 底部菜单配置
在 `src/app.config.ts` 中配置底部菜单栏：

```typescript
tabBar: {
  list: [
    { pagePath: 'pages/index/index', text: '首页' },
    { pagePath: 'pages/workspace/index', text: '工作台' },
    { pagePath: 'pages/profile/index', text: '我的' }
  ]
}
```

## 运行项目

```bash
# 安装依赖
npm install

# 开发模式
npm run dev:weapp    # 微信小程序
npm run dev:h5       # H5
npm run dev:swan     # 百度小程序
npm run dev:alipay   # 支付宝小程序
npm run dev:tt       # 字节跳动小程序
npm run dev:qq       # QQ小程序
npm run dev:jd       # 京东小程序
```

## 注意事项

- 确保在 `src/assets/` 目录下放置相应的图标文件
- 图标命名应与 `app.config.ts` 中的配置保持一致
- 建议使用 81x81 像素的PNG格式图标
