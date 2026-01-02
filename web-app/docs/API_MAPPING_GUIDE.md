# REST API 到 SAP RFC 映射接口

## 概述

这个功能允许你通过简单的配置，将外部的 REST API 调用自动映射到 SAP RFC 函数调用。

## 工作流程

```
外部系统 POST JSON → 映射转换 → SAP RFC 调用 → 返回结果
```

## 创建接口

### 1. 访问接口管理页面

导航到 `/rfc-templates` 页面，点击"创建接口"按钮。

### 2. 填写基本信息

- **接口名称**: 例如 "获取客户信息"
- **接口描述**: 描述这个接口的用途
- **API 路径**: 例如 `/api/external/get-customer`
- **API Key**: 自动生成，用于认证外部请求
- **SAP 连接**: 选择要使用的 SAP 连接
- **RFC 函数名**: 例如 `BAPI_CUSTOMER_GETDETAIL`

### 3. 配置输入映射

定义如何将 REST API 的 JSON 输入映射到 RFC 参数：

| RFC 参数名 | API JSON 路径 | 说明 |
|-----------|--------------|------|
| CUSTOMER_ID | $.customerId | 客户编号 |
| CUSTOMER_NAME | $.name | 客户名称 |
| DETAILS | $.details | 详细信息对象 |

**JSONPath 语法示例**:
- `$.field` - 根级字段
- `$.customer.id` - 嵌套字段
- `$.items[0].name` - 数组第一个元素的字段
- `$` - 整个 JSON 对象

### 4. 配置输出映射（可选）

默认情况下，返回 RFC 的完整结果。如果需要自定义输出格式：

| RFC 返回字段 | API 输出路径 | 说明 |
|-------------|-------------|------|
| CUSTOMER_NAME | $.name | 客户名称 |
| ADDRESS | $.address | 地址 |

## 使用接口

### 请求示例

```bash
curl -X POST https://your-domain.com/api/external/get-customer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_abc123xyz456" \
  -d '{
    "customerId": "12345",
    "name": "Test Customer",
    "details": {
      "type": "VIP"
    }
  }'
```

### 响应示例

**未配置输出映射时**（返回完整 RFC 结果）:
```json
{
  "success": true,
  "data": {
    "CUSTOMER_NAME": "Test Customer",
    "ADDRESS": "123 Main St",
    "PHONE": "+1234567890",
    ...
  },
  "_meta": {
    "duration": 245,
    "rfmName": "BAPI_CUSTOMER_GETDETAIL"
  }
}
```

**配置输出映射后**（返回映射的结果）:
```json
{
  "success": true,
  "data": {
    "name": "Test Customer",
    "address": "123 Main St"
  },
  "_meta": {
    "duration": 245,
    "rfmName": "BAPI_CUSTOMER_GETDETAIL"
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "RFC call failed: ..."
}
```

## 认证

所有外部 API 调用必须在请求头中包含 API Key：

```
Authorization: Bearer YOUR_API_KEY
```

如果缺失或错误，将返回 401 错误。

## 查看接口信息

可以通过 GET 请求查看接口配置（不需要 API Key）：

```bash
curl https://your-domain.com/api/external/get-customer
```

返回：
```json
{
  "success": true,
  "data": {
    "name": "获取客户信息",
    "description": "...",
    "rfmName": "BAPI_CUSTOMER_GETDETAIL",
    "inputMapping": { ... },
    "outputMapping": { ... },
    "usage": {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

## 调用历史

所有通过接口的调用都会被记录在 `RFCCall` 表中，可以在管理界面查看：
- 调用时间
- 执行时长
- 输入参数
- 返回结果
- 调用来源（IP）
- 状态（成功/失败）

## 优势

✅ **简单直接**: 无需复杂的工作流设计，直接定义映射规则  
✅ **灵活映射**: 支持 JSONPath 语法，可以映射嵌套和数组字段  
✅ **安全认证**: 每个接口有独立的 API Key  
✅ **完整日志**: 记录所有调用历史和性能数据  
✅ **自动处理**: 自动管理 SAP 连接的打开和关闭  

## 示例场景

### 1. 订单创建接口

**外部系统发送**:
```json
{
  "orderNumber": "SO-2024-001",
  "customer": {
    "id": "CUST001",
    "name": "ABC Corp"
  },
  "items": [
    { "sku": "ITEM001", "quantity": 10 }
  ],
  "totalAmount": 1000.00
}
```

**映射配置**:
- `ORDER_NUMBER` ← `$.orderNumber`
- `CUSTOMER_ID` ← `$.customer.id`
- `ITEMS` ← `$.items`
- `TOTAL_AMOUNT` ← `$.totalAmount`

**调用 RFC**: `BAPI_ORDER_CREATE`

### 2. 库存查询接口

**外部系统发送**:
```json
{
  "productId": "PROD001",
  "warehouse": "WH01"
}
```

**映射配置**:
- `MATERIAL_NUMBER` ← `$.productId`
- `PLANT` ← `$.warehouse`

**调用 RFC**: `BAPI_MATERIAL_STOCK_REQ_LIST`

**输出映射**:
- `$.availableQuantity` ← `STOCK_QTY`
- `$.unit` ← `UNIT`

## 技术细节

- **JSON 映射**: 使用 `jsonpath-plus` 库
- **并发处理**: 每个请求独立处理
- **连接池**: 自动管理 SAP RFC 连接
- **错误处理**: 详细的错误信息和日志
- **性能监控**: 记录每次调用的执行时长
