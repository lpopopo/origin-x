import Taro from '@tarojs/taro';

// 平台检测
export const PlatformUtils = {
  // 检测是否为微信小程序
  isWeapp(): boolean {
    return process.env.TARO_ENV === 'weapp';
  },

  // 检测是否为H5
  isH5(): boolean {
    return process.env.TARO_ENV === 'h5';
  },

  // 检测是否为支付宝小程序
  isAlipay(): boolean {
    return process.env.TARO_ENV === 'alipay';
  },

  // 检测是否为字节跳动小程序
  isTt(): boolean {
    return process.env.TARO_ENV === 'tt';
  },

  // 获取平台名称
  getPlatformName(): string {
    return process.env.TARO_ENV || 'unknown';
  }
};

// 网络状态检测
export const NetworkUtils = {
  // 检查网络状态
  async checkNetworkStatus(): Promise<boolean> {
    try {
      const networkType = await Taro.getNetworkType();
      return networkType.networkType !== 'none';
    } catch (error) {
      console.error('检查网络状态失败:', error);
      return false;
    }
  },

  // 监听网络状态变化
  onNetworkStatusChange(callback: (isConnected: boolean) => void) {
    Taro.onNetworkStatusChange((res) => {
      callback(res.isConnected);
    });
  }
};
