-- Corrected versions of the report queries for the current database schema.

-- Listing 3.1: published projects catalog.
select
  p.id                                      as "ID проекта",
  p.title                                   as "Название",
  pr.full_name                              as "Заказчик",
  pc.name                                   as "Категория",
  p.budget                                  as "Бюджет",
  p.deadline                                as "Срок выполнения",
  ps.name                                   as "Статус",
  string_agg(t.name, ', ' order by t.name)  as "Теги"
from public.projects p
join public.profiles pr on pr.id = p.customer_id
left join public.project_categories pc on pc.id = p.category_id
join public.project_statuses ps on ps.code = p.status
left join public.project_tags pt on pt.project_id = p.id
left join public.tags t on t.id = pt.tag_id
where p.status = 'open'
  and p.budget between 50000 and 300000
  and (pc.slug = 'web-development' or pc.slug is null)
group by p.id, pr.full_name, pc.name, ps.name
order by p.created_at desc;

-- Listing 3.2: applications for the selected customer's projects.
select
  a.id                               as "ID заявки",
  p.title                            as "Проект",
  ex.full_name                       as "Исполнитель",
  coalesce(r.rating, 0)              as "Рейтинг",
  a.proposed_price                   as "Предложенная сумма",
  a.proposed_deadline                as "Предложенный срок",
  a.cover_letter                     as "Сопроводительное письмо",
  aps.name                           as "Статус заявки",
  a.created_at                       as "Дата отклика"
from public.applications a
join public.projects p on p.id = a.project_id
join public.profiles ex on ex.id = a.executor_id
join public.application_statuses aps on aps.code = a.status
left join public.profile_ratings r on r.user_id = a.executor_id
where p.customer_id = '1768b500-d44a-4212-93b8-e66441a2f4df'
  and a.created_at >= '2026-01-01'
  and a.created_at < '2026-06-01'
order by a.created_at desc;

-- Listing 3.3: contract financial state.
select
  c.id                                as "ID контракта",
  p.title                             as "Проект",
  customer.full_name                  as "Заказчик",
  executor.full_name                  as "Исполнитель",
  c.payment_type                      as "Модель оплаты",
  c.total_amount                      as "Сумма контракта",
  cs.name                             as "Статус контракта",
  coalesce(sum(et.amount_rub), 0)      as "Сумма операций",
  max(et.tx_hash)                     as "Последний hash транзакции",
  max(et.created_at)                  as "Дата последней операции"
from public.contracts c
join public.projects p on p.id = c.project_id
join public.profiles customer on customer.id = c.customer_id
join public.profiles executor on executor.id = c.executor_id
join public.contract_statuses cs on cs.code = c.status
left join public.escrow_transactions et on et.contract_id = c.id
where c.created_at >= '2026-01-01'
  and c.created_at < '2026-06-01'
group by c.id, p.title, customer.full_name, executor.full_name, cs.name
order by max(et.created_at) desc nulls last;

-- Listing 3.4: dispute arbitration data.
select
  d.id                               as "ID спора",
  ds.name                            as "Статус спора",
  c.subject                          as "Предмет контракта",
  customer.full_name                 as "Заказчик",
  executor.full_name                 as "Исполнитель",
  d.resolution_comment               as "Причина спора",
  count(distinct m.id)               as "Сообщений в чате",
  count(distinct del.id)             as "Сдано результатов",
  count(distinct et.id)              as "Escrow-операций",
  max(et.tx_hash)                    as "Последний hash транзакции"
from public.disputes d
join public.dispute_statuses ds on ds.code = d.status
join public.contracts c on c.id = d.contract_id
join public.profiles customer on customer.id = c.customer_id
join public.profiles executor on executor.id = c.executor_id
left join public.messages m on m.contract_id = c.id
left join public.deliverables del on del.contract_id = c.id
left join public.escrow_transactions et on et.contract_id = c.id
where d.status in ('open', 'under_review')
group by d.id, ds.name, c.subject, customer.full_name, executor.full_name
order by d.created_at desc;

-- Listing 3.5: monthly platform activity and financial dynamics.
with months as (
  select generate_series(
    date '2026-01-01',
    date '2026-05-01',
    interval '1 month'
  )::date as month_start
),
project_stats as (
  select date_trunc('month', created_at)::date as month_start, count(*) as project_count
  from public.projects
  where created_at >= '2026-01-01' and created_at < '2026-06-01'
  group by date_trunc('month', created_at)::date
),
application_stats as (
  select date_trunc('month', created_at)::date as month_start, count(*) as application_count
  from public.applications
  where created_at >= '2026-01-01' and created_at < '2026-06-01'
  group by date_trunc('month', created_at)::date
),
contract_stats as (
  select
    date_trunc('month', created_at)::date as month_start,
    count(*) as contract_count,
    sum(total_amount) as contract_amount,
    sum(total_amount * platform_fee_percent / 100) as expected_commission
  from public.contracts
  where created_at >= '2026-01-01' and created_at < '2026-06-01'
  group by date_trunc('month', created_at)::date
),
transaction_stats as (
  select
    date_trunc('month', created_at)::date as month_start,
    count(*) filter (where status = 'confirmed') as confirmed_transactions,
    sum(amount_rub) filter (where status = 'confirmed') as transaction_amount
  from public.escrow_transactions
  where created_at >= '2026-01-01' and created_at < '2026-06-01'
  group by date_trunc('month', created_at)::date
)
select
  to_char(m.month_start, 'TMMonth YYYY')                 as "Месяц",
  coalesce(p.project_count, 0)                          as "Новых проектов",
  coalesce(a.application_count, 0)                      as "Новых заявок",
  coalesce(c.contract_count, 0)                         as "Новых контрактов",
  coalesce(c.contract_amount, 0)                        as "Сумма контрактов",
  coalesce(c.expected_commission, 0)                    as "Расчетная комиссия",
  coalesce(t.confirmed_transactions, 0)                 as "Подтвержденных операций",
  coalesce(t.transaction_amount, 0)                     as "Сумма операций"
from months m
left join project_stats p using (month_start)
left join application_stats a using (month_start)
left join contract_stats c using (month_start)
left join transaction_stats t using (month_start)
order by m.month_start;

-- Listing 3.6: executor performance report.
with contract_stats as (
  select
    executor_id,
    count(*)                                            as contract_count,
    count(*) filter (where status = 'completed')        as completed_count,
    count(*) filter (where status = 'disputed')         as disputed_count,
    coalesce(sum(total_amount) filter (where status = 'completed'), 0)
                                                        as completed_amount,
    avg(total_amount)::numeric(14, 2)                   as average_amount
  from public.contracts
  where created_at >= '2026-01-01'
    and created_at < '2026-06-01'
  group by executor_id
),
deliverable_stats as (
  select c.executor_id, count(d.id) as deliverable_count
  from public.contracts c
  join public.deliverables d on d.contract_id = c.id
  where c.created_at >= '2026-01-01'
    and c.created_at < '2026-06-01'
  group by c.executor_id
)
select
  executor.id                                           as "ID исполнителя",
  executor.full_name                                    as "Исполнитель",
  coalesce(r.rating, 0)                                 as "Рейтинг",
  coalesce(r.review_count, 0)                           as "Количество отзывов",
  cs.contract_count                                     as "Всего контрактов",
  cs.completed_count                                    as "Завершено контрактов",
  cs.disputed_count                                     as "Спорных контрактов",
  cs.completed_amount                                   as "Сумма завершенных сделок",
  cs.average_amount                                     as "Средний чек",
  coalesce(ds.deliverable_count, 0)                     as "Сдано результатов"
from contract_stats cs
join public.profiles executor on executor.id = cs.executor_id
left join public.profile_ratings r on r.user_id = executor.id
left join deliverable_stats ds on ds.executor_id = executor.id
order by "Сумма завершенных сделок" desc, "Рейтинг" desc;
