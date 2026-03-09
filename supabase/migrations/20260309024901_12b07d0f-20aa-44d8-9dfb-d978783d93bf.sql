
CREATE OR REPLACE FUNCTION public.search_records(
  _tenant_id text,
  _filters jsonb DEFAULT '[]'::jsonb,
  _text_query text DEFAULT '',
  _module_id text DEFAULT NULL,
  _limit_val integer DEFAULT 50,
  _offset_val integer DEFAULT 0
)
RETURNS TABLE(
  out_id uuid,
  out_module_id text,
  out_tenant_id text,
  out_values jsonb,
  out_created_at timestamptz,
  out_updated_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.module_id, r.tenant_id, r."values", r.created_at, r.updated_at
  FROM public.crm_records r
  WHERE r.tenant_id = _tenant_id
    AND (_module_id IS NULL OR r.module_id = _module_id)
    AND (
      _text_query = '' OR
      r."values"::text ILIKE '%' || _text_query || '%'
    )
  ORDER BY r.updated_at DESC
  LIMIT _limit_val
  OFFSET _offset_val;
END;
$$;
