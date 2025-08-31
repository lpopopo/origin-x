/**
 * @description default separator for {@link splitStream}
 */
const DEFAULT_STREAM_SEPARATOR = '\n\n';
/**
 * @description Default separator for {@link splitPart}
 * @example "event: delta\ndata: {\"key\": \"value\"}"
 */
const DEFAULT_PART_SEPARATOR = '\n';
/**
 * @description Default separator for key value, A colon (`:`) is used to separate keys from values
 * @example "event: delta"
 */
const DEFAULT_KV_SEPARATOR = ':';

/**
 * Check if a string is not empty or only contains whitespace characters
 */
const isValidString = (str: string) => (str ?? '').trim() !== '';

/**
 * @description A TransformStream inst that splits a stream into parts based on {@link DEFAULT_STREAM_SEPARATOR}
 * @example
 *
 * `event: delta
 * data: { content: 'hello' }
 *
 * event: delta
 * data: { key: 'world!' }
 *
 * `
 */
function splitStream() {
    // Buffer to store incomplete data chunks between transformations
    let buffer = '';

    return new TransformStream<string, string>({
        transform(streamChunk, controller) {
            buffer += streamChunk;

            // Split the buffer based on the separator
            const parts = buffer.split(DEFAULT_STREAM_SEPARATOR);

            // Enqueue all complete parts except for the last incomplete one
            parts.slice(0, -1).forEach((part) => {
                // Skip empty parts
                if (isValidString(part)) {
                    controller.enqueue(part);
                }
            });

            // Save the last incomplete part back to the buffer for the next chunk
            buffer = parts[parts.length - 1];
        },
        flush(controller) {
            // If there's any remaining data in the buffer, enqueue it as the final part
            if (isValidString(buffer)) {
                controller.enqueue(buffer);
            }
        },
    });
}

/**
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#fields
 */
export type SSEFields = 'data' | 'event' | 'id' | 'retry';

/**
 * @example
 * const sseObject = {
 *    event: 'delta',
 *    data: '{ key: "world!" }',
 * };
 */
export type SSEOutput = Partial<Record<SSEFields, any>>;

/**
 * @description Parse a part string into {@link SSEOutput}
 * @example
 * "event: delta\ndata: { key: 'world!' }\n"
 * @returns
 * {
 *  event: 'delta',
 *  data: '{ key: "world!" }'
 * }
 */
function splitPart(part: string): SSEOutput {
    // Split the part by newlines to get individual fields
    const fields = part.split(DEFAULT_PART_SEPARATOR);
    
    // Create a result object to store the parsed fields
    const result: SSEOutput = {};
    
    // Process each field
    fields.forEach(field => {
        if (!isValidString(field)) return;
        
        // Find the first occurrence of the key-value separator
        const separatorIndex = field.indexOf(DEFAULT_KV_SEPARATOR);
        
        if (separatorIndex === -1) return;
        
        // Extract the key and value
        const key = field.slice(0, separatorIndex).trim() as SSEFields;
        const value = field.slice(separatorIndex + 1).trim();
        
        // Skip if key is not valid
        if (!isValidString(key) || !['data', 'event', 'id', 'retry'].includes(key)) return;
        
        // Parse the value based on the key
        if (key === 'data') {
            try {
                // Try to parse as JSON if possible
                result[key] = value;
            } catch {
                // If not valid JSON, use the raw string value
                result[key] = value;
            }
        } else {
            result[key] = value;
        }
    });
    
    return result;
}

export interface XStreamOptions<Output> {
    /**
     * @description Readable stream of binary data
     * @link https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
     */
    readableStream: ReadableStream<Uint8Array>;

    /**
     * @description Support customizable transformStream to transform streams
     * @default sseTransformStream
     * @link https://developer.mozilla.org/en-US/docs/Web/API/TransformStream
     */
    transformStream?: TransformStream<string, Output>;
}

type XReadableStream<R = SSEOutput> = ReadableStream<R> & AsyncGenerator<R>;

/**
 * @description Transform Uint8Array binary stream to {@link SSEOutput} by default
 * @warning The `XStream` only support the `utf-8` encoding. More encoding support maybe in the future.
 */
function XStream<Output = SSEOutput>(options: XStreamOptions<Output>) {
    const { readableStream, transformStream } = options;

    /** support async iterator */
    (readableStream as XReadableStream<Output>)[Symbol.asyncIterator] = async function* () {
        const reader = this.getReader();

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            if (!value) continue;

            // Transformed data through all transform pipes
            yield value;
        }
    };

    return readableStream as XReadableStream<Output>;
}

export { splitStream, splitPart };
export default XStream; 