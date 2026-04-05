#!/usr/bin/env bash
# Uso: ./run.sh [hu002|hu004|hu006|hu013|main] [opciones k6 extra]
# Ejemplo: ./run.sh main --out json=reports/result.json

set -euo pipefail

ENV_FILE="$(dirname "$0")/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: No se encontró .env — copia .env.example como .env y completa los valores."
  exit 1
fi
set -a
# shellcheck source=.env
source "$ENV_FILE"
set +a

TARGET="${1:-main}"
shift || true

case "$TARGET" in
  hu002) SCRIPT="tests/hu002-asegurados.js"      ;;
  hu004) SCRIPT="tests/hu004-vehiculos.js"        ;;
  hu006) SCRIPT="tests/hu006-polizas.js"          ;;
  hu013) SCRIPT="tests/hu013-reclamos-estado.js"  ;;
  main)  SCRIPT="tests/main-test.js"              ;;
  *)
    echo "Uso: ./run.sh [hu002|hu004|hu006|hu013|main] [opciones k6 extra]"
    exit 1
    ;;
esac

echo "▶ k6 run $SCRIPT $*"
k6 run "$SCRIPT" "$@"
