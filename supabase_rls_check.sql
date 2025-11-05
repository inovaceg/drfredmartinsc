SELECT
    p.policyname AS policy_name,
    p.permissive AS is_permissive,
    p.cmd AS command,
    p.qual AS using_expression,
    p.with_check AS with_check_expression,
    p.roles AS roles_applied_to
FROM
    pg_policies p
WHERE
    p.schemaname = 'public' AND p.tablename = 'video_sessions';