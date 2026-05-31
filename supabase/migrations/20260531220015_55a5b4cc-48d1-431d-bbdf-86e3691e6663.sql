ALTER TABLE public.rfqs ADD COLUMN activity_log JSONB DEFAULT '[]';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfqs TO authenticated;
GRANT ALL ON public.rfqs TO service_role;