/**
 * H5环境下的图片上传工具
 * 提供更好的文件选择、预览和上传体验
 */

export interface H5FileInfo {
  file: File
  name: string
  size: number
  type: string
  previewUrl: string
}

export class H5UploadUtils {
  /**
   * 创建文件选择器
   * @param accept 接受的文件类型
   * @param multiple 是否支持多选
   * @returns Promise<File[]>
   */
  static async chooseFiles(accept: string = 'image/*', multiple: boolean = false): Promise<File[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.multiple = multiple
      
      input.onchange = (event) => {
        const target = event.target as HTMLInputElement
        if (target.files && target.files.length > 0) {
          resolve(Array.from(target.files))
        } else {
          reject(new Error('未选择文件'))
        }
      }
      
      input.onerror = () => {
        reject(new Error('文件选择失败'))
      }
      
      input.click()
    })
  }

  /**
   * 验证文件是否为有效的图片
   * @param file 文件对象
   * @returns 是否为有效图片
   */
  static isValidImage(file: File): boolean {
    const validTypes = [
      'image/jpeg',
      'image/png'
    ]

    const validExtensions = ['jpg', 'jpeg', 'png']
    const ext = file.name.toLowerCase().split('.').pop() || ''

    return validTypes.includes(file.type) || validExtensions.includes(ext)
  }

  /**
   * 检查文件大小
   * @param file 文件对象
   * @param maxSize 最大文件大小（字节）
   * @returns 是否在限制范围内
   */
  static checkFileSize(file: File, maxSize: number = 10 * 1024 * 1024): boolean {
    return file.size <= maxSize
  }

  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @returns 格式化后的文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 创建文件预览URL
   * @param file 文件对象
   * @returns 预览URL
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  }

  /**
   * 释放预览URL
   * @param url 预览URL
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }

  /**
   * 压缩图片（如果文件过大）
   * @param file 原始文件
   * @param maxWidth 最大宽度
   * @param maxHeight 最大高度
   * @param quality 压缩质量 (0-1)
   * @returns 压缩后的文件
   */
  static async compressImage(
    file: File, 
    maxWidth: number = 1920, 
    maxHeight: number = 1080, 
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        try {
          // 计算压缩后的尺寸
          let { width, height } = img
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }
          
          // 设置canvas尺寸
          canvas.width = width
          canvas.height = height
          
          // 绘制压缩后的图片
          ctx && ctx.drawImage(img, 0, 0, width, height)
          
          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // 创建新的File对象
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                })
                resolve(compressedFile)
              } else {
                reject(new Error('图片压缩失败'))
              }
            },
            file.type,
            quality
          )
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 获取文件信息
   * @param file 文件对象
   * @returns 文件信息
   */
  static getFileInfo(file: File): H5FileInfo {
    return {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: this.createPreviewUrl(file)
    }
  }

  /**
   * 批量处理文件
   * @param files 文件列表
   * @param processor 处理函数
   * @returns 处理后的文件列表
   */
  static async processFiles<T>(
    files: File[], 
    processor: (file: File) => Promise<T>
  ): Promise<T[]> {
    const results: T[] = []
    
    for (const file of files) {
      try {
        const result = await processor(file)
        results.push(result)
      } catch (error) {
        console.error(`处理文件 ${file.name} 失败:`, error)
      }
    }
    
    return results
  }

  /**
   * 拖拽上传支持
   * @param element 拖拽目标元素
   * @param onFiles 文件处理回调
   * @param accept 接受的文件类型
   */
  static enableDragAndDrop(
    element: HTMLElement, 
    onFiles: (files: File[]) => void,
    accept: string = 'image/*'
  ): () => void {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      element.style.borderColor = '#007AFF'
      element.style.backgroundColor = '#f0f8ff'
    }
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      element.style.borderColor = ''
      element.style.backgroundColor = ''
    }
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      element.style.borderColor = ''
      element.style.backgroundColor = ''
      
      const files = Array.from((e.dataTransfer && e.dataTransfer.files) || [])
      const imageFiles = files.filter(file => this.isValidImage(file))
      
      if (imageFiles.length > 0) {
        onFiles(imageFiles)
      }
    }
    
    element.addEventListener('dragover', handleDragOver)
    element.addEventListener('dragleave', handleDragLeave)
    element.addEventListener('drop', handleDrop)
    
    // 返回清理函数
    return () => {
      element.removeEventListener('dragover', handleDragOver)
      element.removeEventListener('dragleave', handleDragLeave)
      element.removeEventListener('drop', handleDrop)
    }
  }
}
