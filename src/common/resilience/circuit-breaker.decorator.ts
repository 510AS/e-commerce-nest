import { Logger } from '@nestjs/common';

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const breakers = new Map<string, CircuitBreakerState>();

export function CircuitBreaker(
  config: { name: string; threshold?: number; resetTimeout?: number } = { name: 'default' },
): MethodDecorator {
  const threshold = config.threshold ?? 3;
  const resetTimeout = config.resetTimeout ?? 30000;

  return function (_target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    const logger = new Logger(`CircuitBreaker:${config.name}`);

    descriptor.value = async function (...args: any[]) {
      const key = `${config.name}:${String(propertyKey)}`;
      const state = breakers.get(key) ?? { failures: 0, lastFailure: 0, state: 'CLOSED' };

      if (state.state === 'OPEN') {
        if (Date.now() - state.lastFailure > resetTimeout) {
          state.state = 'HALF_OPEN';
          logger.log(`Circuit half-open for ${key}`);
        } else {
          throw new Error(`Circuit breaker ${config.name} is OPEN`);
        }
      }

      try {
        const result = await original.apply(this, args);
        if (state.state === 'HALF_OPEN') {
          state.state = 'CLOSED';
          state.failures = 0;
          logger.log(`Circuit closed for ${key}`);
        }
        breakers.set(key, state);
        return result;
      } catch (error) {
        state.failures++;
        state.lastFailure = Date.now();
        if (state.failures >= threshold) {
          state.state = 'OPEN';
          logger.warn(`Circuit OPEN for ${key} after ${state.failures} failures`);
        }
        breakers.set(key, state);
        throw error;
      }
    };

    return descriptor;
  };
}
