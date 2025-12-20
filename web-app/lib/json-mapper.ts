/**
 * JSON 字段映射工具
 * 用于在 API 格式和 RFC 格式之间转换数据
 */

interface MappingRule {
  id: string;
  source: string;      // 源字段路径
  target: string;      // 目标字段路径
  type: 'field' | 'constant' | 'expression';
  value?: string;      // 常量值
}

/**
 * 从对象中获取嵌套属性值
 * @param obj 对象
 * @param path 路径，如 "customer.address.city"
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }
  
  return value;
}

/**
 * 设置对象的嵌套属性值
 * @param obj 对象
 * @param path 路径，如 "customer.address.city"
 * @param value 值
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  
  let current = obj;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}

/**
 * 应用映射规则转换数据
 * @param source 源数据
 * @param mappings 映射规则
 * @returns 转换后的数据
 */
export function applyMapping(source: any, mappings: MappingRule[]): any {
  if (!mappings || mappings.length === 0) {
    return source; // 没有映射规则，直接返回原数据
  }

  const result: any = {};

  for (const rule of mappings) {
    let value: any;

    switch (rule.type) {
      case 'constant':
        // 常量值
        value = rule.value;
        break;
      
      case 'field':
        // 字段映射
        value = getNestedValue(source, rule.source);
        break;
      
      case 'expression':
        // 表达式（暂不实现，可以后续扩展）
        value = getNestedValue(source, rule.source);
        break;
      
      default:
        value = getNestedValue(source, rule.source);
    }

    if (value !== undefined) {
      setNestedValue(result, rule.target, value);
    }
  }

  return result;
}

/**
 * 反向应用映射规则（用于输出映射）
 * @param source RFC 输出数据
 * @param mappings 映射规则
 * @returns 转换后的 API 格式数据
 */
export function applyReverseMapping(source: any, mappings: MappingRule[]): any {
  if (!mappings || mappings.length === 0) {
    return source; // 没有映射规则，直接返回原数据
  }

  const result: any = {};

  for (const rule of mappings) {
    // 输出映射时，source 和 target 的含义相反
    // source 是 RFC 字段，target 是 API 字段
    const value = getNestedValue(source, rule.source);
    
    if (value !== undefined) {
      setNestedValue(result, rule.target, value);
    }
  }

  return result;
}

/**
 * 合并映射结果和默认参数
 * @param mappedData 映射后的数据
 * @param defaults 默认参数
 * @returns 合并后的数据
 */
export function mergeWithDefaults(mappedData: any, defaults: any): any {
  if (!defaults) return mappedData;
  if (!mappedData) return defaults;

  // 深度合并
  return {
    ...defaults,
    ...mappedData,
  };
}
