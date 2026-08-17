-- Test data for the report queries from section 3.3.2.
-- Run in Supabase SQL Editor. No real wallets or blockchain transactions are required.
--
-- Existing profiles used:
-- customer: 1768b500-d44a-4212-93b8-e66441a2f4df
-- executor: a738aadf-af43-4ea8-93b4-2091c6403e49
--
-- The script is idempotent because all test entities use fixed UUIDs.

begin;

insert into public.projects (
  id, customer_id, category_id, title, description, budget, deadline, status, created_at, updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '1768b500-d44a-4212-93b8-e66441a2f4df',
    (select id from public.project_categories where slug = 'web-development'),
    'Корпоративный сайт для логистической компании',
    'Разработка адаптивного сайта с личным кабинетом и интеграцией с CRM.',
    120000, '2026-04-30', 'open', '2026-01-15 10:00:00+00', '2026-01-15 10:00:00+00'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '1768b500-d44a-4212-93b8-e66441a2f4df',
    (select id from public.project_categories where slug = 'web-development'),
    'MVP системы управления заявками',
    'React-приложение с Supabase, ролями пользователей и административной панелью.',
    240000, '2026-07-15', 'open', '2026-03-10 11:00:00+00', '2026-03-10 11:00:00+00'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '1768b500-d44a-4212-93b8-e66441a2f4df',
    (select id from public.project_categories where slug = 'web-development'),
    'Портал технической поддержки',
    'Портал с базой знаний, обращениями пользователей и отчетностью.',
    180000, '2026-05-20', 'in_progress', '2026-02-05 09:30:00+00', '2026-02-12 09:30:00+00'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    '1768b500-d44a-4212-93b8-e66441a2f4df',
    (select id from public.project_categories where slug = 'integrations-api'),
    'Интеграция учетной системы с API партнеров',
    'Разработка API-шлюза и фоновой синхронизации данных.',
    300000, '2026-05-10', 'completed', '2026-01-20 12:00:00+00', '2026-05-08 17:00:00+00'
  )
on conflict (id) do update set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  budget = excluded.budget,
  deadline = excluded.deadline,
  status = excluded.status,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.project_tags (project_id, tag, tag_id)
values
  ('10000000-0000-4000-8000-000000000001', 'React', (select id from public.tags where slug = 'react')),
  ('10000000-0000-4000-8000-000000000001', 'TypeScript', (select id from public.tags where slug = 'typescript')),
  ('10000000-0000-4000-8000-000000000002', 'React', (select id from public.tags where slug = 'react')),
  ('10000000-0000-4000-8000-000000000002', 'Supabase', (select id from public.tags where slug = 'supabase')),
  ('10000000-0000-4000-8000-000000000003', 'PostgreSQL', (select id from public.tags where slug = 'postgresql')),
  ('10000000-0000-4000-8000-000000000003', 'TypeScript', (select id from public.tags where slug = 'typescript')),
  ('10000000-0000-4000-8000-000000000004', 'API интеграции', (select id from public.tags where slug = 'api-integrations')),
  ('10000000-0000-4000-8000-000000000004', 'Node.js', (select id from public.tags where slug = 'node-js'))
on conflict (project_id, tag) do update set tag_id = excluded.tag_id;

insert into public.applications (
  id, project_id, executor_id, proposed_price, proposed_deadline, cover_letter, status, created_at, updated_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'a738aadf-af43-4ea8-93b4-2091c6403e49',
    110000, '2026-04-20',
    'Готов реализовать сайт на React и TypeScript. Опыт интеграции с CRM более трех лет.',
    'pending', '2026-01-18 10:00:00+00', '2026-01-18 10:00:00+00'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'a738aadf-af43-4ea8-93b4-2091c6403e49',
    225000, '2026-07-01',
    'Предлагаю разработку MVP по этапам с еженедельной демонстрацией результата.',
    'pending', '2026-03-12 14:00:00+00', '2026-03-12 14:00:00+00'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'a738aadf-af43-4ea8-93b4-2091c6403e49',
    180000, '2026-05-15',
    'Реализую портал поддержки, базу знаний и отчеты по SLA.',
    'accepted', '2026-02-07 09:00:00+00', '2026-02-10 12:00:00+00'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000004',
    'a738aadf-af43-4ea8-93b4-2091c6403e49',
    300000, '2026-05-01',
    'Разработаю надежный API-шлюз, мониторинг и документацию.',
    'accepted', '2026-01-22 15:00:00+00', '2026-01-25 10:00:00+00'
  )
on conflict (id) do update set
  proposed_price = excluded.proposed_price,
  proposed_deadline = excluded.proposed_deadline,
  cover_letter = excluded.cover_letter,
  status = excluded.status,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.contracts (
  id, project_id, application_id, customer_id, executor_id, subject, payment_type,
  total_amount, platform_fee_percent, deadline, review_period_days, ip_rights,
  is_confidential, termination_terms, status, customer_signed_at, executor_signed_at,
  signed_at, escrow_chain_id, escrow_contract_address, escrow_deal_id,
  escrow_native_amount, escrow_native_symbol, escrow_funded_at, escrow_released_at,
  created_at, updated_at
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000003',
    '1768b500-d44a-4212-93b8-e66441a2f4df',
    'a738aadf-af43-4ea8-93b4-2091c6403e49',
    'Разработка портала технической поддержки',
    'milestone', 180000, 5, '2026-05-20', 7, 'customer', true,
    'Расторжение возможно по соглашению сторон или решению арбитража.',
    'in_progress',
    '2026-02-10 10:00:00+00', '2026-02-10 10:15:00+00', '2026-02-10 10:15:00+00',
    11155111, '0x1111111111111111111111111111111111111111',
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    0.050, 'ETH', '2026-02-11 11:00:00+00', null,
    '2026-02-10 09:00:00+00', '2026-04-20 09:00:00+00'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000004',
    '1768b500-d44a-4212-93b8-e66441a2f4df',
    'a738aadf-af43-4ea8-93b4-2091c6403e49',
    'Интеграция учетной системы с API партнеров',
    'fixed', 300000, 5, '2026-05-10', 7, 'customer', true,
    'При досрочном прекращении оплачивается фактически выполненная работа.',
    'completed',
    '2026-01-25 10:00:00+00', '2026-01-25 10:20:00+00', '2026-01-25 10:20:00+00',
    11155111, '0x1111111111111111111111111111111111111111',
    '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    0.080, 'ETH', '2026-01-26 12:00:00+00', '2026-05-08 16:00:00+00',
    '2026-01-25 09:00:00+00', '2026-05-08 16:00:00+00'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '1768b500-d44a-4212-93b8-e66441a2f4df',
    'a738aadf-af43-4ea8-93b4-2091c6403e49',
    'MVP системы управления заявками',
    'milestone', 225000, 5, '2026-07-01', 5, 'shared', false,
    'Споры передаются администратору платформы.',
    'disputed',
    '2026-03-15 10:00:00+00', '2026-03-15 10:30:00+00', '2026-03-15 10:30:00+00',
    11155111, '0x1111111111111111111111111111111111111111',
    '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    0.060, 'ETH', '2026-03-16 12:00:00+00', null,
    '2026-03-15 09:00:00+00', '2026-04-25 12:00:00+00'
  )
on conflict (id) do update set
  subject = excluded.subject,
  payment_type = excluded.payment_type,
  total_amount = excluded.total_amount,
  platform_fee_percent = excluded.platform_fee_percent,
  deadline = excluded.deadline,
  status = excluded.status,
  escrow_funded_at = excluded.escrow_funded_at,
  escrow_released_at = excluded.escrow_released_at,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.milestones (
  id, contract_id, title, description, amount, deadline, position, status, created_at
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Проектирование', 'Архитектура и прототип интерфейса.', 60000, '2026-03-01', 1, 'approved',
    '2026-02-10 11:00:00+00'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    'Основной функционал', 'База знаний, обращения и роли.', 80000, '2026-04-15', 2, 'submitted',
    '2026-02-10 11:05:00+00'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    'Отчетность', 'Отчеты по SLA и документация.', 40000, '2026-05-20', 3, 'in_progress',
    '2026-02-10 11:10:00+00'
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000003',
    'Прототип MVP', 'Основные пользовательские сценарии.', 100000, '2026-04-10', 1, 'disputed',
    '2026-03-15 11:00:00+00'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  amount = excluded.amount,
  deadline = excluded.deadline,
  position = excluded.position,
  status = excluded.status,
  created_at = excluded.created_at;

insert into public.deliverables (
  id, contract_id, milestone_id, submitted_by_id, description, file_url, file_name,
  is_approved, review_comment, reviewed_at, submitted_at
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'a738aadf-af43-4ea8-93b4-2091c6403e49',
    'Архитектура системы и интерактивный прототип.',
    'https://example.com/test/architecture.pdf', 'architecture.pdf',
    true, 'Этап принят.', '2026-03-02 12:00:00+00', '2026-03-01 16:00:00+00'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000002',
    'a738aadf-af43-4ea8-93b4-2091c6403e49',
    'Основной функционал портала развернут на тестовом стенде.',
    'https://example.com/test/release.zip', 'release.zip',
    null, null, null, '2026-04-16 14:00:00+00'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000004',
    'a738aadf-af43-4ea8-93b4-2091c6403e49',
    'Первая версия MVP для проверки заказчиком.',
    'https://example.com/test/mvp.zip', 'mvp.zip',
    false, 'Не реализован экспорт отчета.', '2026-04-15 13:00:00+00', '2026-04-12 15:00:00+00'
  )
on conflict (id) do update set
  description = excluded.description,
  file_url = excluded.file_url,
  file_name = excluded.file_name,
  is_approved = excluded.is_approved,
  review_comment = excluded.review_comment,
  reviewed_at = excluded.reviewed_at,
  submitted_at = excluded.submitted_at;

insert into public.escrow_transactions (
  id, contract_id, tx_type, status, amount_rub, native_amount, native_symbol,
  chain_id, contract_address, from_user_id, to_user_id, tx_hash, note, created_at
)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'lock', 'confirmed', 180000, 0.050, 'ETH', 11155111,
    '0x1111111111111111111111111111111111111111',
    '1768b500-d44a-4212-93b8-e66441a2f4df', null,
    '0x1000000000000000000000000000000000000000000000000000000000000001',
    'Тестовое внесение средств в escrow', '2026-02-11 11:00:00+00'
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    'release', 'confirmed', 57000, 0.016, 'ETH', 11155111,
    '0x1111111111111111111111111111111111111111',
    '1768b500-d44a-4212-93b8-e66441a2f4df', 'a738aadf-af43-4ea8-93b4-2091c6403e49',
    '0x1000000000000000000000000000000000000000000000000000000000000002',
    'Тестовая выплата за первый этап', '2026-03-02 12:30:00+00'
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    'fee', 'confirmed', 3000, 0.001, 'ETH', 11155111,
    '0x1111111111111111111111111111111111111111',
    '1768b500-d44a-4212-93b8-e66441a2f4df', null,
    '0x1000000000000000000000000000000000000000000000000000000000000003',
    'Тестовая комиссия платформы', '2026-03-02 12:31:00+00'
  ),
  (
    '60000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000002',
    'lock', 'confirmed', 300000, 0.080, 'ETH', 11155111,
    '0x1111111111111111111111111111111111111111',
    '1768b500-d44a-4212-93b8-e66441a2f4df', null,
    '0x2000000000000000000000000000000000000000000000000000000000000001',
    'Тестовое внесение средств в escrow', '2026-01-26 12:00:00+00'
  ),
  (
    '60000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000002',
    'release', 'confirmed', 285000, 0.076, 'ETH', 11155111,
    '0x1111111111111111111111111111111111111111',
    '1768b500-d44a-4212-93b8-e66441a2f4df', 'a738aadf-af43-4ea8-93b4-2091c6403e49',
    '0x2000000000000000000000000000000000000000000000000000000000000002',
    'Тестовая выплата исполнителю', '2026-05-08 16:00:00+00'
  ),
  (
    '60000000-0000-4000-8000-000000000006',
    '30000000-0000-4000-8000-000000000003',
    'lock', 'confirmed', 225000, 0.060, 'ETH', 11155111,
    '0x1111111111111111111111111111111111111111',
    '1768b500-d44a-4212-93b8-e66441a2f4df', null,
    '0x3000000000000000000000000000000000000000000000000000000000000001',
    'Тестовое внесение средств в escrow для спорной сделки', '2026-03-16 12:00:00+00'
  )
on conflict (id) do update set
  status = excluded.status,
  amount_rub = excluded.amount_rub,
  native_amount = excluded.native_amount,
  tx_hash = excluded.tx_hash,
  note = excluded.note,
  created_at = excluded.created_at;

insert into public.disputes (
  id, contract_id, initiated_by_id, status, resolution, resolved_by_id,
  resolution_comment, created_at, resolved_at
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000003',
    '1768b500-d44a-4212-93b8-e66441a2f4df',
    'under_review', null, null,
    'Заказчик считает, что экспорт отчета не соответствует согласованным условиям.',
    '2026-04-20 10:00:00+00', null
  )
on conflict (id) do update set
  status = excluded.status,
  resolution = excluded.resolution,
  resolved_by_id = excluded.resolved_by_id,
  resolution_comment = excluded.resolution_comment,
  created_at = excluded.created_at,
  resolved_at = excluded.resolved_at;

insert into public.messages (
  id, contract_id, dispute_id, sender_id, body, file_url, is_read, created_at
)
values
  (
    '80000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000003',
    null,
    '1768b500-d44a-4212-93b8-e66441a2f4df',
    'В согласованных условиях был указан экспорт отчета в XLSX.',
    null, true, '2026-04-20 10:05:00+00'
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000003',
    null,
    'a738aadf-af43-4ea8-93b4-2091c6403e49',
    'Экспорт реализован в CSV, готов добавить XLSX в рамках доработки.',
    null, false, '2026-04-20 10:20:00+00'
  ),
  (
    '80000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    null,
    '1768b500-d44a-4212-93b8-e66441a2f4df',
    'Прошу администратора проверить первоначальные условия этапа.',
    null, false, '2026-04-21 09:00:00+00'
  )
on conflict (id) do update set
  body = excluded.body,
  is_read = excluded.is_read,
  created_at = excluded.created_at;

insert into public.contract_reviews (
  id, contract_id, author_id, target_id, rating, comment, created_at
)
values
  (
    '90000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    '1768b500-d44a-4212-93b8-e66441a2f4df',
    'a738aadf-af43-4ea8-93b4-2091c6403e49',
    5, 'Работа выполнена качественно и в установленный срок.', '2026-05-09 10:00:00+00'
  )
on conflict (id) do update set
  rating = excluded.rating,
  comment = excluded.comment,
  created_at = excluded.created_at;

-- Extended dataset: 24 projects, applications, 18 contracts and related records.
-- Deterministic UUIDs are generated from stable text values, so this block is idempotent.

with source as (
  select
    n,
    md5('report-project-' || n)::uuid as project_id,
    timestamp '2026-01-05 09:00:00' + ((n - 1) * interval '6 days') as created_at
  from generate_series(1, 24) as n
)
insert into public.projects (
  id, customer_id, category_id, title, description, budget, deadline, status, created_at, updated_at
)
select
  project_id,
  '1768b500-d44a-4212-93b8-e66441a2f4df',
  case
    when n % 4 = 0 then (select id from public.project_categories where slug = 'integrations-api')
    when n % 5 = 0 then (select id from public.project_categories where slug = 'ui-ux-design')
    else (select id from public.project_categories where slug = 'web-development')
  end,
  'Тестовый проект для отчета №' || n,
  'Расширенная тестовая запись для проверки каталогов, фильтров и аналитических запросов.',
  50000 + n * 10000,
  (created_at + interval '90 days')::date,
  (case
    when n > 18 then 'open'
    when n % 7 = 0 then 'cancelled'
    when n % 4 = 0 then 'completed'
    else 'in_progress'
  end)::public.project_status,
  created_at,
  created_at + interval '2 days'
from source
on conflict (id) do update set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  budget = excluded.budget,
  deadline = excluded.deadline,
  status = excluded.status,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

with source as (
  select
    n,
    md5('report-project-' || n)::uuid as project_id,
    case
      when n % 3 = 0 then 'Supabase'
      when n % 3 = 1 then 'React'
      else 'TypeScript'
    end as tag_name,
    case
      when n % 3 = 0 then 'supabase'
      when n % 3 = 1 then 'react'
      else 'typescript'
    end as tag_slug
  from generate_series(1, 24) as n
)
insert into public.project_tags (project_id, tag, tag_id)
select source.project_id, source.tag_name, tags.id
from source
join public.tags on tags.slug = source.tag_slug
on conflict (project_id, tag) do update set tag_id = excluded.tag_id;

with source as (
  select
    n,
    md5('report-application-' || n)::uuid as application_id,
    md5('report-project-' || n)::uuid as project_id,
    timestamp '2026-01-07 11:00:00' + ((n - 1) * interval '6 days') as created_at
  from generate_series(1, 24) as n
)
insert into public.applications (
  id, project_id, executor_id, proposed_price, proposed_deadline, cover_letter, status, created_at, updated_at
)
select
  application_id,
  project_id,
  'a738aadf-af43-4ea8-93b4-2091c6403e49',
  45000 + n * 9500,
  (created_at + interval '75 days')::date,
  'Тестовый отклик №' || n || ': предлагаю выполнить проект по согласованному плану.',
  (case
    when n <= 18 then 'accepted'
    when n % 2 = 0 then 'pending'
    else 'rejected'
  end)::public.application_status,
  created_at,
  created_at + interval '1 day'
from source
on conflict (id) do update set
  proposed_price = excluded.proposed_price,
  proposed_deadline = excluded.proposed_deadline,
  cover_letter = excluded.cover_letter,
  status = excluded.status,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

with source as (
  select
    n,
    md5('report-contract-' || n)::uuid as contract_id,
    md5('report-project-' || n)::uuid as project_id,
    md5('report-application-' || n)::uuid as application_id,
    timestamp '2026-01-10 10:00:00' + ((n - 1) * interval '7 days') as created_at
  from generate_series(1, 18) as n
)
insert into public.contracts (
  id, project_id, application_id, customer_id, executor_id, subject, payment_type,
  total_amount, platform_fee_percent, deadline, review_period_days, ip_rights,
  is_confidential, termination_terms, status, customer_signed_at, executor_signed_at,
  signed_at, escrow_chain_id, escrow_contract_address, escrow_deal_id,
  escrow_native_amount, escrow_native_symbol, escrow_funded_at, escrow_released_at,
  created_at, updated_at
)
select
  contract_id,
  project_id,
  application_id,
  '1768b500-d44a-4212-93b8-e66441a2f4df',
  'a738aadf-af43-4ea8-93b4-2091c6403e49',
  'Тестовый контракт для отчета №' || n,
  (case when n % 2 = 0 then 'milestone' else 'fixed' end)::public.payment_type,
  45000 + n * 9500,
  5,
  (created_at + interval '75 days')::date,
  7,
  'customer',
  n % 3 <> 0,
  'Расторжение возможно по соглашению сторон или решению администратора.',
  (case
    when n % 6 = 0 then 'disputed'
    when n % 4 = 0 then 'completed'
    when n % 3 = 0 then 'review'
    else 'in_progress'
  end)::public.contract_status,
  created_at + interval '1 hour',
  created_at + interval '2 hours',
  created_at + interval '2 hours',
  11155111,
  '0x1111111111111111111111111111111111111111',
  '0x' || md5('report-deal-' || n) || md5('report-deal-extra-' || n),
  round((0.01 + n * 0.002)::numeric, 6),
  'ETH',
  created_at + interval '1 day',
  case when n % 4 = 0 then created_at + interval '65 days' else null end,
  created_at,
  created_at + interval '2 days'
from source
on conflict (id) do update set
  subject = excluded.subject,
  payment_type = excluded.payment_type,
  total_amount = excluded.total_amount,
  platform_fee_percent = excluded.platform_fee_percent,
  deadline = excluded.deadline,
  status = excluded.status,
  escrow_funded_at = excluded.escrow_funded_at,
  escrow_released_at = excluded.escrow_released_at,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

with source as (
  select
    n,
    md5('report-milestone-' || n)::uuid as milestone_id,
    md5('report-contract-' || n)::uuid as contract_id,
    timestamp '2026-01-10 13:00:00' + ((n - 1) * interval '7 days') as created_at
  from generate_series(1, 18) as n
  where n % 2 = 0
)
insert into public.milestones (
  id, contract_id, title, description, amount, deadline, position, status, created_at
)
select
  milestone_id,
  contract_id,
  'Основной этап тестового контракта №' || n,
  'Этап создан для проверки поэтапных контрактов и отчетов.',
  45000 + n * 9500,
  (created_at + interval '60 days')::date,
  1,
  (case
    when n % 6 = 0 then 'disputed'
    when n % 4 = 0 then 'approved'
    else 'submitted'
  end)::public.milestone_status,
  created_at
from source
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  amount = excluded.amount,
  deadline = excluded.deadline,
  status = excluded.status,
  created_at = excluded.created_at;

with source as (
  select
    n,
    md5('report-deliverable-' || n)::uuid as deliverable_id,
    md5('report-contract-' || n)::uuid as contract_id,
    case when n % 2 = 0 then md5('report-milestone-' || n)::uuid else null end as milestone_id,
    timestamp '2026-02-01 14:00:00' + ((n - 1) * interval '7 days') as submitted_at
  from generate_series(1, 18) as n
)
insert into public.deliverables (
  id, contract_id, milestone_id, submitted_by_id, description, file_url, file_name,
  is_approved, review_comment, reviewed_at, submitted_at
)
select
  deliverable_id,
  contract_id,
  milestone_id,
  'a738aadf-af43-4ea8-93b4-2091c6403e49',
  'Тестовый результат работы по контракту №' || n,
  'https://example.com/test/report-deliverable-' || n || '.zip',
  'report-deliverable-' || n || '.zip',
  case when n % 4 = 0 then true when n % 6 = 0 then false else null end,
  case when n % 6 = 0 then 'Требуется уточнить состав результата.' else null end,
  case when n % 4 = 0 or n % 6 = 0 then submitted_at + interval '2 days' else null end,
  submitted_at
from source
on conflict (id) do update set
  description = excluded.description,
  file_url = excluded.file_url,
  file_name = excluded.file_name,
  is_approved = excluded.is_approved,
  review_comment = excluded.review_comment,
  reviewed_at = excluded.reviewed_at,
  submitted_at = excluded.submitted_at;

with source as (
  select
    n,
    md5('report-lock-transaction-' || n)::uuid as transaction_id,
    md5('report-contract-' || n)::uuid as contract_id,
    timestamp '2026-01-11 12:00:00' + ((n - 1) * interval '7 days') as created_at
  from generate_series(1, 18) as n
)
insert into public.escrow_transactions (
  id, contract_id, tx_type, status, amount_rub, native_amount, native_symbol,
  chain_id, contract_address, from_user_id, to_user_id, tx_hash, note, created_at
)
select
  transaction_id,
  contract_id,
  'lock',
  'confirmed',
  45000 + n * 9500,
  round((0.01 + n * 0.002)::numeric, 6),
  'ETH',
  11155111,
  '0x1111111111111111111111111111111111111111',
  '1768b500-d44a-4212-93b8-e66441a2f4df',
  null,
  '0x' || md5('report-lock-hash-' || n) || md5('report-lock-hash-extra-' || n),
  'Искусственная транзакция внесения средств для отчета',
  created_at
from source
on conflict (id) do update set
  status = excluded.status,
  amount_rub = excluded.amount_rub,
  native_amount = excluded.native_amount,
  tx_hash = excluded.tx_hash,
  note = excluded.note,
  created_at = excluded.created_at;

with source as (
  select
    n,
    md5('report-release-transaction-' || n)::uuid as transaction_id,
    md5('report-contract-' || n)::uuid as contract_id,
    timestamp '2026-03-20 16:00:00' + ((n - 4) * interval '8 days') as created_at
  from generate_series(4, 16, 4) as n
)
insert into public.escrow_transactions (
  id, contract_id, tx_type, status, amount_rub, native_amount, native_symbol,
  chain_id, contract_address, from_user_id, to_user_id, tx_hash, note, created_at
)
select
  transaction_id,
  contract_id,
  'release',
  'confirmed',
  round((45000 + n * 9500) * 0.95),
  round((0.0095 + n * 0.0019)::numeric, 6),
  'ETH',
  11155111,
  '0x1111111111111111111111111111111111111111',
  '1768b500-d44a-4212-93b8-e66441a2f4df',
  'a738aadf-af43-4ea8-93b4-2091c6403e49',
  '0x' || md5('report-release-hash-' || n) || md5('report-release-extra-' || n),
  'Искусственная выплата исполнителю для отчета',
  created_at
from source
on conflict (id) do update set
  status = excluded.status,
  amount_rub = excluded.amount_rub,
  native_amount = excluded.native_amount,
  tx_hash = excluded.tx_hash,
  note = excluded.note,
  created_at = excluded.created_at;

with source as (
  select
    n,
    md5('report-dispute-' || n)::uuid as dispute_id,
    md5('report-contract-' || n)::uuid as contract_id,
    timestamp '2026-03-15 10:00:00' + (n * interval '9 days') as created_at
  from generate_series(6, 18, 6) as n
)
insert into public.disputes (
  id, contract_id, initiated_by_id, status, resolution, resolved_by_id,
  resolution_comment, created_at, resolved_at
)
select
  dispute_id,
  contract_id,
  '1768b500-d44a-4212-93b8-e66441a2f4df',
  (case when n = 18 then 'open' else 'under_review' end)::public.dispute_status,
  null,
  null,
  'Тестовая причина спора по контракту №' || n || ': стороны не согласовали результат этапа.',
  created_at,
  null
from source
on conflict (id) do update set
  status = excluded.status,
  resolution_comment = excluded.resolution_comment,
  created_at = excluded.created_at,
  resolved_at = excluded.resolved_at;

with source as (
  select
    n,
    md5('report-message-' || n)::uuid as message_id,
    md5('report-contract-' || n)::uuid as contract_id,
    timestamp '2026-02-05 12:00:00' + ((n - 1) * interval '7 days') as created_at
  from generate_series(1, 18) as n
)
insert into public.messages (
  id, contract_id, dispute_id, sender_id, body, file_url, is_read, created_at
)
select
  message_id,
  contract_id,
  null,
  case
    when n % 2 = 0 then '1768b500-d44a-4212-93b8-e66441a2f4df'::uuid
    else 'a738aadf-af43-4ea8-93b4-2091c6403e49'::uuid
  end,
  'Тестовое сообщение по контракту №' || n,
  null,
  n % 3 = 0,
  created_at
from source
on conflict (id) do update set
  body = excluded.body,
  is_read = excluded.is_read,
  created_at = excluded.created_at;

with source as (
  select
    n,
    md5('report-review-' || n)::uuid as review_id,
    md5('report-contract-' || n)::uuid as contract_id,
    timestamp '2026-04-01 10:00:00' + (n * interval '5 days') as created_at
  from generate_series(4, 16, 4) as n
)
insert into public.contract_reviews (
  id, contract_id, author_id, target_id, rating, comment, created_at
)
select
  review_id,
  contract_id,
  '1768b500-d44a-4212-93b8-e66441a2f4df',
  'a738aadf-af43-4ea8-93b4-2091c6403e49',
  case when n % 8 = 0 then 4 else 5 end,
  'Тестовый отзыв по завершенному контракту №' || n,
  created_at
from source
on conflict (id) do update set
  rating = excluded.rating,
  comment = excluded.comment,
  created_at = excluded.created_at;

commit;
