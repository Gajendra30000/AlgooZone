// Logger utility for consistent error tracking
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

export const logger = {
  info: (title, message, data = null) => {
    console.log(`\n${colors.blue}ℹ️  ${title}${colors.reset}`);
    if (message) console.log(`   ${message}`);
    if (data) console.log(`   ${JSON.stringify(data, null, 2)}`);
  },

  success: (title, message, data = null) => {
    console.log(`\n${colors.green}✅ ${title}${colors.reset}`);
    if (message) console.log(`   ${message}`);
    if (data) console.log(`   ${JSON.stringify(data, null, 2)}`);
  },

  warn: (title, message, data = null) => {
    console.warn(`\n${colors.yellow}⚠️  ${title}${colors.reset}`);
    if (message) console.warn(`   ${message}`);
    if (data) console.warn(`   ${JSON.stringify(data, null, 2)}`);
  },

  error: (title, error, context = null) => {
    console.error(`\n${colors.red}❌ ${title}${colors.reset}`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Error Type: ${error.name}`);
    console.error(`   Error Code: ${error.code || 'N/A'}`);
    if (error.stack) console.error(`   Stack: ${error.stack}`);
    if (context) console.error(`   Context: ${JSON.stringify(context, null, 2)}`);
    console.error(`   Timestamp: ${new Date().toISOString()}`);
  },

  debug: (title, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n${colors.cyan}🔍 DEBUG: ${title}${colors.reset}`);
      console.log(`   ${JSON.stringify(data, null, 2)}`);
    }
  },

  request: (method, url, status, duration) => {
    const statusColor = status < 400 ? colors.green : status < 500 ? colors.yellow : colors.red;
    console.log(`${statusColor}${status}${colors.reset} ${method} ${url} (${duration}ms)`);
  }
};

export default logger;
