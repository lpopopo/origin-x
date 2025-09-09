import XStream, { splitStream, splitPart } from './xStream';
import xFetch from './xFetch';

import type { SSEOutput, XStreamOptions } from './xStream';
import type { XFetchOptions } from './xFetch';

type AnyObject = Record<PropertyKey, any>;

export interface XRequestBaseOptions {
    /**
     * @description Base URL, e.g., 'https://api.example.com/v1/chat'
     */
    baseURL: string;

    /**
     * @description Model name, e.g., 'gpt-3.5-turbo'
     */
    model?: string;

    /**
     * @warning 🔥🔥 Its dangerously!
     *
     * Enabling the dangerouslyApiKey option can be dangerous because it exposes
     * your secret API credentials in the client-side code. Web browsers are inherently
     * less secure than server environments, any user with access to the browser can
     * potentially inspect, extract, and misuse these credentials. This could lead to
     * unauthorized access using your credentials and potentially compromise sensitive
     * data or functionality.
     */
    dangerouslyApiKey?: string;
}

interface XRequestCustomOptions {
    /**
     * @description Custom fetch
     */
    fetch?: XFetchOptions['fetch'];
}

export type XRequestOptions = XRequestBaseOptions & XRequestCustomOptions;

type XRequestMessageContent = string | AnyObject;

interface XRequestMessage extends AnyObject {
    role?: string;
    content?: XRequestMessageContent;
}

/**
 * Compatible with the parameters of OpenAI's chat.completions.create,
 * with plans to support more parameters and adapters in the future
 */
export interface XRequestParams {
    /**
     * @description Model name, e.g., 'gpt-3.5-turbo'
     * @default XRequestOptions.model
     */
    model?: string;

    /**
     * @description Indicates whether to use streaming for the response
     */
    stream?: boolean;

    /**
     * @description The messages to be sent to the model
     */
    messages?: XRequestMessage[];
}

export interface XRequestCallbacks<Output> {
    /**
     * @description Callback when the request is successful
     */
    onSuccess: (chunks: Output[]) => void;

    /**
     * @description Callback when the request fails
     */
    onError: (error: Error) => void;

    /**
     * @description Callback when the request is updated
     */
    onUpdate: (chunk: Output) => void;

    /**
     * @description Callback monitoring and control the stream
     */

    onStream?: (abortController: AbortController) => void;
}

export type XRequestFunction<Input = AnyObject, Output = SSEOutput> = (
    params: XRequestParams & Input,
    callbacks: XRequestCallbacks<Output>,
    transformStream?: XStreamOptions<Output>['transformStream'],
) => Promise<void>;

class XRequestClass {
    readonly baseURL;
    readonly model;

    private defaultHeaders;
    private customOptions;

    private constructor(options: XRequestOptions) {
        const { baseURL, model, dangerouslyApiKey, ...customOptions } = options;

        this.baseURL = options.baseURL;
        this.model = options.model;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...(options.dangerouslyApiKey && {
                Authorization: options.dangerouslyApiKey,
            }),
        };
        this.customOptions = customOptions;
    }

    public static init(options: XRequestOptions): XRequestClass {
        if (!options.baseURL || typeof options.baseURL !== 'string')
            throw new Error('The baseURL is not valid!');

        return new XRequestClass(options);
    }

    public create = async <Input = AnyObject, Output = SSEOutput>(
        params: XRequestParams & Input,
        callbacks?: XRequestCallbacks<Output>,
        transformStream?: XStreamOptions<Output>['transformStream'],
    ) => {
        const abortController = new AbortController();
        const requestInit = {
            method: 'GET',
            // body: JSON.stringify({
            //     model: this.model,
            //     ...params,
            // }),
            headers: this.defaultHeaders,
            signal: abortController.signal,
            credentials: "include" as RequestCredentials 
        };

        callbacks?.onStream?.(abortController);

        try {
            const response = await xFetch(this.baseURL, {
                fetch: this.customOptions.fetch,
                ...requestInit,
            });

            if (transformStream) {
                await this.customResponseHandler<Output>(response, callbacks, transformStream);
                return;
            }

            const contentType = response.headers.get('content-type') || '';

            const mimeType = contentType.split(';')[0].trim();

            switch (mimeType) {
                /** SSE */
                case 'text/event-stream':
                    await this.sseResponseHandler<Output>(response, callbacks);
                    break;

                /** JSON */
                case 'application/json':
                    await this.jsonResponseHandler<Output>(response, callbacks);
                    break;

                default:
                    throw new Error(`The response content-type: ${contentType} is not support!`);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error!');

            callbacks?.onError?.(err);

            throw err;
        }
    };

    private customResponseHandler = async <Output = SSEOutput>(
        response: Response,
        callbacks?: XRequestCallbacks<Output>,
        transformStream?: XStreamOptions<Output>['transformStream'],
    ) => {
        const chunks: Output[] = [];

        for await (const chunk of XStream({
            readableStream: response.body!,
            transformStream,
        })) {
            chunks.push(chunk);
            callbacks?.onUpdate?.(chunk);
        }

        callbacks?.onSuccess?.(chunks);
    };

    private sseResponseHandler = async <Output = SSEOutput>(
        response: Response,
        callbacks?: XRequestCallbacks<Output>,
    ) => {
        const chunks: Output[] = [];
        let buffer = '';
        
        if (!response.body) {
            throw new Error('Response body is null or undefined');
        }
        
        // 创建TextDecoder实例用于解码二进制数据
        const decoder = new TextDecoder();
        
        // 获取response的reader
        const reader = response.body.getReader();
        
        try {
            while (true) {
                // 读取数据块
                const { done, value } = await reader.read();
                
                // 如果数据流结束，则退出循环
                if (done) break;
                
                // 将二进制数据转换为文本
                const text = decoder.decode(value, { stream: true });
                
                // 将新文本添加到缓冲区
                buffer += text;
                
                // 按双换行符分割事件
                const parts = buffer.split('\n\n');
                
                // 处理所有完整的事件部分，除了最后一个可能不完整的部分
                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i].trim();
                    
                    if (part) {
                        // 解析事件部分为SSE对象
                        const sseObj = splitPart(part) as Output;
                        
                        // 添加到结果数组
                        chunks.push(sseObj);
                        
                        // 调用更新回调
                        callbacks?.onUpdate?.(sseObj);
                    }
                }
                
                // 保留最后一部分作为新的缓冲区
                buffer = parts[parts.length - 1];
            }
            
            // 处理缓冲区中可能剩余的数据
            const finalText = decoder.decode(); // 刷新解码器
            buffer += finalText;
            
            if (buffer.trim()) {
                const sseObj = splitPart(buffer.trim()) as Output;
                chunks.push(sseObj);
                callbacks?.onUpdate?.(sseObj);
            }
            
            // 调用成功回调
            callbacks?.onSuccess?.(chunks);
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error in SSE processing');
            callbacks?.onError?.(err);
            throw err;
        } finally {
            reader.releaseLock();
        }
    };

    private jsonResponseHandler = async <Output = SSEOutput>(
        response: Response,
        callbacks?: XRequestCallbacks<Output>,
    ) => {
        const chunk: Output = await response.json();

        callbacks?.onUpdate?.(chunk);
        callbacks?.onSuccess?.([chunk]);
    };
}

const XRequest = XRequestClass.init;

export default XRequest;