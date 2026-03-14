<?php

namespace App\Logging;

use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;
use OpenTelemetry\API\Globals;

class TraceIdProcessor implements ProcessorInterface
{
    public function __invoke(LogRecord $record): LogRecord
    {
        try {
            $span = \OpenTelemetry\API\Trace\Span::getCurrent();
            $ctx  = $span->getContext();

            if ($ctx->isValid()) {
                return $record->with(context: array_merge($record->context, [
                    'traceId' => $ctx->getTraceId(),
                    'spanId'  => $ctx->getSpanId(),
                ]));
            }
        } catch (\Throwable) {}

        return $record;
    }
}
