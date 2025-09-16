import { View, Input, Button, Text } from '@tarojs/components';
import { useState, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import { RegisterForm } from '../../../types/auth';
import { AuthService } from '../../services/auth';
import { useUser } from '../../stores/userStore';
import './index.less';

const Register: React.FC = () => {
  const [form, setForm] = useState<RegisterForm>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const { fetchUserProfile } = useUser();
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // H5环境下设置页面标题和logo
  useEffect(() => {
    if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
      document.title = '注册 - 表情包动起来';
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = '/assets/logo.png';
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = '/assets/logo.png';
        document.head.appendChild(newFavicon);
      }
    }
  }, []);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const handleInput = (field: keyof RegisterForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!form.email || !form.username || !form.password || !form.confirmPassword) {
      setError('请填写完整信息');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('请输入有效的邮箱地址');
      return false;
    }

    if (form.username.length < 3 || form.username.length > 50) {
      setError('用户名长度必须在3到50个字符之间');
      return false;
    }

    if (form.password.length < 8) {
      setError('密码长度不能少于8位');
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }

    return true;
  };

  const handleSendVerificationCode = async () => {
    // 防止重复点击
    if (!validateForm() || sendingCode || countdown > 0) return;

    try {
      setSendingCode(true);
      setError('');

      const response = await AuthService.sendVerificationCode(form.email);

      // 清理旧的计时器
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }

      // 使用接口返回的expiresIn值开始倒计时
      const expiresIn = (response && response.data && response.data.expiresIn) || 300; // 默认5分钟
      setCountdown(expiresIn);
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 切换到验证步骤
      setStep('verification');

      Taro.showToast({
        title: (response && response.data && response.data.message) || '验证码已发送',
        icon: 'success',
        duration: 2000
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败，请稍后重试');
      setCountdown(0); // 发送失败时重置倒计时
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!verificationCode) {
      setError('请输入验证码');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 先验证邮箱验证码
      await AuthService.verifyCode(form.email, verificationCode);
      setIsVerified(true);

      // 验证成功后直接注册
      const response = await AuthService.register({
        email: form.email,
        username: form.username,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      // 存储用户ID
      Taro.setStorageSync('userId', response.user.userId);

      // 获取用户信息并存储到全局store
      await fetchUserProfile();

      Taro.showToast({
        title: '注册成功！',
        icon: 'success',
        duration: 2000
      });

      // 注册成功后直接跳转到工作台
      setTimeout(() => {
        Taro.reLaunch({ url: '/pages/workspace/index' });
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' });
  };

  const goBackToForm = () => {
    setStep('form');
    setVerificationCode('');
    setError('');
    setIsVerified(false);
  };

  // 验证码输入步骤
  if (step === 'verification') {
    return (
      <View className='register-container'>
        <View className='register-box'>
          <View className='app-title'>表情包动起来</View>
          <View className='register-title'>邮箱验证</View>

          <View className='verification-info'>
            <Text>验证码已发送至：{form.email}</Text>
          </View>

          <View className='form-item'>
            <Input
              className='input verification-input'
              type='text'
              placeholder='请输入6位验证码'
              value={verificationCode}
              onInput={e => setVerificationCode(e.detail.value)}
              maxlength={6}
            />
          </View>

          {countdown > 0 ? (
            <View className='countdown-display'>
              <Text className='countdown-text'>验证码将在 {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')} 后过期</Text>
            </View>
          ) : (
            <View className='resend-section'>
              <Text className='resend-hint'>没有收到验证码？</Text>
              <Button
                className='resend-link-button'
                onClick={handleSendVerificationCode}
                disabled={sendingCode}
              >
                {sendingCode ? '发送中...' : '重新发送'}
              </Button>
            </View>
          )}

          {error && <Text className='error-text'>{error}</Text>}

          <Button
            className='register-button'
            loading={loading}
            onClick={handleVerifyAndRegister}
          >
            {isVerified ? '注册中...' : '验证并完成注册'}
          </Button>

          <View className='back-link' onClick={goBackToForm}>
            返回修改信息
          </View>
        </View>
      </View>
    );
  }

  // 注册表单步骤
  return (
    <View className='register-container'>
      <View className='register-box'>
        <View className='app-title'>表情包动起来</View>
        <View className='register-title'>注册</View>

        <View className='form-item'>
          <Input
            className='input'
            type='text'
            placeholder='请输入邮箱'
            value={form.email}
            onInput={e => handleInput('email', e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Input
            className='input'
            type='text'
            placeholder='请输入用户名'
            value={form.username}
            onInput={e => handleInput('username', e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Input
            className='input'
            type='text'
            password={true}
            placeholder='请输入密码（至少8位）'
            value={form.password}
            onInput={e => handleInput('password', e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Input
            className='input'
            type='text'
            password={true}
            placeholder='请确认密码'
            value={form.confirmPassword}
            onInput={e => handleInput('confirmPassword', e.detail.value)}
          />
        </View>

        {error && <Text className='error-text'>{error}</Text>}

        <Button
          className='register-button'
          loading={sendingCode}
          onClick={handleSendVerificationCode}
        >
          发送验证码并注册
        </Button>

        <View className='login-link' onClick={goToLogin}>
          已有账号？立即登录
        </View>
      </View>
    </View>
  );
};

export default Register;