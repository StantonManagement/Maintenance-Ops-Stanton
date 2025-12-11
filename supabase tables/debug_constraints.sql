-- Query to inspect existing constraints on compliance_deadlines
SELECT 
    con.conname as constraint_name, 
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = connamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'compliance_deadlines';
