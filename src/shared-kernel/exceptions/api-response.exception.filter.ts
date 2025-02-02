import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      status = exception.getStatus();
      message =
        typeof response === 'string' ? response : JSON.stringify(response);

      this.logger.error(`Status: ${status} Error: ${JSON.stringify(message)}`);
    } else {
      message = exception.message;
      this.logger.error({
        name: exception.name,
        message: exception.message ?? 'Unknown Error Occurred',
      });
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
