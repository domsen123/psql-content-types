#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER contenttypes;
    CREATE DATABASE contenttypes;
    GRANT ALL PRIVILEGES ON DATABASE contenttypes TO contenttypes;
EOSQL
