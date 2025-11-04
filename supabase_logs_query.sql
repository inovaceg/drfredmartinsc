SELECT
  pid,
  datname,
  usename,
  application_name,
  client_addr,
  client_port,
  backend_start,
  xact_start,
  query_start,
  state_change,
  state,
  wait_event_type,
  wait_event,
  query
FROM
  pg_stat_activity
WHERE
  datname = current_database()
  AND pid <> pg_backend_pid()
ORDER BY
  query_start DESC;