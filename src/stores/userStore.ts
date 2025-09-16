import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { UserProfile } from '../../types/auth';
import { AuthService } from '../services/auth';

// 用户状态类型
interface UserState {
    user: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

// 用户状态动作类型
type UserAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_USER'; payload: UserProfile }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'CLEAR_USER' }
    | { type: 'SET_AUTHENTICATED'; payload: boolean };

// 初始状态
const initialState: UserState = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
};

// 用户状态reducer
function userReducer(state: UserState, action: UserAction): UserState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_USER':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                error: null,
                isLoading: false
            };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'CLEAR_USER':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                error: null,
                isLoading: false
            };
        case 'SET_AUTHENTICATED':
            return { ...state, isAuthenticated: action.payload };
        default:
            return state;
    }
}

// 用户上下文类型
interface UserContextType {
    state: UserState;
    fetchUserProfile: () => Promise<void>;
    clearUser: () => void;
    refreshUserProfile: () => Promise<void>;
    checkAuthAndRedirect: () => Promise<void>;
}

// 创建用户上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// 用户提供者组件
interface UserProviderProps {
    children: ReactNode;
    requireAuth?: boolean; // 是否需要校验登录，默认为true
    routeWhitelist?: string[]; // 路由白名单，在白名单内的页面不需要校验登录权限
}

export function UserProvider({ children, requireAuth = true, routeWhitelist = [] }: UserProviderProps) {
    const [state, dispatch] = useReducer(userReducer, initialState);

    // 检查当前路由是否在白名单中
    const isRouteInWhitelist = (route: string): boolean => {
        if (!route || routeWhitelist.length === 0) {
            return false;
        }
        
        // 支持精确匹配和包含匹配
        return routeWhitelist.some(whitelistRoute => {
            // 精确匹配
            if (route === whitelistRoute) {
                return true;
            }
            // 包含匹配（支持部分路径匹配）
            if (route.includes(whitelistRoute) || whitelistRoute.includes(route)) {
                return true;
            }
            return false;
        });
    };

    // 获取用户信息
    const fetchUserProfile = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const userProfile = await AuthService.getUserProfile();
            dispatch({ type: 'SET_USER', payload: userProfile });
        } catch (error) {
            console.error('获取用户信息失败:', error);
            // 获取用户信息失败，说明未登录或token无效
            dispatch({ type: 'CLEAR_USER' });
            dispatch({ type: 'SET_ERROR', payload: '获取用户信息失败' });
            Taro.redirectTo({
                url: '/pages/login/index'
            });
        }
    };

    // 清除用户信息
    const clearUser = () => {
        dispatch({ type: 'CLEAR_USER' });
    };

    // 刷新用户信息
    const refreshUserProfile = async () => {
        await fetchUserProfile();
    };

    // 检查认证状态并自动跳转
    const checkAuthAndRedirect = async () => {
        // 如果不需要校验登录，直接返回
        if (!requireAuth) {
            return;
        }

        // 获取当前路由
        const currentPages = Taro.getCurrentPages();
        const currentPage = currentPages[currentPages.length - 1];
        const currentRoute = currentPage && currentPage.route;
        console.log('currentRoute', currentRoute);

        // 如果当前路由在白名单中，跳过登录校验
        if (!currentRoute || isRouteInWhitelist(currentRoute)) {
            return;
        }

        try {
            await fetchUserProfile();
        } catch (error) {
            // 如果获取用户信息失败，跳转到登录页面
            // 如果当前不在登录页面，则跳转
            if (currentRoute && !currentRoute.includes('login') && !currentRoute.includes('register')) {
                Taro.redirectTo({
                    url: '/pages/login/index'
                });
            }
        }
    };


    // 应用启动时检查用户状态
    useEffect(() => {
        checkAuthAndRedirect();
    }, [requireAuth, routeWhitelist]); // 添加requireAuth和routeWhitelist作为依赖

    const value: UserContextType = {
        state,
        fetchUserProfile,
        clearUser,
        refreshUserProfile,
        checkAuthAndRedirect,
    };

    return React.createElement(UserContext.Provider, { value }, children);
}

// 使用用户上下文的hook
export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
