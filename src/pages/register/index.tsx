import { View, Input, Button, Text } from '@tarojs/components';
import { useState } from 'react';
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
  const [verificationStep, setVerificationStep] = useState<'form' | 'verification' | 'verified'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { fetchUserProfile } = useUser();

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
    if (!form.email) {
      setError('请先输入邮箱地址');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    try {
      setSendingCode(true);
      setError('');
      
      await AuthService.sendVerificationCode(form.email);
      
      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 进入验证步骤
      setVerificationStep('verification');

      Taro.showToast({
        title: '验证码已发送',
        icon: 'success',
        duration: 2000
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败，请稍后重试');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('请输入验证码');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await AuthService.verifyCode(form.email, verificationCode);
      
      // 验证通过，显示成功提示
      Taro.showToast({
        title: '邮箱验证成功',
        icon: 'success',
        duration: 2000
      });
      
      // 验证成功后，显示注册按钮
      setVerificationStep('verified');
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码错误，请重新输入');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await AuthService.register({
        email: form.email,
        username: form.username,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      // 获取用户信息并存储到全局store
      await fetchUserProfile();

      Taro.showToast({
        title: '注册成功',
        icon: 'success',
        duration: 2000
      });

      // 跳转到登录页面
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/login/index' });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' });
  };

  const goBackToForm = () => {
    setVerificationStep('form');
    setVerificationCode('');
    setError('');
    setCountdown(0);
  };

  // 邮箱验证步骤
  if (verificationStep === 'verification') {
    return (
      <View className='register-container'>
        <View className='register-box'>
          <View className='register-title'>邮箱验证</View>
          
          <View className='verification-info'>
            <Text>验证码已发送至：{form.email}</Text>
          </View>

          <View className='form-item'>
            <Input
              className='input'
              type='text'
              placeholder='请输入6位验证码'
              value={verificationCode}
              onInput={e => setVerificationCode(e.detail.value)}
              maxlength={6}
            />
          </View>

          {error && <Text className='error-text'>{error}</Text>}

          <Button
            className='register-button'
            loading={loading}
            onClick={handleVerifyCode}
          >
            验证
          </Button>

          <Button
            className='secondary-button'
            onClick={handleSendVerificationCode}
            disabled={sendingCode || countdown > 0}
          >
            {countdown > 0 ? `${countdown}秒后重发` : '重新发送验证码'}
          </Button>

          <View className='back-link' onClick={goBackToForm}>
            返回修改信息
          </View>
        </View>
      </View>
    );
  }

  // 验证成功后的注册步骤
  if (verificationStep === 'verified') {
    return (
      <View className='register-container'>
        <View className='register-box'>
          <View className='register-title'>完成注册</View>
          
          <View className='verification-success'>
            <Text>✓ 邮箱验证成功</Text>
            <Text>请点击下方按钮完成注册</Text>
          </View>

          {error && <Text className='error-text'>{error}</Text>}

          <Button
            className='register-button'
            loading={loading}
            onClick={handleRegister}
          >
            完成注册
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
            type='password'
            placeholder='请输入密码'
            value={form.password}
            onInput={e => handleInput('password', e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Input
            className='input'
            type='password'
            placeholder='请确认密码'
            value={form.confirmPassword}
            onInput={e => handleInput('confirmPassword', e.detail.value)}
          />
        </View>

        {error && <Text className='error-text'>{error}</Text>}

        <Button
          className='register-button'
          loading={loading}
          onClick={handleSendVerificationCode}
          disabled={sendingCode || countdown > 0}
        >
          {countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
        </Button>

        <View className='login-link' onClick={goToLogin}>
          已有账号？立即登录
        </View>
      </View>
    </View>
  );
};

export default Register;
