# RFC Server - 完整 API 文档

## 📋 目录

- [项目概述](#项目概述)
- [技术架构](#技术架构)
- [核心功能](#核心功能)
- [安装与配置](#安装与配置)
- [API 端点详解](#api-端点详解)
- [代码结构分析](#代码结构分析)
- [使用示例](#使用示例)
- [错误处理](#错误处理)
- [性能考虑](#性能考虑)
- [故障排除](#故障排除)

---

## 项目概述

**RFC Server** 是一个基于 Express.js 构建的 RESTful API 服务器，作为 SAP NetWeaver RFC SDK 的 HTTP 包装器。它允许客户端通过简单的 HTTP 请求调用 SAP RFC 函数，无需在客户端机器上安装 SAP SDK 或处理复杂的 RFC 连接逻辑。

### 主要特性

- ✅ **无状态 RESTful API** - 每个请求独立处理，易于扩展
- ✅ **自动连接管理** - 自动打开和关闭 RFC 连接
- ✅ **元数据提取** - 自动获取 RFC 函数的参数定义和结构
- ✅ **类型安全** - 处理 SAP 数据类型与 JSON 的转换
- ✅ **CORS 支持** - 允许跨域请求，适合前端应用
- ✅ **健康检查** - 内置健康检查端点用于监控
- ✅ **完整的错误处理** - 详细的错误信息和适当的 HTTP 状态码

### 版本信息

- **版本**: 1.0.0
- **Node.js**: >= 14.x
- **依赖**:
  - `express`: ^4.18.2 - Web 框架
  - `cors`: ^2.8.5 - 跨域资源共享
  - `node-rfc`: ^3.3.1 - SAP RFC 客户端绑定

---

## 技术架构

### 架构图

```
┌─────────────┐
│   客户端     │ (Web 应用/移动应用/其他服务)
└──────┬──────┘
       │ HTTP/HTTPS
       │
┌──────▼──────┐
│ RFC Server  │ (Express.js + CORS)
│   (3001)    │
└──────┬──────┘
       │ RFC Protocol
       │
┌──────▼──────┐
│ SAP System  │ (ABAP Application Server)
│             │
└─────────────┘
```

### 工作流程

1. **请求接收**: Express 接收 HTTP POST 请求
2. **参数验证**: 验证必需的连接参数和 RFC 函数名
3. **连接建立**: 使用 node-rfc 创建客户端并连接到 SAP
4. **RFC 调用**: 执行指定的 RFC 函数
5. **连接关闭**: 自动关闭连接释放资源
6. **响应返回**: 以 JSON 格式返回结果或错误

---

## 核心功能

### 1. RFC 函数调用
执行任意 SAP RFC 函数，支持所有参数类型（IMPORT, EXPORT, TABLES, CHANGING）

### 2. 连接测试
快速验证 SAP 连接配置是否正确，包含延迟测量

### 3. 元数据提取
自动获取 RFC 函数的完整元数据，包括：
- 参数名称和类型
- 参数方向（输入/输出/表/改变）
- 字段结构定义
- 自动生成输入模板

### 4. 健康监控
提供健康检查端点，用于负载均衡器和监控系统

---

## 安装与配置

### 安装步骤

```bash
# 1. 进入 rfc-server 目录
cd rfc-server

# 2. 安装依赖
npm install

# 3. 启动服务器
npm start
```

### 环境变量配置

创建 `.env` 文件（可选）：

```env
# 服务器配置
PORT=3001                    # 服务器监听端口
NODE_ENV=production          # 运行环境

# SAP 默认连接（用于测试）
SAP_ASHOST=your.sap.host    # SAP 应用服务器主机
SAP_SYSNR=00                # SAP 系统编号
SAP_USER=username           # SAP 用户名
SAP_PASSWD=password         # SAP 密码
SAP_CLIENT=100              # SAP 客户端
SAP_LANG=EN                 # 登录语言
```

### 启动选项

```bash
# 标准启动
npm start

# 指定端口
PORT=4000 npm start

# 开发模式（使用 nodemon）
npx nodemon index.js
```

---

## API 端点详解

### 基础 URL

```
http://localhost:3001
```

---

### 🔹 1. 健康检查

**端点**: `GET /health`

**描述**: 检查服务器运行状态，用于监控和负载均衡健康检查

**请求**:
```http
GET /health HTTP/1.1
Host: localhost:3001
```

**响应示例**:
```json
{
  "status": "ok",
  "service": "RFC API Server"
}
```

**HTTP 状态码**:
- `200 OK` - 服务器正常运行

**用途**:
- 监控系统健康检查
- 负载均衡器健康探测
- 容器编排（Docker/Kubernetes）就绪探针

---

### 🔹 2. RFC 函数调用

**端点**: `POST /api/rfc/call`

**描述**: 执行指定的 SAP RFC 函数并返回结果

**请求体**:
```json
{
  "connection": {
    "ashost": "sap.server.com",
    "sysnr": "00",
    "user": "username",
    "passwd": "password",
    "client": "100",
    "lang": "EN"
  },
  "rfmName": "STFC_CONNECTION",
  "parameters": {
    "REQUTEXT": "Hello SAP"
  }
}
```

**请求参数说明**:

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `connection` | Object | ✅ | SAP 连接配置对象 |
| `connection.ashost` | String | ✅ | SAP 应用服务器主机名或 IP |
| `connection.sysnr` | String | ✅ | SAP 系统编号（00-99） |
| `connection.user` | String | ✅ | SAP 登录用户名 |
| `connection.passwd` | String | ✅ | SAP 登录密码 |
| `connection.client` | String | ✅ | SAP 客户端编号 |
| `connection.lang` | String | ❌ | 登录语言（默认：EN） |
| `rfmName` | String | ✅ | 要调用的 RFC 函数模块名称 |
| `parameters` | Object | ❌ | RFC 函数的输入参数（默认：{}） |

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "ECHOTEXT": "Hello SAP",
    "RESPTEXT": "SAP R/3 Rel. 7.50   Sysid: ABC   Date: 20251221   Time: 123456   Logon_Data: 100/DEMO/E"
  }
}
```

**错误响应示例**:
```json
{
  "success": false,
  "error": "RFC_FUNCTION_NOT_FOUND: Function module MY_FUNCTION does not exist"
}
```

**HTTP 状态码**:
- `200 OK` - RFC 调用成功
- `400 Bad Request` - 缺少必需参数
- `500 Internal Server Error` - RFC 调用失败或连接错误

**代码实现要点**:
```javascript
// 1. 参数验证
if (!connection || !rfmName) {
  return res.status(400).json({
    success: false,
    error: 'connection and rfmName are required'
  });
}

// 2. 创建客户端并连接
const client = new Client(connection);
await client.open();

// 3. 调用 RFC 函数
const result = await client.call(rfmName, parameters || {});

// 4. 关闭连接
await client.close();

// 5. 返回结果
res.json({ success: true, data: result });
```

---

### 🔹 3. 连接测试

**端点**: `POST /api/rfc/test`

**描述**: 测试 SAP 连接配置是否有效，并返回连接延迟

**请求体**:
```json
{
  "connection": {
    "ashost": "sap.server.com",
    "sysnr": "00",
    "user": "username",
    "passwd": "password",
    "client": "100",
    "lang": "EN"
  }
}
```

**请求参数说明**:

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `connection` | Object | ✅ | SAP 连接配置对象（同上） |

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "duration": 245
  }
}
```

**响应字段说明**:
- `duration`: 连接测试耗时（毫秒），包括打开连接、ping 和关闭连接的总时间

**错误响应示例**:
```json
{
  "success": false,
  "error": "RFC_LOGON_FAILURE: User or password invalid"
}
```

**HTTP 状态码**:
- `200 OK` - 连接测试成功
- `400 Bad Request` - 缺少连接参数
- `500 Internal Server Error` - 连接失败

**代码实现要点**:
```javascript
// 1. 记录开始时间
const startTime = Date.now();

// 2. 打开连接
await client.open();

// 3. Ping 测试
await client.ping();

// 4. 关闭连接
await client.close();

// 5. 计算耗时
const duration = Date.now() - startTime;
```

**使用场景**:
- 验证 SAP 连接配置
- 网络延迟诊断
- 连接质量监控
- 自动化健康检查

---

### 🔹 4. 获取 RFC 元数据

**端点**: `POST /api/rfc/metadata`

**描述**: 获取指定 RFC 函数的完整元数据，包括参数定义、类型、方向和自动生成的输入模板

**请求体**:
```json
{
  "connection": {
    "ashost": "sap.server.com",
    "sysnr": "00",
    "user": "username",
    "passwd": "password",
    "client": "100",
    "lang": "EN"
  },
  "rfmName": "BAPI_USER_GET_DETAIL"
}
```

**请求参数说明**:

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `connection` | Object | ✅ | SAP 连接配置对象 |
| `rfmName` | String | ✅ | 要查询元数据的 RFC 函数名称 |

**成功响应示例**:
```json
{
  "success": true,
  "metadata": {
    "name": "BAPI_USER_GET_DETAIL",
    "description": "BAPI: Read User Details",
    "parameters": {
      "USERNAME": {
        "name": "USERNAME",
        "type": "C",
        "direction": "RFC_IMPORT",
        "description": "User Name",
        "optional": false,
        "tabname": "",
        "default": ""
      },
      "RETURN": {
        "name": "RETURN",
        "type": "u",
        "direction": "RFC_EXPORT",
        "description": "Return Messages",
        "optional": false,
        "tabname": "BAPIRET2",
        "default": ""
      }
    }
  },
  "inputTemplate": {
    "USERNAME": "",
    "CACHE_RESULTS": ""
  }
}
```

**响应字段说明**:

#### `metadata` 对象:
- `name`: RFC 函数名称
- `description`: RFC 函数描述文本
- `parameters`: 参数字典

#### `parameters` 对象中每个参数包含:
- `name`: 参数名称
- `type`: 数据类型
  - `C`: 字符型（CHAR）
  - `N`: 数字字符型（NUMC）
  - `D`: 日期型（DATS）
  - `T`: 时间型（TIMS）
  - `I`: 整数型（INT4）
  - `F`: 浮点型（FLOAT）
  - `P`: 压缩数字型（DEC）
  - `u`: 结构体（STRUCTURE）
  - `h`: 表类型（TABLE）
- `direction`: 参数方向
  - `RFC_IMPORT`: 输入参数（客户端传给 SAP）
  - `RFC_EXPORT`: 输出参数（SAP 返回给客户端）
  - `RFC_TABLES`: 表参数（双向）
  - `RFC_CHANGING`: 改变参数（双向）
- `description`: 参数描述
- `optional`: 是否可选（true/false）
- `tabname`: 表类型的结构名称（用于表和结构体）
- `default`: 默认值

#### `inputTemplate` 对象:
自动生成的输入参数模板，只包含需要客户端提供的参数（RFC_IMPORT, RFC_CHANGING, RFC_TABLES）

**错误响应示例**:
```json
{
  "success": false,
  "error": "Failed to get metadata for INVALID_FUNCTION: Function does not exist",
  "suggestion": "Function may not exist or you may not have authorization"
}
```

**HTTP 状态码**:
- `200 OK` - 元数据获取成功
- `400 Bad Request` - 缺少必需参数或函数不存在
- `500 Internal Server Error` - 连接错误或其他异常

**代码实现流程**:

```javascript
// 1. 调用 SAP 标准函数获取接口定义
const result = await client.call('RFC_GET_FUNCTION_INTERFACE', {
  FUNCNAME: rfmName
});

// 2. 解析参数定义
result.PARAMS.forEach(param => {
  // 转换参数类别为方向
  let direction = '';
  switch(param.PARAMCLASS) {
    case 'I': direction = 'RFC_IMPORT'; break;   // 输入
    case 'E': direction = 'RFC_EXPORT'; break;   // 输出
    case 'T': direction = 'RFC_TABLES'; break;   // 表
    case 'C': direction = 'RFC_CHANGING'; break; // 改变
  }
  // 存储参数信息
});

// 3. 生成输入模板
// 对于表类型参数，获取结构定义
if (param.tabname) {
  const typeInfo = await client.call('DDIF_FIELDINFO_GET', {
    TABNAME: param.tabname,
    LANGU: connection.lang || 'EN',
    ALL_TYPES: 'X'
  });
  // 构建示例行
  const sampleRow = {};
  typeInfo.DFIES_TAB.forEach(field => {
    sampleRow[field.FIELDNAME] = '';
  });
  inputTemplate[param.name] = [sampleRow];
}
```

**使用场景**:
- 动态 UI 生成：根据元数据自动生成表单
- API 文档自动生成
- 参数验证
- 自动完成和智能提示
- 测试数据生成

**高级功能**:
- 自动获取嵌套结构定义
- 生成带字段的表模板
- 区分必需和可选参数
- 提供参数描述用于 UI 提示

---

## 代码结构分析

### 主文件：`index.js`

#### 1. 依赖导入和初始化
```javascript
const express = require('express');
const { Client } = require('node-rfc');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
```

**说明**:
- 导入 Express 框架用于构建 REST API
- 导入 node-rfc 的 Client 类用于 RFC 连接
- 导入 CORS 中间件支持跨域请求
- 从环境变量读取端口，默认 3001

#### 2. 中间件配置
```javascript
app.use(cors());
app.use(express.json());
```

**说明**:
- `cors()`: 启用所有路由的跨域资源共享
- `express.json()`: 解析 JSON 请求体

#### 3. 路由处理器

##### 健康检查路由
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'RFC API Server' });
});
```

**逻辑**: 简单返回服务器状态，无需连接 SAP

##### RFC 调用路由
```javascript
app.post('/api/rfc/call', async (req, res) => {
  try {
    // 1. 提取请求参数
    const { connection, rfmName, parameters } = req.body;
    
    // 2. 验证必需参数
    if (!connection || !rfmName) {
      return res.status(400).json({
        success: false,
        error: 'connection and rfmName are required'
      });
    }
    
    // 3. 创建 RFC 客户端
    const client = new Client(connection);
    
    // 4. 打开连接
    await client.open();
    
    // 5. 调用 RFC 函数
    const result = await client.call(rfmName, parameters || {});
    
    // 6. 关闭连接
    await client.close();
    
    // 7. 返回成功响应
    res.json({ success: true, data: result });
    
  } catch (error) {
    // 8. 错误处理
    console.error('RFC call error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

**关键逻辑**:
- 每次调用创建新连接（无状态）
- 自动管理连接生命周期
- 统一错误处理和响应格式
- 使用 async/await 处理异步操作

##### 连接测试路由
```javascript
app.post('/api/rfc/test', async (req, res) => {
  try {
    const { connection } = req.body;
    
    if (!connection) {
      return res.status(400).json({
        success: false,
        error: 'connection is required'
      });
    }
    
    const client = new Client(connection);
    
    // 测量连接时间
    const startTime = Date.now();
    await client.open();
    await client.ping();      // 执行 ping 测试
    await client.close();
    const duration = Date.now() - startTime;
    
    res.json({ success: true, data: { duration } });
    
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

**关键逻辑**:
- 使用 `ping()` 方法验证连接
- 测量完整的连接周期时间
- 提供性能诊断信息

##### 元数据获取路由
```javascript
app.post('/api/rfc/metadata', async (req, res) => {
  try {
    const { connection, rfmName } = req.body;
    
    if (!connection || !rfmName) {
      return res.status(400).json({
        success: false,
        error: 'connection and rfmName are required'
      });
    }
    
    const client = new Client(connection);
    await client.open();
    
    try {
      // 调用 SAP 标准函数获取接口定义
      const result = await client.call('RFC_GET_FUNCTION_INTERFACE', {
        FUNCNAME: rfmName
      });
      
      // 解析参数定义
      const parameters = {};
      if (result.PARAMS) {
        result.PARAMS.forEach(param => {
          // 映射参数类别到方向
          let direction = '';
          switch(param.PARAMCLASS) {
            case 'I': direction = 'RFC_IMPORT'; break;
            case 'E': direction = 'RFC_EXPORT'; break;
            case 'T': direction = 'RFC_TABLES'; break;
            case 'C': direction = 'RFC_CHANGING'; break;
            default: direction = 'UNKNOWN';
          }
          
          parameters[param.PARAMETER] = {
            name: param.PARAMETER,
            type: param.EXID,
            direction: direction,
            description: param.PARAMTEXT,
            optional: param.OPTIONAL === 'X',
            tabname: param.TABNAME,
            default: param.DEFAULT
          };
        });
      }
      
      const metadata = {
        name: rfmName,
        description: result.FUNCTEXT || result.SHORT_TEXT || '',
        parameters
      };
      
      // 生成输入模板
      const inputTemplate = {};
      for (const [paramName, param] of Object.entries(parameters)) {
        // 只包含输入参数
        if (param.direction === 'RFC_IMPORT' || 
            param.direction === 'RFC_CHANGING' || 
            param.direction === 'RFC_TABLES') {
          
          // 对于表类型，获取结构定义
          if (param.tabname) {
            try {
              const typeInfo = await client.call('DDIF_FIELDINFO_GET', {
                TABNAME: param.tabname,
                LANGU: connection.lang || 'EN',
                ALL_TYPES: 'X'
              });
              
              // 构建示例行
              const sampleRow = {};
              if (typeInfo.DFIES_TAB && typeInfo.DFIES_TAB.length > 0) {
                typeInfo.DFIES_TAB.forEach(field => {
                  sampleRow[field.FIELDNAME] = '';
                });
                inputTemplate[param.name] = [sampleRow];
              } else {
                inputTemplate[param.name] = [];
              }
            } catch (err) {
              console.error(`Failed to get structure for ${param.tabname}:`, err.message);
              inputTemplate[param.name] = [];
            }
          } else if (param.type === 'u') {
            // 结构类型
            inputTemplate[param.name] = {};
          } else {
            // 简单类型
            inputTemplate[param.name] = '';
          }
        }
      }
      
      await client.close();
      
      res.json({ success: true, metadata, inputTemplate });
      
    } catch (metadataError) {
      await client.close();
      console.error('Metadata fetch error:', metadataError);
      res.status(400).json({
        success: false,
        error: `Failed to get metadata for ${rfmName}: ${metadataError.message}`,
        suggestion: 'Function may not exist or you may not have authorization'
      });
    }
    
  } catch (error) {
    console.error('RFC metadata error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

**关键逻辑**:
- 使用 `RFC_GET_FUNCTION_INTERFACE` 获取函数签名
- 使用 `DDIF_FIELDINFO_GET` 获取表结构定义
- 智能生成输入模板
- 嵌套 try-catch 处理不同层级的错误

#### 4. 服务器启动
```javascript
app.listen(PORT, () => {
  console.log(`RFC API Server listening on port ${PORT}`);
});
```

---

## 使用示例

### cURL 示例

#### 健康检查
```bash
curl http://localhost:3001/health
```

#### 测试连接
```bash
curl -X POST http://localhost:3001/api/rfc/test \
  -H "Content-Type: application/json" \
  -d '{
    "connection": {
      "ashost": "10.68.110.51",
      "sysnr": "00",
      "user": "demo",
      "passwd": "welcome",
      "client": "620",
      "lang": "EN"
    }
  }'
```

#### 调用 RFC 函数
```bash
curl -X POST http://localhost:3001/api/rfc/call \
  -H "Content-Type: application/json" \
  -d '{
    "connection": {
      "ashost": "10.68.110.51",
      "sysnr": "00",
      "user": "demo",
      "passwd": "welcome",
      "client": "620",
      "lang": "EN"
    },
    "rfmName": "STFC_CONNECTION",
    "parameters": {
      "REQUTEXT": "Hello from cURL"
    }
  }'
```

#### 获取元数据
```bash
curl -X POST http://localhost:3001/api/rfc/metadata \
  -H "Content-Type: application/json" \
  -d '{
    "connection": {
      "ashost": "10.68.110.51",
      "sysnr": "00",
      "user": "demo",
      "passwd": "welcome",
      "client": "620",
      "lang": "EN"
    },
    "rfmName": "BAPI_USER_GET_DETAIL"
  }'
```

### JavaScript 示例

```javascript
// 使用 fetch API
async function callRFC() {
  const response = await fetch('http://localhost:3001/api/rfc/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      connection: {
        ashost: '10.68.110.51',
        sysnr: '00',
        user: 'demo',
        passwd: 'welcome',
        client: '620',
        lang: 'EN'
      },
      rfmName: 'STFC_CONNECTION',
      parameters: {
        REQUTEXT: 'Hello from JavaScript'
      }
    })
  });
  
  const result = await response.json();
  console.log(result);
}

callRFC();
```

### Python 示例

```python
import requests
import json

def call_rfc():
    url = 'http://localhost:3001/api/rfc/call'
    payload = {
        'connection': {
            'ashost': '10.68.110.51',
            'sysnr': '00',
            'user': 'demo',
            'passwd': 'welcome',
            'client': '620',
            'lang': 'EN'
        },
        'rfmName': 'STFC_CONNECTION',
        'parameters': {
            'REQUTEXT': 'Hello from Python'
        }
    }
    
    response = requests.post(url, json=payload)
    result = response.json()
    print(json.dumps(result, indent=2))

call_rfc()
```

---

## 错误处理

### 错误响应格式

所有错误响应都遵循统一格式：

```json
{
  "success": false,
  "error": "错误描述信息",
  "suggestion": "可选的建议信息"
}
```

### 常见错误类型

#### 1. 参数验证错误 (400)
```json
{
  "success": false,
  "error": "connection and rfmName are required"
}
```

**原因**: 请求体缺少必需字段

**解决**: 检查请求体是否包含所有必需参数

#### 2. 认证失败 (500)
```json
{
  "success": false,
  "error": "RFC_LOGON_FAILURE: User or password invalid"
}
```

**原因**: 用户名或密码错误

**解决**: 验证 SAP 凭证

#### 3. 连接失败 (500)
```json
{
  "success": false,
  "error": "RFC_COMMUNICATION_FAILURE: connection to host failed"
}
```

**原因**: 无法连接到 SAP 服务器

**解决**: 
- 检查主机名和端口
- 验证网络连接
- 确认 SAP 系统正在运行

#### 4. 函数不存在 (400)
```json
{
  "success": false,
  "error": "Failed to get metadata for MY_FUNCTION: Function does not exist",
  "suggestion": "Function may not exist or you may not have authorization"
}
```

**原因**: RFC 函数不存在或无权限

**解决**: 
- 确认函数名拼写正确
- 检查用户是否有执行权限
- 验证函数在 SAP 系统中存在

#### 5. 参数错误 (500)
```json
{
  "success": false,
  "error": "RFC_INVALID_PARAMETER: Field TYPE unknown"
}
```

**原因**: 传入了错误的参数名或类型

**解决**: 使用 `/api/rfc/metadata` 获取正确的参数定义

---

## 性能考虑

### 连接管理

**当前实现**: 每个请求创建新连接
- ✅ **优点**: 简单、无状态、易于扩展
- ❌ **缺点**: 每次都有连接开销（通常 100-500ms）

**优化建议**:
- 实现连接池（使用 node-rfc 的 Pool 类）
- 重用连接减少延迟
- 设置连接超时和最大连接数

### 并发处理

**当前实现**: Express 默认并发处理
- 多个请求可以同时处理
- 每个请求独立的 RFC 连接
- 无共享状态

**建议**:
- 监控同时连接数
- 实现请求队列防止过载
- 设置最大并发限制

### 错误重试

**当前实现**: 无自动重试
- 网络抖动可能导致失败

**建议**:
- 实现指数退避重试
- 区分可重试和不可重试错误
- 记录重试次数

### 日志和监控

**当前实现**: 基本的 console.error 日志

**建议**:
- 使用结构化日志（如 Winston）
- 记录请求 ID 用于追踪
- 集成 APM 工具（如 New Relic）
- 记录性能指标

---

## 故障排除

### 问题 1: 服务器无法启动

**症状**: 
```
Error: listen EADDRINUSE: address already in use :::3001
```

**原因**: 端口已被占用

**解决**:
```bash
# 查找占用端口的进程
lsof -i :3001

# 杀死进程
kill -9 <PID>

# 或使用不同端口
PORT=3002 npm start
```

### 问题 2: RFC 连接超时

**症状**:
```
RFC_COMMUNICATION_FAILURE: Connect timeout
```

**原因**: 
- 网络问题
- 防火墙阻止
- SAP 网关配置错误

**解决**:
```bash
# 测试网络连接
telnet <sap-host> 32<sysnr>

# 检查防火墙规则
# 确认 SAP 网关端口开放（默认 33<sysnr>）
```

### 问题 3: 内存泄漏

**症状**: 服务器运行一段时间后内存持续增长

**原因**: 连接未正确关闭

**解决**:
- 确保所有代码路径都调用 `client.close()`
- 使用 try-finally 确保清理
- 监控连接数

```javascript
const client = new Client(connection);
try {
  await client.open();
  const result = await client.call(rfmName, parameters);
  return result;
} finally {
  await client.close();  // 确保总是关闭
}
```

### 问题 4: CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**原因**: 跨域请求被阻止

**解决**:
```javascript
// 配置特定的 CORS 选项
app.use(cors({
  origin: 'http://your-frontend-domain.com',
  methods: ['GET', 'POST'],
  credentials: true
}));
```

---

## 安全建议

### 1. 环境变量
- ❌ 不要在代码中硬编码凭证
- ✅ 使用环境变量或密钥管理服务

### 2. HTTPS
- ❌ 生产环境不要使用 HTTP
- ✅ 使用 HTTPS 加密传输
- ✅ 配置 SSL/TLS 证书

### 3. 速率限制
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100 // 最多 100 个请求
});

app.use('/api/', limiter);
```

### 4. 输入验证
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/rfc/call',
  body('rfmName').isString().trim().notEmpty(),
  body('connection.ashost').isString().trim().notEmpty(),
  // ... 更多验证
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // 处理请求
  }
);
```

### 5. 认证和授权
```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/rfc/call', authenticateToken, async (req, res) => {
  // 处理请求
});
```

---

## 扩展和改进建议

### 1. 连接池实现
```javascript
const { Pool } = require('node-rfc');

const pool = new Pool({
  connectionParameters: { /* ... */ },
  poolOptions: {
    min: 2,
    max: 10
  }
});

app.post('/api/rfc/call', async (req, res) => {
  const client = await pool.acquire();
  try {
    const result = await client.call(rfmName, parameters);
    res.json({ success: true, data: result });
  } finally {
    pool.release(client);
  }
});
```

### 2. 缓存元数据
```javascript
const NodeCache = require('node-cache');
const metadataCache = new NodeCache({ stdTTL: 3600 });

app.post('/api/rfc/metadata', async (req, res) => {
  const cacheKey = `${rfmName}`;
  const cached = metadataCache.get(cacheKey);
  
  if (cached) {
    return res.json({ success: true, ...cached, fromCache: true });
  }
  
  // 获取元数据
  // ...
  
  metadataCache.set(cacheKey, { metadata, inputTemplate });
  res.json({ success: true, metadata, inputTemplate });
});
```

### 3. 请求日志
```javascript
const morgan = require('morgan');
app.use(morgan('combined'));
```

### 4. 健康检查增强
```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    service: 'RFC API Server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
  
  // 可选: 测试 SAP 连接
  if (req.query.deep === 'true') {
    try {
      // 快速 ping 测试
      health.sapConnection = 'ok';
    } catch (err) {
      health.sapConnection = 'error';
      health.status = 'degraded';
    }
  }
  
  res.json(health);
});
```

---

## 部署

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
```

### 启动命令
```bash
# 构建镜像
docker build -t rfc-server .

# 运行容器
docker run -d -p 3001:3001 \
  -e PORT=3001 \
  --name rfc-server \
  rfc-server
```

### Kubernetes 部署

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rfc-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rfc-server
  template:
    metadata:
      labels:
        app: rfc-server
    spec:
      containers:
      - name: rfc-server
        image: rfc-server:latest
        ports:
        - containerPort: 3001
        env:
        - name: PORT
          value: "3001"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: rfc-server
spec:
  selector:
    app: rfc-server
  ports:
  - port: 80
    targetPort: 3001
  type: LoadBalancer
```

---

## 总结

RFC Server 提供了一个简单而强大的方式来通过 HTTP 访问 SAP RFC 函数。它的无状态设计使其易于扩展，而完整的元数据支持使其非常适合构建动态 UI 和自动化工具。

### 适用场景
- ✅ 微服务架构中的 SAP 集成
- ✅ Web 应用的 SAP 后端
- ✅ 移动应用的 SAP 集成
- ✅ 自动化脚本和工具
- ✅ API 网关模式

### 不适用场景
- ❌ 需要有状态会话的场景（考虑使用连接池）
- ❌ 极高性能要求（考虑直接使用 node-rfc）
- ❌ 复杂事务处理（考虑使用 BAPI 事务模式）

---

*文档版本: 1.0*  
*最后更新: 2025年12月21日*
