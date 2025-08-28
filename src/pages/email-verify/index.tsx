import { View, Text, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { AuthService } from '../../services/auth';
import './index.less';

const EmailVerify: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const email = decodeURIComponent(router.params.email || '');
    if (!email) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }
    setEmail(email);
  }, [router.params.email]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    try {
      await AuthService.resendVerificationEmail(email);
      setCountdown(60);
      Taro.showToast({
        title: '验证邮件已发送',
        icon: 'success',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请稍后重试');
    }
  };

  const goToLogin = () => {
    Taro.redirectTo({ url: '/pages/login/index' });
  };

  return (
    <View className='email-verify-container'>
      <View className='email-verify-box'>
        <View className='verify-title'>邮箱验证</View>
        
        <View className='verify-content'>
          <Text className='verify-text'>
            我们已向您的邮箱 {email} 发送了验证链接，
            请查收邮件并点击链接完成验证。
          </Text>

          <Text className='verify-tip'>
            如果您没有收到验证邮件，请检查垃圾邮件文件夹，
            或点击下方按钮重新发送。
          </Text>

          {error && <Text className='error-text'>{error}</Text>}

          <Button
            className='resend-button'
            disabled={countdown > 0}
            onClick={handleResendEmail}
          >
            {countdown > 0 ? `重新发送(${countdown}s)` : '重新发送验证邮件'}
          </Button>

          <View className='login-link' onClick={goToLogin}>
            返回登录
          </View>
        </View>
      </View>
    </View>
  );
};

export default EmailVerify;
