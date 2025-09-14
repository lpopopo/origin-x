import Taro from '@tarojs/taro';
import { decodeURIComponentRecursive } from '../utils/decode';
import { RequestService } from '../utils/request';

// 获取上传URL的接口响应类型
interface UploadUrlResponse {
    uploadUrl: string;
    imageUrl: string;
}

// 上传进度回调类型
interface UploadProgressCallback {
  (progress: number): void;
}

// 图片上传服务
export class UploadService {
  
  /**
   * 获取图片上传的预设地址
   * @param filename 文件名
   * @returns 上传URL和对象键
   */
    static async getUploadUrl(filename: string): Promise<UploadUrlResponse> {
        const contentType = this.getContentType(filename);
        const headers = {
            'Content-Type': contentType,
        }
    try {
      return await RequestService.get<UploadUrlResponse>(`/upload?filename=${encodeURIComponent(filename)}`, { header: headers });
    } catch (error) {
      console.error('获取上传地址失败:', error);
      throw error;
    }
  }

  /**
   * 根据文件扩展名获取Content-Type
   * @param filename 文件名
   * @returns Content-Type
   */
  static getContentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'svg':
        return 'image/svg+xml';
      case 'bmp':
        return 'image/bmp';
      default:
        return 'image/jpeg';
    }
  }

  /**
   * 验证文件是否为有效的图片文件
   * @param file 文件对象或文件路径
   * @returns 是否为有效图片
   */
  static isValidImageFile(file: File | string): boolean {
    if (typeof file === 'string') {
      // 小程序环境：检查文件扩展名
      const ext = file.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '');
    } else {
      // H5环境：检查MIME类型和扩展名
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
      
      const ext = file.name.toLowerCase().split('.').pop() || '';
      return validTypes.includes(file.type) || validExtensions.includes(ext);
    }
  }

  /**
   * 获取文件大小（以字节为单位）
   * @param file 文件对象或文件路径
   * @returns 文件大小
   */
  static getFileSize(file: File | string): number {
    if (typeof file === 'string') {
      // 小程序环境：无法直接获取文件大小，返回0
      return 0;
    } else {
      // H5环境：直接获取文件大小
      return file.size;
    }
  }

  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @returns 格式化后的文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 读取文件数据（跨平台兼容）
   * @param filePath 文件路径或File对象
   * @returns 文件数据
   */
  static async readFileData(filePath: string | File): Promise<ArrayBuffer> {
    // 检测当前环境
    const env = Taro.getEnv();
    
    if (env === Taro.ENV_TYPE.WEB) {
      // H5环境：直接使用File对象
      if (filePath instanceof File) {
        return await filePath.arrayBuffer();
      } else {
        throw new Error('H5环境下需要传入File对象');
      }
    } else {
      // 小程序环境：使用文件系统管理器
      const fileSystemManager = Taro.getFileSystemManager();
      return await new Promise<ArrayBuffer>((resolve, reject) => {
        fileSystemManager.readFile({
          filePath: filePath as string,
          success: (res) => resolve(res.data as ArrayBuffer),
          fail: reject
        });
      });
    }
  }

  /**
   * 上传图片到图床（支持进度回调）
   * @param uploadUrl 上传地址
   * @param filePath 本地文件路径或File对象
   * @param filename 文件名
   * @param onProgress 上传进度回调
   * @returns 上传结果
   */
  static async uploadImageToBed(
    uploadUrl: string, 
    filePath: string | File, 
    filename: string,
    onProgress?: UploadProgressCallback
  ): Promise<void> {
    try {
      // 读取文件为二进制数据
      const fileData = await this.readFileData(filePath);

      // 根据文件名获取Content-Type
      const contentType = this.getContentType(filename);
      
      // 使用普通对象而不是Headers类，提高兼容性
      const headers: Record<string, string> = {
        "Content-Type": contentType
      };

      const requestOptions: RequestInit = {
        method: "PUT",
        headers: headers,
        body: fileData,
        redirect: "follow" as RequestRedirect,
        // 添加CORS相关配置
        mode: 'cors',
        credentials: 'omit'
      };

      // 注意：不要解码OSS签名URL，直接使用原始URL
      const uploadResult = await fetch(decodeURIComponentRecursive(uploadUrl), requestOptions);

      // 检查响应状态
      if (!uploadResult.ok) {
        const errorText = await uploadResult.text();
        throw new Error(`图片上传失败: ${uploadResult.status} ${uploadResult.statusText} - ${errorText}`);
      }

      // 模拟上传进度（实际的上传进度需要服务端支持）
      if (onProgress) {
        onProgress(100);
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      throw error;
    }
  }

  /**
   * 完整的图片上传流程
   * @param filePath 本地文件路径或File对象
   * @param filename 文件名
   * @param onProgress 上传进度回调
   * @returns 图床URL
   */
  static async uploadImage(
    filePath: string | File, 
    filename: string,
    onProgress?: UploadProgressCallback
  ): Promise<{ imageUrl: string }> {
    try {
        // 1. 验证文件类型
        if (!this.isValidImageFile(filePath)) {
          throw new Error('不支持的文件类型，请选择有效的图片文件');
        }

        // 2. 检查文件大小（H5环境）
        if (typeof filePath === 'object') {
          const fileSize = this.getFileSize(filePath);
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (fileSize > maxSize) {
            throw new Error(`文件大小不能超过${this.formatFileSize(maxSize)}`);
          }
        }

        // 开发环境Mock逻辑
        if (process.env.NODE_ENV === 'development') {
          return this.mockUploadImage(onProgress);
        }

        // 3. 获取上传地址和预览地址
        const uploadConfig = await this.getUploadUrl(filename) 
        const { uploadUrl, imageUrl } = uploadConfig

        // 4. 上传图片到OSS
        await this.uploadImageToBed(uploadUrl, filePath, filename, onProgress);
        
        // 5. 返回预览地址
        return {
          imageUrl
        };
    } catch (error) {
      console.error('图片上传流程失败:', error);
      throw error;
    }
  }

  /**
   * 开发环境Mock上传
   * @param onProgress 上传进度回调
   * @returns Mock的图片URL
   */
  static async mockUploadImage(onProgress?: UploadProgressCallback): Promise<{ imageUrl: string }> {
    console.log('🔧 开发环境Mock上传，使用本地示例图片');
    
    // 模拟上传进度
    if (onProgress) {
      const progressSteps = [20, 40, 60, 80, 100];
      for (const progress of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 150));
        onProgress(progress);
      }
    } else {
      // 如果没有进度回调，也要模拟一下上传时间
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // 返回本地示例图片路径
    const imageUrl = 'https://img.52725.uno/assets/example.jpg';
    console.log('✅ Mock上传完成，图片地址:', imageUrl);
    
    return {
      imageUrl
    };
  }


  /**
   * H5环境下的文件选择器
   * @param accept 接受的文件类型
   * @param multiple 是否支持多选
   * @returns 选择的文件列表
   */
  static async chooseFileH5(accept: string = 'image/*', multiple: boolean = false): Promise<File[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.multiple = multiple;
      
      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          resolve(Array.from(target.files));
        } else {
          reject(new Error('未选择文件'));
        }
      };
      
      input.onerror = () => {
        reject(new Error('文件选择失败'));
      };
      
      input.click();
    });
  }
}
