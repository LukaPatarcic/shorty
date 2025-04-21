import tracer from "dd-trace";
import packageJson from '../../package.json';

tracer.init({
    service: 'shorten-service',
    version: packageJson.version,
    env: 'shorty',
    logInjection: true,
    sampleRate: 1,
    apmTracingEnabled: true,
    appsec: true,
    profiling: true,
    hostname: 'datadog-agent',
    port: 8126,
});

export default tracer;