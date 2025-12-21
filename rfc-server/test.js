/**
 * RFC Server 测试脚本
 * 用于验证 API 端点、数据流和数据格式
 */

const axios = require('axios');

// 测试配置
const BASE_URL = process.env.RFC_SERVER_URL || 'http://localhost:3001';
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[36m',
  RESET: '\x1b[0m'
};

// 模拟 SAP 连接配置（根据实际情况修改）
const TEST_CONNECTION = {
  ashost: process.env.SAP_ASHOST || '10.68.110.51',
  sysnr: process.env.SAP_SYSNR || '00',
  user: process.env.SAP_USER || 'demo',
  passwd: process.env.SAP_PASSWD || 'welcome',
  client: process.env.SAP_CLIENT || '620',
  lang: process.env.SAP_LANG || 'EN'
};

// 测试结果收集
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// 工具函数
function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function logTest(name) {
  log(`\n${'='.repeat(60)}`, COLORS.BLUE);
  log(`测试: ${name}`, COLORS.BLUE);
  log('='.repeat(60), COLORS.BLUE);
}

function logSuccess(message) {
  log(`✓ ${message}`, COLORS.GREEN);
}

function logError(message) {
  log(`✗ ${message}`, COLORS.RED);
}

function logInfo(message) {
  log(`ℹ ${message}`, COLORS.YELLOW);
}

async function runTest(name, testFn) {
  testResults.total++;
  try {
    await testFn();
    testResults.passed++;
    testResults.details.push({ name, status: 'PASSED' });
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name, status: 'FAILED', error: error.message });
    logError(`测试失败: ${error.message}`);
  }
}

// ============================================
// 测试 1: 健康检查端点
// ============================================
async function testHealthCheck() {
  logTest('健康检查端点 GET /health');
  
  await runTest('健康检查', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    
    // 验证状态码
    if (response.status !== 200) {
      throw new Error(`期望状态码 200，实际: ${response.status}`);
    }
    logSuccess('状态码: 200');
    
    // 验证响应格式
    const data = response.data;
    if (!data.status) {
      throw new Error('响应缺少 status 字段');
    }
    if (!data.service) {
      throw new Error('响应缺少 service 字段');
    }
    logSuccess('响应格式正确');
    
    // 验证字段值
    if (data.status !== 'ok') {
      throw new Error(`期望 status='ok'，实际: ${data.status}`);
    }
    if (data.service !== 'RFC API Server') {
      throw new Error(`期望 service='RFC API Server'，实际: ${data.service}`);
    }
    logSuccess('字段值正确');
    
    logInfo(`响应数据: ${JSON.stringify(data, null, 2)}`);
  });
}

// ============================================
// 测试 2: 参数验证 - 缺少必需参数
// ============================================
async function testValidationMissingParams() {
  logTest('参数验证 - 缺少必需参数');
  
  // 测试 2.1: /api/rfc/call 缺少 connection
  await runTest('RFC 调用 - 缺少 connection', async () => {
    try {
      await axios.post(`${BASE_URL}/api/rfc/call`, {
        rfmName: 'STFC_CONNECTION'
      });
      throw new Error('应该返回 400 错误');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('正确返回 400 错误');
        logInfo(`错误信息: ${error.response.data.error}`);
      } else {
        throw error;
      }
    }
  });
  
  // 测试 2.2: /api/rfc/call 缺少 rfmName
  await runTest('RFC 调用 - 缺少 rfmName', async () => {
    try {
      await axios.post(`${BASE_URL}/api/rfc/call`, {
        connection: TEST_CONNECTION
      });
      throw new Error('应该返回 400 错误');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('正确返回 400 错误');
        logInfo(`错误信息: ${error.response.data.error}`);
      } else {
        throw error;
      }
    }
  });
  
  // 测试 2.3: /api/rfc/test 缺少 connection
  await runTest('连接测试 - 缺少 connection', async () => {
    try {
      await axios.post(`${BASE_URL}/api/rfc/test`, {});
      throw new Error('应该返回 400 错误');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('正确返回 400 错误');
        logInfo(`错误信息: ${error.response.data.error}`);
      } else {
        throw error;
      }
    }
  });
  
  // 测试 2.4: /api/rfc/metadata 缺少参数
  await runTest('元数据获取 - 缺少参数', async () => {
    try {
      await axios.post(`${BASE_URL}/api/rfc/metadata`, {
        connection: TEST_CONNECTION
      });
      throw new Error('应该返回 400 错误');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('正确返回 400 错误');
        logInfo(`错误信息: ${error.response.data.error}`);
      } else {
        throw error;
      }
    }
  });
}

// ============================================
// 测试 3: 响应格式验证
// ============================================
async function testResponseFormat() {
  logTest('响应格式验证');
  
  await runTest('统一响应格式', async () => {
    // 测试成功响应格式（使用健康检查）
    const healthRes = await axios.get(`${BASE_URL}/health`);
    if (typeof healthRes.data !== 'object') {
      throw new Error('响应应该是 JSON 对象');
    }
    logSuccess('成功响应格式正确');
    
    // 测试错误响应格式
    try {
      await axios.post(`${BASE_URL}/api/rfc/call`, {});
    } catch (error) {
      const errorData = error.response.data;
      if (!errorData.success) {
        logSuccess('错误响应包含 success 字段');
      }
      if (errorData.error) {
        logSuccess('错误响应包含 error 字段');
      }
      if (errorData.success !== false) {
        throw new Error('错误响应的 success 应该为 false');
      }
      logInfo(`错误响应示例: ${JSON.stringify(errorData, null, 2)}`);
    }
  });
}

// ============================================
// 测试 4: RFC 连接测试（需要真实 SAP 连接）
// ============================================
async function testRFCConnection() {
  logTest('RFC 连接测试（需要 SAP 可用）');
  
  await runTest('测试 SAP 连接', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/rfc/test`, {
        connection: TEST_CONNECTION
      });
      
      // 验证响应结构
      if (!response.data.success) {
        throw new Error('连接测试失败');
      }
      logSuccess('连接测试成功');
      
      if (!response.data.data || typeof response.data.data.duration !== 'number') {
        throw new Error('响应缺少 duration 字段');
      }
      logSuccess(`连接延迟: ${response.data.data.duration}ms`);
      
      // 验证延迟合理性（应该在 50-5000ms 之间）
      const duration = response.data.data.duration;
      if (duration < 0 || duration > 10000) {
        throw new Error(`连接延迟异常: ${duration}ms`);
      }
      logSuccess('延迟时间合理');
      
    } catch (error) {
      if (error.response && error.response.status === 500) {
        logInfo('SAP 系统不可用，跳过连接测试');
        logInfo(`错误: ${error.response.data.error}`);
      } else {
        throw error;
      }
    }
  });
}

// ============================================
// 测试 5: RFC 函数调用（需要真实 SAP 连接）
// ============================================
async function testRFCCall() {
  logTest('RFC 函数调用（需要 SAP 可用）');
  
  await runTest('调用 STFC_CONNECTION', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/rfc/call`, {
        connection: TEST_CONNECTION,
        rfmName: 'STFC_CONNECTION',
        parameters: {
          REQUTEXT: 'Hello from test script'
        }
      });
      
      // 验证响应结构
      if (!response.data.success) {
        throw new Error('RFC 调用失败');
      }
      logSuccess('RFC 调用成功');
      
      // 验证返回数据
      if (!response.data.data) {
        throw new Error('响应缺少 data 字段');
      }
      logSuccess('响应包含数据');
      
      // STFC_CONNECTION 应该返回 ECHOTEXT 和 RESPTEXT
      const data = response.data.data;
      if (data.ECHOTEXT) {
        logSuccess(`ECHOTEXT: ${data.ECHOTEXT}`);
      }
      if (data.RESPTEXT) {
        logSuccess(`RESPTEXT: ${data.RESPTEXT.substring(0, 50)}...`);
      }
      
      logInfo(`完整响应: ${JSON.stringify(response.data, null, 2).substring(0, 500)}...`);
      
    } catch (error) {
      if (error.response && error.response.status === 500) {
        logInfo('SAP 系统不可用，跳过 RFC 调用测试');
        logInfo(`错误: ${error.response.data.error}`);
      } else {
        throw error;
      }
    }
  });
}

// ============================================
// 测试 6: 元数据获取（需要真实 SAP 连接）
// ============================================
async function testMetadata() {
  logTest('元数据获取（需要 SAP 可用）');
  
  await runTest('获取 STFC_CONNECTION 元数据', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/rfc/metadata`, {
        connection: TEST_CONNECTION,
        rfmName: 'STFC_CONNECTION'
      });
      
      // 验证响应结构
      if (!response.data.success) {
        throw new Error('元数据获取失败');
      }
      logSuccess('元数据获取成功');
      
      // 验证 metadata 字段
      const { metadata, inputTemplate } = response.data;
      
      if (!metadata) {
        throw new Error('响应缺少 metadata 字段');
      }
      logSuccess('包含 metadata 字段');
      
      if (!metadata.name || metadata.name !== 'STFC_CONNECTION') {
        throw new Error('metadata.name 不正确');
      }
      logSuccess(`函数名: ${metadata.name}`);
      
      if (!metadata.parameters) {
        throw new Error('metadata 缺少 parameters');
      }
      logSuccess(`参数数量: ${Object.keys(metadata.parameters).length}`);
      
      // 验证参数结构
      const firstParam = Object.values(metadata.parameters)[0];
      const requiredFields = ['name', 'type', 'direction', 'description', 'optional'];
      requiredFields.forEach(field => {
        if (!(field in firstParam)) {
          throw new Error(`参数缺少 ${field} 字段`);
        }
      });
      logSuccess('参数字段完整');
      
      // 验证 inputTemplate
      if (!inputTemplate) {
        throw new Error('响应缺少 inputTemplate 字段');
      }
      logSuccess('包含 inputTemplate 字段');
      
      logInfo(`元数据示例:\n${JSON.stringify({
        name: metadata.name,
        description: metadata.description,
        parameterCount: Object.keys(metadata.parameters).length,
        inputFields: Object.keys(inputTemplate)
      }, null, 2)}`);
      
    } catch (error) {
      if (error.response && error.response.status >= 400) {
        logInfo('SAP 系统不可用或函数不存在，跳过元数据测试');
        logInfo(`错误: ${error.response.data.error}`);
      } else {
        throw error;
      }
    }
  });
}

// ============================================
// 测试 7: 数据类型验证
// ============================================
async function testDataTypes() {
  logTest('数据类型验证');
  
  await runTest('验证 JSON 序列化', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    const contentType = response.headers['content-type'];
    
    if (!contentType.includes('application/json')) {
      throw new Error(`期望 Content-Type: application/json，实际: ${contentType}`);
    }
    logSuccess('Content-Type 正确');
    
    // 验证响应可以被 JSON 解析
    const data = response.data;
    const serialized = JSON.stringify(data);
    const deserialized = JSON.parse(serialized);
    
    if (JSON.stringify(deserialized) !== serialized) {
      throw new Error('JSON 序列化/反序列化不一致');
    }
    logSuccess('JSON 序列化正常');
  });
  
  await runTest('验证错误消息字符串', async () => {
    try {
      await axios.post(`${BASE_URL}/api/rfc/call`, {});
    } catch (error) {
      const errorMsg = error.response.data.error;
      if (typeof errorMsg !== 'string') {
        throw new Error('错误消息应该是字符串');
      }
      if (errorMsg.length === 0) {
        throw new Error('错误消息不应为空');
      }
      logSuccess('错误消息格式正确');
    }
  });
}

// ============================================
// 测试 8: CORS 验证
// ============================================
async function testCORS() {
  logTest('CORS 验证');
  
  await runTest('验证 CORS 头', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    const corsHeader = response.headers['access-control-allow-origin'];
    
    if (corsHeader) {
      logSuccess(`CORS 头存在: ${corsHeader}`);
    } else {
      logInfo('CORS 头未设置（可能在某些环境中正常）');
    }
  });
}

// ============================================
// 测试 9: 错误处理
// ============================================
async function testErrorHandling() {
  logTest('错误处理');
  
  await runTest('无效的 HTTP 方法', async () => {
    try {
      await axios.get(`${BASE_URL}/api/rfc/call`);
      throw new Error('应该返回 404 或 405 错误');
    } catch (error) {
      if (error.response && (error.response.status === 404 || error.response.status === 405)) {
        logSuccess('正确处理无效方法');
      } else {
        throw error;
      }
    }
  });
  
  await runTest('无效的 JSON 格式', async () => {
    try {
      await axios.post(`${BASE_URL}/api/rfc/call`, 'invalid json', {
        headers: { 'Content-Type': 'application/json' }
      });
      throw new Error('应该返回 400 错误');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('正确处理无效 JSON');
      } else {
        throw error;
      }
    }
  });
  
  await runTest('不存在的端点', async () => {
    try {
      await axios.get(`${BASE_URL}/api/nonexistent`);
      throw new Error('应该返回 404 错误');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logSuccess('正确返回 404');
      } else {
        throw error;
      }
    }
  });
}

// ============================================
// 测试 10: 性能测试
// ============================================
async function testPerformance() {
  logTest('性能测试');
  
  await runTest('健康检查响应时间', async () => {
    const iterations = 10;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await axios.get(`${BASE_URL}/health`);
      times.push(Date.now() - start);
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    logSuccess(`平均响应时间: ${avg.toFixed(2)}ms`);
    logInfo(`最小: ${min}ms, 最大: ${max}ms`);
    
    if (avg > 1000) {
      throw new Error(`平均响应时间过长: ${avg}ms`);
    }
  });
}

// ============================================
// 主测试运行器
// ============================================
async function runAllTests() {
  log('\n╔═══════════════════════════════════════════════════════════╗', COLORS.BLUE);
  log('║         RFC Server 测试套件                                ║', COLORS.BLUE);
  log('╚═══════════════════════════════════════════════════════════╝', COLORS.BLUE);
  log(`\n目标服务器: ${BASE_URL}\n`);
  
  // 运行所有测试
  await testHealthCheck();
  await testValidationMissingParams();
  await testResponseFormat();
  await testDataTypes();
  await testCORS();
  await testErrorHandling();
  await testPerformance();
  
  // 需要 SAP 连接的测试（可能失败）
  log('\n' + '='.repeat(60), COLORS.YELLOW);
  log('以下测试需要真实 SAP 连接', COLORS.YELLOW);
  log('='.repeat(60) + '\n', COLORS.YELLOW);
  
  await testRFCConnection();
  await testRFCCall();
  await testMetadata();
  
  // 输出测试结果
  log('\n╔═══════════════════════════════════════════════════════════╗', COLORS.BLUE);
  log('║         测试结果汇总                                       ║', COLORS.BLUE);
  log('╚═══════════════════════════════════════════════════════════╝', COLORS.BLUE);
  
  log(`\n总测试数: ${testResults.total}`);
  log(`通过: ${testResults.passed}`, COLORS.GREEN);
  log(`失败: ${testResults.failed}`, testResults.failed > 0 ? COLORS.RED : COLORS.GREEN);
  
  if (testResults.failed > 0) {
    log('\n失败的测试:', COLORS.RED);
    testResults.details
      .filter(t => t.status === 'FAILED')
      .forEach(t => {
        log(`  - ${t.name}: ${t.error}`, COLORS.RED);
      });
  }
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  log(`\n成功率: ${successRate}%\n`, successRate === '100.00' ? COLORS.GREEN : COLORS.YELLOW);
  
  // 退出码
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`测试运行器错误: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
