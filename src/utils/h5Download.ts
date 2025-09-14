/**
 * H5环境下的图片下载工具
 * 提供跨浏览器的图片下载功能
 */

export class H5DownloadUtils {
  /**
   * 检测当前环境是否为H5
   * @returns 是否为H5环境
   */
  static isH5(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined'
  }

  /**
   * 通过a标签下载图片
   * @param url 图片URL
   * @param filename 文件名（可选）
   */
  static downloadImageByLink(url: string, filename?: string): void {
    if (!this.isH5()) {
      console.warn('当前环境不支持H5下载')
      return
    }

    try {
      const link = document.createElement('a')
      link.href = url
      link.download = filename || this.generateFilename(url)
      link.target = '_blank'
      
      // 添加到DOM中触发下载
      document.body.appendChild(link)
      link.click()
      
      // 清理DOM
      document.body.removeChild(link)
    } catch (error) {
      console.error('下载图片失败:', error)
      throw error
    }
  }

  /**
   * 通过fetch下载图片并保存
   * @param url 图片URL
   * @param filename 文件名（可选）
   */
  static async downloadImageByFetch(url: string, filename?: string): Promise<void> {
    if (!this.isH5()) {
      console.warn('当前环境不支持H5下载')
      return
    }

    try {
      // 获取图片数据
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      
      // 创建下载链接
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || this.generateFilename(url)
      
      // 添加到DOM中触发下载
      document.body.appendChild(link)
      link.click()
      
      // 清理
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('下载图片失败:', error)
      throw error
    }
  }

  /**
   * 生成文件名
   * @param url 图片URL
   * @returns 生成的文件名
   */
  static generateFilename(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const extension = pathname.split('.').pop() || 'jpg'
      const timestamp = new Date().getTime()
      return `image_${timestamp}.${extension}`
    } catch {
      const timestamp = new Date().getTime()
      return `image_${timestamp}.jpg`
    }
  }

  /**
   * 检测浏览器是否支持下载功能
   * @returns 是否支持下载
   */
  static supportsDownload(): boolean {
    if (!this.isH5()) return false
    
    const link = document.createElement('a')
    return typeof link.download !== 'undefined'
  }

  /**
   * 检测浏览器是否支持fetch
   * @returns 是否支持fetch
   */
  static supportsFetch(): boolean {
    return typeof fetch !== 'undefined'
  }

  /**
   * 检测浏览器是否支持Blob
   * @returns 是否支持Blob
   */
  static supportsBlob(): boolean {
    return typeof Blob !== 'undefined'
  }

  /**
   * 智能下载图片（自动选择最佳下载方式）
   * @param url 图片URL
   * @param filename 文件名（可选）
   * @returns Promise<void>
   */
  static async smartDownloadImage(url: string, filename?: string): Promise<void> {
    if (!this.isH5()) {
      throw new Error('当前环境不支持H5下载')
    }

    // 优先使用fetch方式（支持跨域和更好的错误处理）
    if (this.supportsFetch() && this.supportsBlob()) {
      try {
        await this.downloadImageByFetch(url, filename)
        return
      } catch (error) {
        console.warn('Fetch下载失败，尝试使用链接下载:', error)
      }
    }

    // 降级到链接下载
    this.downloadImageByLink(url, filename)
  }

  /**
   * 检查图片URL是否可访问
   * @param url 图片URL
   * @returns Promise<boolean>
   */
  static async checkImageAccessibility(url: string): Promise<boolean> {
    if (!this.isH5()) return false

    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 获取图片信息
   * @param url 图片URL
   * @returns Promise<{width: number, height: number, size: number}>
   */
  static async getImageInfo(url: string): Promise<{width: number, height: number, size: number}> {
    if (!this.isH5()) {
      throw new Error('当前环境不支持获取图片信息')
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = async () => {
        try {
          // 获取图片大小
          const response = await fetch(url)
          const blob = await response.blob()
          
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
            size: blob.size
          })
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = url
    })
  }

  /**
   * 批量下载图片
   * @param urls 图片URL数组
   * @param baseFilename 基础文件名
   * @returns Promise<void[]>
   */
  static async batchDownloadImages(urls: string[], baseFilename: string = 'images'): Promise<void[]> {
    const downloadPromises = urls.map((url, index) => {
      const filename = `${baseFilename}_${index + 1}`
      return this.smartDownloadImage(url, filename)
    })

    return Promise.all(downloadPromises)
  }

  /**
   * 显示下载进度
   * @param url 图片URL
   * @param onProgress 进度回调
   * @param filename 文件名（可选）
   * @returns Promise<void>
   */
  static async downloadWithProgress(
    url: string, 
    onProgress: (progress: number) => void,
    filename?: string
  ): Promise<void> {
    if (!this.isH5()) {
      throw new Error('当前环境不支持H5下载')
    }

    try {
      onProgress(0)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0
      
      const reader = response.body && response.body.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      let received = 0
      const chunks: Uint8Array[] = []

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        chunks.push(value)
        received += value.length
        
        if (total > 0) {
          const progress = (received / total) * 100
          onProgress(Math.min(progress, 100))
        }
      }

      onProgress(100)
      
      // 合并chunks并创建blob
      const blob = new Blob(chunks)
      const downloadUrl = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || this.generateFilename(url)
      
      document.body.appendChild(link)
      link.click()
      
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('下载图片失败:', error)
      throw error
    }
  }
}
