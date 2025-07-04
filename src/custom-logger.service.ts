import { LoggerService, LogLevel } from '@nestjs/common';

export class CustomLoggerService implements LoggerService {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    this.printMessage(message, '信息', context);
  }

  error(message: any, trace?: string, context?: string) {
    this.printMessage(message, '错误', context);
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: any, context?: string) {
    this.printMessage(message, '警告', context);
  }

  debug(message: any, context?: string) {
    this.printMessage(message, '调试', context);
  }

  verbose(message: any, context?: string) {
    this.printMessage(message, '详细', context);
  }

  private printMessage(message: any, logLevel: string, context?: string) {
    const timestamp = new Date().toLocaleString('zh-CN');
    const ctx = this.translateContext(context || this.context || '应用程序');
    const pid = process.pid;
    
    // 翻译常见的英文日志消息
    const translatedMessage = this.translateMessage(message.toString());
    
    // 根据日志级别设置颜色
    const colors = {
      '信息': '\x1b[32m', // 绿色
      '错误': '\x1b[31m', // 红色
      '警告': '\x1b[33m', // 黄色
      '调试': '\x1b[36m', // 青色
      '详细': '\x1b[35m', // 紫色
    };
    
    const color = colors[logLevel] || '\x1b[0m';
    const reset = '\x1b[0m';
    
    console.log(
      `${color}[Nest] ${pid}  - ${timestamp}     ${logLevel} [${ctx}] ${translatedMessage}${reset}`
    );
  }

  private translateMessage(message: string): string {
    const translations = {
      'Starting Nest application...': '正在启动 Nest 应用程序...',
      'Nest application successfully started': 'Nest 应用程序启动成功',
      'dependencies initialized': '依赖项初始化完成',
      'Mapped': '已映射',
      'route': '路由',
      'GET': 'GET',
      'POST': 'POST',
      'PUT': 'PUT',
      'DELETE': 'DELETE',
      'PATCH': 'PATCH',
    };

    let translatedMessage = message;
    for (const [english, chinese] of Object.entries(translations)) {
      translatedMessage = translatedMessage.replace(new RegExp(english, 'gi'), chinese);
    }

    // 处理路由映射消息
    if (translatedMessage.includes('已映射') && translatedMessage.includes('路由')) {
      translatedMessage = translatedMessage.replace(/已映射\s*\{([^}]+)\}\s*路由/, '已映射路由 {$1}');
    }

    return translatedMessage;
  }

  private translateContext(context: string): string {
    const contextTranslations = {
      'NestFactory': 'Nest工厂',
      'InstanceLoader': '实例加载器',
      'RoutesResolver': '路由解析器',
      'RouterExplorer': '路由探索器',
      'NestApplication': 'Nest应用程序',
      'AppModule': '应用模块',
      'AppController': '应用控制器',
      'AppService': '应用服务',
    };

    return contextTranslations[context] || context;
  }

  setLogLevels(levels: LogLevel[]) {
    // 实现日志级别设置
  }
}