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

    if (form.password.length < 6) {
      setError('密码长度不能少于6位');
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await AuthService.register(form);
      
      // 存储token
      Taro.setStorageSync('accessToken', response.data.accessToken);
      Taro.setStorageSync('refreshToken', response.data.refreshToken);
      Taro.setStorageSync('expiresAt', response.data.expiresAt);
      Taro.setStorageSync('userId', response.data.user.userId);

      // 获取用户信息并存储到全局store
      await fetchUserProfile();

      // 跳转到邮箱验证页面
      Taro.redirectTo({
        url: `/pages/email-verify/index?email=${encodeURIComponent(form.email)}`
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' });
  };

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
          onClick={handleRegister}
        >
          注册
        </Button>

        <View className='login-link' onClick={goToLogin}>
          已有账号？立即登录
        </View>
      </View>
    </View>
  );
};

export default Register;
