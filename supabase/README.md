# Supabase V2

Project ref: `xrwsgrulzlwnljsczlbo`

Applied remote migrations:

- `20260603120822_init_normalized_platform_schema`
- `20260603120929_grant_data_api_access`
- `20260603121555_advisor_security_and_fk_indexes`
- `20260603133734_allow_contract_parties_read_wallets`
- `20260603141913_tighten_messages_insert_policy`
- `20260603143321_sync_completed_contract_projects`
- `profile_tags_reviews_notifications_extensions`
- `enforce_single_contract_review_per_author`
- `deduplicate_contract_review_indexes`
- `admin_dashboard_access_policies`
- `make_is_admin_security_invoker`
- `fix_admin_role_check_recursion`
- `move_is_admin_to_private_schema`
- `disputes_parties_and_admin_policies`
- `normalize_status_dictionaries`

Security advisors after the final migration: schema/RLS findings are resolved. Supabase Auth may still warn about leaked password protection being disabled; enable it in the Supabase Dashboard for production.

Tables are normalized around:

- users: `profiles`, `user_roles`, `wallets`, `customer_profiles`, `executor_profiles`
- directories: `skills`, `executor_skills`, `project_categories`, `tags`, `project_statuses`, `application_statuses`, `contract_statuses`, `milestone_statuses`, `dispute_statuses`, `tx_statuses`, `platform_settings`
- workflow: `projects`, `project_tags`, `applications`, `contracts`, `milestones`, `deliverables`
- trust layer: `escrow_transactions`, `disputes`, `messages`, `reviews`, `contract_reviews`, `profile_ratings`, `notifications`, `document_templates`
