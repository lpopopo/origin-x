import React from 'react';
import './DesignSystemDemo.less';

const DesignSystemDemo: React.FC = () => {
  return (
    <div className="design-system-demo">
      <div className="demo-section">
        <h2 className="section-title">颜色系统</h2>
        <div className="color-grid">
          <div className="color-item">
            <div className="color-swatch bg-primary"></div>
            <span className="color-name">主背景</span>
          </div>
          <div className="color-item">
            <div className="color-swatch bg-secondary"></div>
            <span className="color-name">次背景</span>
          </div>
          <div className="color-item">
            <div className="color-swatch bg-card"></div>
            <span className="color-name">卡片背景</span>
          </div>
          <div className="color-item">
            <div className="color-swatch primary-gradient"></div>
            <span className="color-name">主渐变色</span>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h2 className="section-title">按钮组件</h2>
        <div className="button-group">
          <button className="btn btn-primary">主要按钮</button>
          <button className="btn btn-secondary">次要按钮</button>
          <button className="btn btn-ghost">幽灵按钮</button>
          <button className="btn btn-danger">危险按钮</button>
        </div>
        <div className="button-group">
          <button className="btn btn-primary btn-sm">小按钮</button>
          <button className="btn btn-primary">标准按钮</button>
          <button className="btn btn-primary btn-lg">大按钮</button>
        </div>
      </div>

      <div className="demo-section">
        <h2 className="section-title">输入框组件</h2>
        <div className="input-group">
          <label className="input-label">标准输入框</label>
          <input className="input" placeholder="请输入内容..." />
        </div>
        <div className="input-group">
          <label className="input-label">错误状态</label>
          <input className="input input-error" placeholder="错误输入框" />
          <span className="input-error-text">请输入有效的内容</span>
        </div>
      </div>

      <div className="demo-section">
        <h2 className="section-title">卡片组件</h2>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">卡片标题</h3>
            <p className="card-subtitle">卡片副标题</p>
          </div>
          <div className="card-body">
            <p>这是卡片的内容区域，可以包含任何内容。</p>
          </div>
          <div className="card-footer">
            <button className="btn btn-secondary">取消</button>
            <button className="btn btn-primary">确认</button>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h2 className="section-title">徽章组件</h2>
        <div className="badge-group">
          <span className="badge badge-primary">主要</span>
          <span className="badge badge-secondary">次要</span>
          <span className="badge badge-success">成功</span>
          <span className="badge badge-warning">警告</span>
          <span className="badge badge-error">错误</span>
        </div>
      </div>

      <div className="demo-section">
        <h2 className="section-title">加载状态</h2>
        <div className="loading-group">
          <span className="loading"></span>
          <span>加载中...</span>
        </div>
      </div>

      <div className="demo-section">
        <h2 className="section-title">工具提示</h2>
        <div className="tooltip-group">
          <span className="tooltip">
            悬停查看提示
            <span className="tooltip-content">这是一个工具提示</span>
          </span>
        </div>
      </div>

      <div className="demo-section">
        <h2 className="section-title">空状态</h2>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3 className="empty-title">暂无数据</h3>
          <p className="empty-description">当前没有可显示的内容</p>
        </div>
      </div>

      <div className="demo-section">
        <h2 className="section-title">文字样式</h2>
        <div className="text-group">
          <h1 className="text-4xl font-bold">超大标题</h1>
          <h2 className="text-3xl font-semibold">大标题</h2>
          <h3 className="text-2xl font-medium">中标题</h3>
          <h4 className="text-xl">小标题</h4>
          <p className="text-base">正文内容</p>
          <p className="text-sm text-secondary">小号文字</p>
          <p className="text-xs text-tertiary">辅助文字</p>
        </div>
      </div>

      <div className="demo-section">
        <h2 className="section-title">间距工具类</h2>
        <div className="spacing-demo">
          <div className="spacing-item m-xs">小间距</div>
          <div className="spacing-item m-sm">小间距</div>
          <div className="spacing-item m-md">中等间距</div>
          <div className="spacing-item m-lg">大间距</div>
          <div className="spacing-item m-xl">特大间距</div>
        </div>
      </div>
    </div>
  );
};

export default DesignSystemDemo;
