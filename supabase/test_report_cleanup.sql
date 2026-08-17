-- Removes only records created by test_report_seed.sql.

begin;

delete from public.contract_reviews
where id in ('90000000-0000-4000-8000-000000000001');

delete from public.contract_reviews
where id in (
  select md5('report-review-' || n)::uuid
  from generate_series(4, 16, 4) as n
);

delete from public.messages
where id in (
  '80000000-0000-4000-8000-000000000001',
  '80000000-0000-4000-8000-000000000002',
  '80000000-0000-4000-8000-000000000003'
);

delete from public.messages
where id in (
  select md5('report-message-' || n)::uuid
  from generate_series(1, 18) as n
);

delete from public.disputes
where id in ('70000000-0000-4000-8000-000000000001');

delete from public.disputes
where id in (
  select md5('report-dispute-' || n)::uuid
  from generate_series(6, 18, 6) as n
);

delete from public.escrow_transactions
where id in (
  '60000000-0000-4000-8000-000000000001',
  '60000000-0000-4000-8000-000000000002',
  '60000000-0000-4000-8000-000000000003',
  '60000000-0000-4000-8000-000000000004',
  '60000000-0000-4000-8000-000000000005',
  '60000000-0000-4000-8000-000000000006'
);

delete from public.escrow_transactions
where id in (
  select md5('report-lock-transaction-' || n)::uuid
  from generate_series(1, 18) as n
  union all
  select md5('report-release-transaction-' || n)::uuid
  from generate_series(4, 16, 4) as n
);

delete from public.deliverables
where id in (
  '50000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000003'
);

delete from public.deliverables
where id in (
  select md5('report-deliverable-' || n)::uuid
  from generate_series(1, 18) as n
);

delete from public.milestones
where id in (
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000003',
  '40000000-0000-4000-8000-000000000004'
);

delete from public.milestones
where id in (
  select md5('report-milestone-' || n)::uuid
  from generate_series(1, 18) as n
);

delete from public.contracts
where id in (
  '30000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000003'
);

delete from public.contracts
where id in (
  select md5('report-contract-' || n)::uuid
  from generate_series(1, 18) as n
);

delete from public.applications
where id in (
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000004'
);

delete from public.applications
where id in (
  select md5('report-application-' || n)::uuid
  from generate_series(1, 24) as n
);

delete from public.project_tags
where project_id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004'
);

delete from public.project_tags
where project_id in (
  select md5('report-project-' || n)::uuid
  from generate_series(1, 24) as n
);

delete from public.projects
where id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004'
);

delete from public.projects
where id in (
  select md5('report-project-' || n)::uuid
  from generate_series(1, 24) as n
);

commit;
