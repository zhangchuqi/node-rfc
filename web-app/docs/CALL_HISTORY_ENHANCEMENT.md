# Call History 增强说明

## 概述

现在所有的 RFC 调用历史都会记录更详细的信息，特别是错误信息。

## 新增字段

### 1. `errorDetails` (JSON)

存储完整的错误对象，包括：

```json
{
  "message": "主要错误消息",
  "name": "错误类型名称",
  "code": "错误代码",
  "key": "错误键",
  
  // SAP ABAP 错误信息（如果有）
  "abapMsgClass": "ABAP 消息类",
  "abapMsgType": "消息类型 (E/W/I/S)",
  "abapMsgNumber": "消息编号",
  "abapMsgV1": "消息变量 1",
  "abapMsgV2": "消息变量 2",
  "abapMsgV3": "消息变量 3",
  "abapMsgV4": "消息变量 4",
  
  // RFC 错误信息（如果有）
  "group": "RFC 错误组",
  "rfcMsgClass": "RFC 消息类",
  "rfcMsgNumber": "RFC 消息编号",
  
  // 堆栈信息（前 2000 字符）
  "stack": "错误堆栈跟踪..."
}
```

### 2. `requestBody` (JSON)

存储原始请求体，便于重现问题：

- 对于外部 API 调用（`/api/external/*`）：存储完整的 POST body
- 对于 Web 界面调用：存储调用参数
- 对于公共 API 调用：存储请求参数

### 3. `calledBy` (String)

增强了调用者识别：

- 外部 API 调用：客户端 IP 地址（从 `x-forwarded-for` 或 `x-real-ip` 头获取）
- Web 界面调用：'web-user' 或实际 IP
- 公共 API 调用：客户端 IP

## 错误类型说明

### SAP ABAP 错误

当 RFC 调用失败时，SAP 系统可能返回 ABAP 错误信息：

- **abapMsgType**:
  - `E` - Error（错误）
  - `W` - Warning（警告）
  - `I` - Information（信息）
  - `S` - Success（成功）
  
- **abapMsgClass**: ABAP 消息类（如 `SABAPDOCU`）
- **abapMsgNumber**: 消息编号（如 `001`）
- **abapMsgV1-V4**: 消息变量，用于填充消息文本中的占位符

**示例**：
```json
{
  "abapMsgClass": "FI",
  "abapMsgType": "E",
  "abapMsgNumber": "001",
  "abapMsgV1": "CUST001",
  "message": "Customer CUST001 not found"
}
```

### RFC 错误

RFC 层面的错误（连接、通信等）：

- **group**: 错误组（如 `COMMUNICATION_FAILURE`, `LOGON_FAILURE`）
- **code**: RFC 错误代码
- **key**: RFC 错误键

**常见错误组**：
- `COMMUNICATION_FAILURE` - 通信失败
- `LOGON_FAILURE` - 登录失败
- `SYSTEM_FAILURE` - 系统错误
- `ABAP_RUNTIME_FAILURE` - ABAP 运行时错误

## 使用示例

### 查询错误调用

```typescript
const errorCalls = await prisma.rFCCall.findMany({
  where: {
    status: 'ERROR',
    calledAt: {
      gte: new Date('2024-01-01')
    }
  },
  include: {
    template: {
      select: {
        name: true,
        apiPath: true
      }
    }
  },
  orderBy: {
    calledAt: 'desc'
  }
});

// 分析错误详情
errorCalls.forEach(call => {
  console.log('Error:', call.errorMessage);
  
  if (call.errorDetails) {
    const details = call.errorDetails as any;
    
    // ABAP 错误
    if (details.abapMsgClass) {
      console.log(`ABAP Error: ${details.abapMsgClass}/${details.abapMsgNumber}`);
      console.log(`Type: ${details.abapMsgType}`);
      console.log(`Variables: ${details.abapMsgV1}, ${details.abapMsgV2}`);
    }
    
    // RFC 错误
    if (details.group) {
      console.log(`RFC Error Group: ${details.group}`);
    }
    
    // 堆栈跟踪
    if (details.stack) {
      console.log('Stack:', details.stack);
    }
  }
  
  // 重现请求
  if (call.requestBody) {
    console.log('Original Request:', call.requestBody);
  }
});
```

### 统计错误类型

```typescript
// 按错误类型统计
const errorStats = await prisma.$queryRaw`
  SELECT 
    error_details->>'abapMsgClass' as msg_class,
    error_details->>'abapMsgNumber' as msg_number,
    COUNT(*) as count
  FROM rfc_calls
  WHERE status = 'ERROR'
    AND error_details IS NOT NULL
    AND error_details->>'abapMsgClass' IS NOT NULL
  GROUP BY msg_class, msg_number
  ORDER BY count DESC
  LIMIT 10
`;
```

### 按调用者统计

```typescript
const callerStats = await prisma.rFCCall.groupBy({
  by: ['calledBy', 'status'],
  _count: true,
  where: {
    calledAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 最近 24 小时
    }
  }
});
```

## API 响应增强

在开发环境中，API 会返回详细的错误信息：

```json
{
  "success": false,
  "error": "Customer not found",
  "errorCode": "E001",
  "errorDetails": {
    "abapMsgClass": "FI",
    "abapMsgType": "E",
    "abapMsgNumber": "001",
    "abapMsgV1": "CUST001"
  }
}
```

在生产环境中，`errorDetails` 不会返回给外部调用者，只会记录在数据库中。

## 监控和告警

可以基于这些详细信息设置监控：

1. **按错误类型告警**：当特定的 ABAP 错误频繁出现时
2. **按调用者告警**：当某个 IP 的错误率过高时
3. **性能告警**：当调用耗时超过阈值时

```typescript
// 示例：检测异常调用者
const suspiciousCallers = await prisma.$queryRaw`
  SELECT 
    called_by,
    COUNT(*) as total_calls,
    SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END) as error_count,
    (SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END)::float / COUNT(*)) as error_rate
  FROM rfc_calls
  WHERE called_at > NOW() - INTERVAL '1 hour'
  GROUP BY called_by
  HAVING (SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END)::float / COUNT(*)) > 0.5
  ORDER BY error_rate DESC
`;
```

## 数据保留策略

建议定期归档或清理旧的调用记录：

```sql
-- 删除 30 天前的成功调用记录
DELETE FROM rfc_calls 
WHERE status = 'SUCCESS' 
  AND called_at < NOW() - INTERVAL '30 days';

-- 保留错误记录 90 天
DELETE FROM rfc_calls 
WHERE status = 'ERROR' 
  AND called_at < NOW() - INTERVAL '90 days';
```

## 隐私和安全

⚠️ **注意事项**：

1. `requestBody` 可能包含敏感数据，确保数据库访问受到保护
2. 在日志或监控中展示时，注意脱敏处理
3. 定期审查存储的数据，确保符合隐私政策
4. 考虑加密存储敏感字段

## 性能考虑

- `errorDetails` 和 `requestBody` 字段使用 JSONB 类型，支持高效查询
- 可以在 JSON 字段上创建 GIN 索引以提升查询性能：

```sql
CREATE INDEX idx_rfc_calls_error_details ON rfc_calls USING gin (error_details);
CREATE INDEX idx_rfc_calls_request_body ON rfc_calls USING gin (request_body);
```
