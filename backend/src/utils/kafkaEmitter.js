// Mock Kafka Emitter for Event-Driven Architecture Downstream processing
const emitEvent = (topic, partitionKey, payload) => {
  console.log(`[KAFKA EMIT] Topic: ${topic} | Key: ${partitionKey}`);
  console.log(`[KAFKA PAYLOAD] ${JSON.stringify(payload)}`);
  // In production, this would be a real Kafka producer:
  // producer.send({ topic, messages: [{ key: partitionKey, value: JSON.stringify(payload) }] })
};

module.exports = { emitEvent };
