create table test_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references test_runs(id),

  test_id text,
  suite text,
  status text,
  duration numeric,

  failure_type text,
  is_flaky boolean,
  workflow_type text;
  test_name text;
);


create table failure_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid,

  test_id text,
  classification text,
  root_signal text,
  created_at timestamptz default now()
);


create table public.retrieval_metrics (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references test_runs(id),
  test_id text,
  language text,
  avg_similarity numeric,
  max_similarity numeric,
  passed_count integer,
  overlap_ratio numeric,
  rank_shift numeric,
  concept_score integer,
  latency_ms numeric,
  confidence numeric,
  created_at timestamp with time zone default now()
);


create index idx_test_runs_timestamp 
on public.test_runs (run_timestamp desc);



create or replace function public.sql(query text)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  execute query into result;
  return result;
end;
$$;



create or replace function public.get_previous_run(current_run uuid)
returns table (
  id uuid,
  run_timestamp timestamptz
)
language sql
as $$
  select id, run_timestamp
  from test_runs
  where id != current_run
  order by run_timestamp desc
  limit 1;
$$;

create table public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references test_runs(id),

  sample_size integer,
  concurrent_requests integer,

  min_latency numeric,
  median_latency numeric,
  mean_latency numeric,
  p95_latency numeric,
  max_latency numeric,

  concurrent_p95 numeric,
  degradation_ratio numeric,
  latency_samples jsonb null,
  concurrent_latency_samples jsonb null;

  created_at timestamptz default now()
);



create or replace function public.get_performance_metrics(run uuid)
returns table (
  p95_latency numeric,
  degradation_ratio numeric
)
language sql
as $$
  select 
    p95_latency,
    degradation_ratio
  from performance_metrics
  where run_id = run
  limit 1;
$$;




create or replace function public.get_retrieval_summary(run uuid)
returns table (
  avg_similarity numeric,
  avg_overlap numeric,
  avg_confidence numeric
)
language sql
as $$
  select
    avg(avg_similarity),
    avg(overlap_ratio),
    avg(confidence)
  from retrieval_metrics
  where run_id = run;
$$;


create table public.rate_limit_metrics (
  id uuid not null default gen_random_uuid(),
  run_id uuid not null,
  total_requests integer,
  total_429 integer,
  enforcement_rate numeric,
  first_429_index integer,
  threshold_drift numeric,
  created_at timestamp with time zone default now(),

  constraint rate_limit_metrics_pkey primary key (id),
  constraint rate_limit_metrics_run_id_fkey
    foreign key (run_id) references test_runs(id)
);



-- Filtered to weekly_regression_suite only.
-- E2E runs (pr_e2e, deploy_e2e) are intentionally excluded so they cannot
-- corrupt window functions in regression_run_comparison / regression_story.
create or replace view public.regression_run_summary as
select
  tr.id as run_id,
  tr.run_timestamp,
  tr.workflow_type,
  tr.environment,
  tr.reliability_score,
  tr.release_confidence,

  -- Performance
  pm.p95_latency,
  pm.degradation_ratio,
  pm.concurrent_p95,

  -- Rate limit
  rl.enforcement_rate,
  rl.threshold_drift,

  -- Retrieval aggregates (computed)
  avg(rm.overlap_ratio) as avg_overlap,
  avg(rm.rank_shift) as avg_rank_shift,
  coalesce(avg(rm.confidence), 0::numeric) as avg_confidence,
  COALESCE(min(rm.confidence), 0::numeric) as min_confidence

from test_runs tr

left join performance_metrics pm
  on pm.run_id = tr.id

left join rate_limit_metrics rl
  on rl.run_id = tr.id

left join retrieval_metrics rm
  on rm.run_id = tr.id

where tr.workflow_type = 'weekly_regression_suite'

group by
  tr.id,
  tr.run_timestamp,
  tr.workflow_type,
  tr.environment,
  tr.reliability_score,
  tr.release_confidence,
  pm.p95_latency,
  pm.degradation_ratio,
  pm.concurrent_p95,
  rl.enforcement_rate,
  rl.threshold_drift;


create or replace view public.regression_run_comparison as
with ranked as (
  select
    *,
    lag(run_id) over (order by run_timestamp) as prev_run_id,
    lag(p95_latency) over (order by run_timestamp) as prev_latency,
    lag(avg_confidence) over (order by run_timestamp) as prev_confidence,
    lag(reliability_score) over (order by run_timestamp) as prev_reliability,
    lag(min_confidence) over (order by run_timestamp) as prev_min_confidence
  from regression_run_summary
)

select
  run_id,
  run_timestamp,

  -- Current
  p95_latency,
  avg_confidence,
  reliability_score,

  -- Previous
  prev_latency,
  prev_confidence,
  prev_reliability,

  -- Deltas (KEEP ORIGINAL ORDER)
  (p95_latency - prev_latency) as latency_delta,
  round(
    (p95_latency - prev_latency) / NULLIF(prev_latency, 0::numeric),
    3
  ) as latency_pct,

  (avg_confidence - prev_confidence) as confidence_delta,
  round(
    (avg_confidence - prev_confidence) / NULLIF(prev_confidence, 0::numeric),
    3
  ) as confidence_pct,

  (reliability_score - prev_reliability) as reliability_delta,

  -- ✅ NEW FIELDS → ALWAYS APPEND
  min_confidence,
  prev_min_confidence,
  (min_confidence - prev_min_confidence) as min_confidence_delta

from ranked;


create or replace view public.regression_story as
with base as (
  select
    *,
    count(*) over () as total_runs
  from regression_run_comparison
)

select
  *,

  -- 📊 Trend Direction
  case
    when reliability_delta > 5 then 'improving'
    when reliability_delta < -5 then 'degrading'
    else 'stable'
  end as trend_direction,

  -- 🚨 Severity
  case
    when abs(coalesce(latency_pct, 0)) + abs(coalesce(confidence_pct, 0)) > 1 then 'critical'
    when abs(coalesce(latency_pct, 0)) + abs(coalesce(confidence_pct, 0)) > 0.5 then 'moderate'
    when abs(coalesce(latency_pct, 0)) + abs(coalesce(confidence_pct, 0)) > 0.2 then 'minor'
    else 'stable'
  end as regression_severity,

 -- latency direction
  case
    when latency_pct > 0.2 then 'regression'
    when latency_pct < -0.2 then 'improvement'
    else 'stable'
  end as latency_direction,

 -- confidence signal
  case
    when confidence_pct < -0.2 then 'regression'
    when confidence_pct > 0.2 then 'improvement'
    else 'stable'
  end as confidence_direction,

  -- 🧩 Primary Signal
  case
    when latency_pct > 0.2 and confidence_pct < -0.2 then 'system_degradation'
    when min_confidence < 40 then 'retrieval_regression'
    when latency_pct > 0.3 then 'latency_regression'
    else 'no_signal'
  end as primary_signal,

  case
    when min_confidence < 25 then 'critical_user_impact'
    when min_confidence < 40 then 'moderate_user_impact'
    when latency_pct > 0.3 then 'performance_user_impact'
    else 'no_user_impact'
  end as user_impact,

  -- 🧠 Analysis confidence
  case
    when total_runs < 3 then 'low'
    when total_runs < 6 then 'medium'
    else 'high'
  end as analysis_confidence

from base;


create or replace view public.regression_trend_analysis as
with base as (
  select
    run_id,
    run_timestamp,
    reliability_score,
    lag(reliability_score) over (order by run_timestamp) as prev_reliability
  from regression_run_summary
)
select
  *,
  (reliability_score - prev_reliability) as slope
from base;



create or replace view public.regression_anomalies as
with base as (
  select
    run_id,
    run_timestamp,

    p95_latency,
    avg_confidence,
    reliability_score,

    -- latency z
    case
      when stddev(p95_latency) over () = 0 then 0
      else (p95_latency - avg(p95_latency) over ()) / stddev(p95_latency) over ()
    end as latency_z,

    -- confidence z
    case
      when stddev(avg_confidence) over () = 0 then 0
      else (avg_confidence - avg(avg_confidence) over ()) / stddev(avg_confidence) over ()
    end as confidence_z,

    -- reliability z
    case
      when stddev(reliability_score) over () = 0 then 0
      else (reliability_score - avg(reliability_score) over ()) / stddev(reliability_score) over ()
    end as reliability_z

  from regression_run_summary
)


create or replace view public.retrieval_language_drift as
select
  run_id,
  language,
  avg(confidence) as avg_confidence,
  min(confidence) as min_confidence,
  lag(avg(confidence)) over (
    partition by language order by run_id
  ) as prev_confidence,
  avg(confidence) - lag(avg(confidence)) over (
    partition by language order by run_id
  ) as confidence_delta
from retrieval_metrics
group by run_id, language;




-- Includes E2E runs (pr_e2e, deploy_e2e) alongside regression runs.
-- Excludes workflow_type = 'unknown' to filter misconfigured runs.
-- workflow_type column exposed so callers can filter per workflow tier.
create or replace view public.flakiness_run_summary as
select
  id as run_id,
  run_timestamp,
  workflow_type,
  total_tests,
  flaky,
  round((flaky::numeric / nullif(total_tests, 0)) * 100, 2) as flakiness_pct
from test_runs
where workflow_type != 'unknown';


-- LAG() is partitioned by workflow_type so each workflow trends against itself.
-- PR runs compare to previous PR runs; deploy runs to previous deploy runs.
-- This prevents cross-workflow contamination in trend deltas.
create or replace view public.flakiness_trend as
select
  run_id,
  run_timestamp,
  workflow_type,
  flakiness_pct,
  lag(flakiness_pct) over (partition by workflow_type order by run_timestamp) as prev_flakiness,
  flakiness_pct - lag(flakiness_pct) over (partition by workflow_type order by run_timestamp) as flakiness_delta
from flakiness_run_summary;


-- Per-test global flakiness aggregated across all workflows.
-- workflow_type intentionally excluded from GROUP BY: a test flaky in PR
-- and deploy is globally unstable regardless of where it was observed.
-- last_seen + recency indicate whether the signal is still actionable.
create or replace view public.test_flakiness_enriched as
with base as (
  select
    tr.test_id,
    tr.test_name,
    count(*)                                             as total_runs,
    sum(case when tr.is_flaky then 1 else 0 end)         as flaky_runs,
    max(trn.run_timestamp)                               as last_seen
  from test_results tr
  join test_runs trn on trn.id = tr.run_id
  where tr.test_id is not null
  group by tr.test_id, tr.test_name
)
select
  test_id,
  test_name,
  total_runs,
  flaky_runs,
  round((flaky_runs::numeric / nullif(total_runs, 0)) * 100, 2) as flakiness_pct,
  case
    when round((flaky_runs::numeric / nullif(total_runs, 0)) * 100, 2) > 10 then 'high'
    when round((flaky_runs::numeric / nullif(total_runs, 0)) * 100, 2) > 3  then 'medium'
    else 'low'
  end as severity,
  last_seen,
  case
    when now() - last_seen < interval '7 days' then 'recent'
    else 'stale'
  end as recency
from base;


-- Per-workflow E2E stability: current vs previous flakiness with trend direction.
-- Aggregates by workflow_type (not run_id) as required.
-- ROW_NUMBER() gives clean current/prev isolation per workflow without subquery ambiguity.
create or replace view public.e2e_workflow_stability as
with ranked as (
  select
    workflow_type,
    round(flaky::numeric / nullif(total_tests, 0) * 100, 2) as flakiness_pct,
    run_timestamp,
    row_number() over (partition by workflow_type order by run_timestamp desc) as rn
  from test_runs
  where workflow_type in ('pr_e2e', 'deploy_e2e')
    and total_tests > 0
),
current_run as (select * from ranked where rn = 1),
prev_run    as (select * from ranked where rn = 2)
select
  c.workflow_type,
  c.flakiness_pct                                                         as avg_flakiness_pct,
  p.flakiness_pct                                                         as prev_flakiness_pct,
  round(c.flakiness_pct - coalesce(p.flakiness_pct, c.flakiness_pct), 2) as flakiness_delta,
  case
    when c.flakiness_pct - coalesce(p.flakiness_pct, c.flakiness_pct) < -0.5 then 'improving'
    when c.flakiness_pct - coalesce(p.flakiness_pct, c.flakiness_pct) >  0.5 then 'degrading'
    else 'stable'
  end as trend_direction,
  (select count(*) from test_runs
   where workflow_type = c.workflow_type and total_tests > 0) as run_count
from current_run c
left join prev_run p on p.workflow_type = c.workflow_type;


create or replace view public.retrieval_language_summary as
select
  run_id,
  language,
  round(avg(confidence), 2) as avg_confidence,
  round(min(confidence), 2) as min_confidence
from retrieval_metrics
group by run_id, language;