import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const traceExporter = new OTLPTraceExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    'http://localhost:4318/v1/traces',
});

export const otelSDK = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

otelSDK.start();
process.on('SIGTERM', () => {
  otelSDK.shutdown().then(() => console.log('OTel terminado con éxito.'));
});
