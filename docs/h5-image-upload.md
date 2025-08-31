# H5环境下的图片上传功能

## 概述

本项目已经全面兼容H5环境下的图片上传功能，提供了比传统小程序环境更丰富的用户体验。

## 主要特性

### 1. 跨平台兼容性
- **H5环境**: 使用原生HTML5文件API，支持拖拽上传
- **小程序环境**: 使用Taro的图片选择API
- **自动检测**: 根据运行环境自动选择合适的上传方式

### 2. H5环境特有功能

#### 文件选择器
- 支持点击选择图片文件
- 支持拖拽上传图片
- 文件类型验证（jpg, png, gif, webp, svg, bmp）
- 文件大小限制（默认10MB）

#### 拖拽上传
- 拖拽图片到上传区域即可上传
- 拖拽状态视觉反馈
- 支持多文件拖拽（自动选择第一个）

#### 文件预览
- 实时文件信息显示
- 文件名和大小展示
- 图片预览功能

### 3. 上传体验优化

#### 进度显示
- 实时上传进度条
- 百分比显示
- 上传状态提示

#### 错误处理
- 详细的错误信息显示
- 错误清除功能
- 用户友好的错误提示

#### 文件验证
- 文件类型检查
- 文件大小验证
- 自动错误提示

## 技术实现

### 核心文件

1. **`src/utils/h5Upload.ts`** - H5环境专用上传工具
2. **`src/services/upload.ts`** - 跨平台上传服务
3. **`src/pages/workspace/index.tsx`** - 主界面实现
4. **`src/pages/workspace/index.less`** - 样式文件

### 关键类和方法

#### H5UploadUtils
```typescript
// 文件选择
static async chooseFiles(accept: string, multiple: boolean): Promise<File[]>

// 文件验证
static isValidImage(file: File): boolean
static checkFileSize(file: File, maxSize: number): boolean

// 拖拽支持
static enableDragAndDrop(element: HTMLElement, onFiles: Function): Function

// 图片压缩
static async compressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File>
```

#### UploadService
```typescript
// 跨平台上传
static async uploadImage(filePath: string | File, filename: string, onProgress?: Function): Promise<{imageUrl: string, objectKey: string}>
```

## 使用方法

### 1. 点击上传
```typescript
// 点击上传按钮选择图片
const handleChooseImage = async () => {
  if (isH5) {
    const files = await H5UploadUtils.chooseFiles('image/*', false)
    if (files.length > 0) {
      await handleFileUpload(files[0])
    }
  }
}
```

### 2. 拖拽上传
```typescript
// 启用拖拽上传
useEffect(() => {
  if (isH5 && uploadAreaRef.current) {
    const cleanup = H5UploadUtils.enableDragAndDrop(
      uploadAreaRef.current,
      handleDragAndDrop
    )
    return cleanup
  }
}, [isH5])

// 处理拖拽文件
const handleDragAndDrop = async (files: File[]) => {
  if (files.length > 0) {
    await handleFileUpload(files[0])
  }
}
```

### 3. 文件验证
```typescript
// 验证文件类型和大小
if (!H5UploadUtils.isValidImage(file)) {
  throw new Error('不支持的文件类型')
}

if (!H5UploadUtils.checkFileSize(file, 10 * 1024 * 1024)) {
  throw new Error('文件大小不能超过10MB')
}
```

## 样式定制

### 拖拽状态样式
```less
.upload-section.drag-over {
  border: 2px dashed #007AFF;
  background-color: #f0f8ff;
  border-radius: 12px;
  padding: 16px;
}
```

### 进度条样式
```less
.upload-progress {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}
```

### 错误提示样式
```less
.upload-error {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
}
```

## 浏览器兼容性

### 支持的浏览器
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### 必需特性
- File API
- Drag and Drop API
- Canvas API (用于图片压缩)
- Fetch API (用于网络请求)

## 性能优化

### 1. 图片压缩
- 自动检测图片尺寸
- 可配置压缩参数
- 减少上传时间和带宽

### 2. 内存管理
- 及时释放预览URL
- 清理拖拽事件监听器
- 避免内存泄漏

### 3. 用户体验
- 异步处理不阻塞UI
- 进度反馈
- 错误恢复机制

## 故障排除

### 常见问题

1. **拖拽不工作**
   - 检查浏览器是否支持Drag and Drop API
   - 确认元素是否正确绑定事件

2. **文件类型不支持**
   - 检查文件扩展名和MIME类型
   - 确认支持的文件格式

3. **上传失败**
   - 检查网络连接
   - 确认文件大小限制
   - 查看控制台错误信息

### 调试技巧

```typescript
// 启用详细日志
console.log('当前环境:', Taro.getEnv())
console.log('文件信息:', file)
console.log('上传进度:', progress)
```

## 未来改进

1. **批量上传**: 支持多文件同时上传
2. **断点续传**: 大文件上传支持
3. **图片编辑**: 内置图片裁剪和滤镜
4. **云存储**: 支持多种云存储服务
5. **离线支持**: PWA离线上传功能

## 总结

H5环境下的图片上传功能提供了比传统小程序更丰富的用户体验，包括拖拽上传、实时进度、文件验证等特性。通过合理的架构设计和错误处理，确保了功能的稳定性和易用性。
