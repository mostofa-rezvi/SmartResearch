#!/bin/bash

# ResearchBridge Infrastructure Health Check Script

echo "Checking Infrastructure Health..."

# 1. Check PostgreSQL
echo -n "Checking PostgreSQL (Port 5432)... "
if docker exec rb-postgres pg_isready -U postgres > /dev/null 2>&1; then
  echo "OK"
else
  echo "FAILED"
fi

# 2. Check Redis
echo -n "Checking Redis (Port 6379)... "
if docker exec rb-redis redis-cli ping > /dev/null 2>&1; then
  echo "OK"
else
  echo "FAILED"
fi

# 3. Check Elasticsearch
echo -n "Checking Elasticsearch (Port 9200)... "
if curl -s -f http://localhost:9200/_cluster/health > /dev/null 2>&1; then
  echo "OK"
else
  echo "FAILED"
fi

# 4. Check Neo4j
echo -n "Checking Neo4j (Port 7474)... "
if curl -s -f http://localhost:7474 > /dev/null 2>&1; then
  echo "OK"
else
  echo "FAILED"
fi

# 5. Check ML Service
echo -n "Checking ML Service (Port 8000)... "
if curl -s -f http://localhost:8000/health > /dev/null 2>&1; then
  echo "OK"
else
  echo "FAILED"
fi

echo "Health check complete."
