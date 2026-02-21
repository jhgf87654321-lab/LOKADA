#!/usr/bin/env node

/**
 * 环境变量配置检查脚本
 * 用于验证 CloudBase 环境变量是否正确配置
 */

const fs = require('fs');
const path = require('path');

// 必需的环境变量列表
const REQUIRED_ENV_VARS = {
  // CloudBase 客户端配置（必需）
  'NEXT_PUBLIC_CLOUDBASE_ENV': {
    description: 'CloudBase 环境 ID',
    required: true,
    scope: 'client',
  },
  'NEXT_PUBLIC_CLOUDBASE_CLIENT_ID': {
    description: 'CloudBase Client ID',
    required: true,
    scope: 'client',
  },
  'NEXT_PUBLIC_CLOUDBASE_REGION': {
    description: 'CloudBase 地域',
    required: true,
    scope: 'client',
    defaultValue: 'ap-shanghai',
  },
  // 数据库配置（必需）
  'DATABASE_URL': {
    description: '数据库连接字符串',
    required: true,
    scope: 'server',
  },
  // 可选的环境变量
  'DIRECT_URL': {
    description: '直连数据库连接字符串',
    required: false,
    scope: 'server',
  },
  'DASHSCOPE_API_KEY': {
    description: '阿里云百炼 DashScope API Key（Paraformer 语音识别，支持 webm）',
    required: false,
    scope: 'server',
  },
  'BLOB_READ_WRITE_TOKEN': {
    description: 'Vercel Blob 读写 Token（ASR 临时存储音频）',
    required: false,
    scope: 'server',
  },
  'ALIYUN_ACCESS_KEY_ID': {
    description: '阿里云 AccessKey ID（已弃用，ASR 改用 DashScope）',
    required: false,
    scope: 'server',
  },
  'ALIYUN_ACCESS_KEY_SECRET': {
    description: '阿里云 AccessKey Secret（已弃用）',
    required: false,
    scope: 'server',
  },
  'ALIYUN_NLS_APPKEY': {
    description: '阿里云智能语音 Appkey（已弃用）',
    required: false,
    scope: 'server',
  },
  'COS_SECRET_ID': {
    description: '腾讯云 COS Secret ID',
    required: false,
    scope: 'server',
  },
  'COS_SECRET_KEY': {
    description: '腾讯云 COS Secret Key',
    required: false,
    scope: 'server',
  },
  'COS_BUCKET': {
    description: 'COS 存储桶名称',
    required: false,
    scope: 'server',
  },
  'COS_REGION': {
    description: 'COS 地域',
    required: false,
    scope: 'server',
  },
};

// 读取 .env 文件
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  const env = {};
  
  // 读取 .env
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    parseEnvContent(content, env);
  }
  
  // 读取 .env.local（优先级更高）
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    parseEnvContent(content, env);
  }
  
  // 合并 process.env（运行时环境变量优先级最高）
  Object.assign(env, process.env);
  
  return env;
}

// 解析 .env 文件内容
function parseEnvContent(content, env) {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // 跳过注释和空行
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // 移除引号
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }
}

// 检查环境变量
function checkEnvVars() {
  const env = loadEnvFile();
  const results = {
    passed: [],
    missing: [],
    empty: [],
    warnings: [],
  };
  
  console.log('🔍 检查环境变量配置...\n');
  
  for (const [varName, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = env[varName];
    const scope = config.scope === 'client' ? '客户端' : '服务端';
    const status = config.required ? '必需' : '可选';
    
    if (!value) {
      if (config.required) {
        results.missing.push({
          name: varName,
          description: config.description,
          scope,
        });
      } else {
        results.warnings.push({
          name: varName,
          description: config.description,
          scope,
        });
      }
    } else if (value.includes('<') || value.includes('[') || value === '') {
      // 检查是否是占位符
      results.empty.push({
        name: varName,
        description: config.description,
        scope,
        value,
      });
    } else {
      results.passed.push({
        name: varName,
        description: config.description,
        scope,
        value: config.scope === 'server' && varName.includes('SECRET') || varName.includes('PASSWORD')
          ? '***' // 隐藏敏感信息
          : value.substring(0, 50), // 只显示前50个字符
      });
    }
  }
  
  // 输出结果
  if (results.passed.length > 0) {
    console.log('✅ 已配置的环境变量:');
    results.passed.forEach(({ name, description, scope, value }) => {
      console.log(`   ${name.padEnd(35)} ${description.padEnd(25)} [${scope}] ${value}`);
    });
    console.log('');
  }
  
  if (results.missing.length > 0) {
    console.log('❌ 缺失的必需环境变量:');
    results.missing.forEach(({ name, description, scope }) => {
      console.log(`   ${name.padEnd(35)} ${description.padEnd(25)} [${scope}]`);
    });
    console.log('');
  }
  
  if (results.empty.length > 0) {
    console.log('⚠️  包含占位符的环境变量（需要替换为实际值）:');
    results.empty.forEach(({ name, description, scope, value }) => {
      console.log(`   ${name.padEnd(35)} ${description.padEnd(25)} [${scope}]`);
      console.log(`   当前值: ${value.substring(0, 80)}`);
    });
    console.log('');
  }
  
  if (results.warnings.length > 0) {
    console.log('ℹ️  未配置的可选环境变量:');
    results.warnings.forEach(({ name, description, scope }) => {
      console.log(`   ${name.padEnd(35)} ${description.padEnd(25)} [${scope}]`);
    });
    console.log('');
  }
  
  // 总结
  console.log('📊 检查结果:');
  console.log(`   已配置: ${results.passed.length}`);
  console.log(`   缺失: ${results.missing.length}`);
  console.log(`   占位符: ${results.empty.length}`);
  console.log(`   可选未配置: ${results.warnings.length}`);
  console.log('');
  
  if (results.missing.length > 0 || results.empty.length > 0) {
    console.log('💡 提示:');
    if (results.missing.length > 0) {
      console.log('   - 请在 .env 文件或 CloudBase 控制台中配置缺失的必需环境变量');
    }
    if (results.empty.length > 0) {
      console.log('   - 请将占位符替换为实际的值（如数据库密码、API Key 等）');
    }
    console.log('   - 详细配置说明请查看 CLOUDBASE_ENV_CONFIG.md');
    console.log('');
    process.exit(1);
  } else {
    console.log('✅ 所有必需的环境变量已正确配置！');
    console.log('');
    process.exit(0);
  }
}

// 运行检查
checkEnvVars();
