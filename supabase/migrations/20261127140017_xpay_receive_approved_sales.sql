-- Records one XPAY payment in the CRM organization that owns its order reference.
CREATE TABLE IF NOT EXISTS public.xpay_merchant_destinations (
  seller_id text PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pipeline_id uuid NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE RESTRICT,
  paid_stage_id uuid NOT NULL REFERENCES public.crm_stages(id) ON DELETE RESTRICT
);
ALTER TABLE public.xpay_merchant_destinations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xpay_merchant_destinations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.xpay_merchant_destinations TO service_role;

CREATE TABLE IF NOT EXISTS public.xpay_received_sales (
  event_key text PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  venda_id uuid NOT NULL REFERENCES public.vendas_registradas(id) ON DELETE CASCADE,
  seller_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  body jsonb NOT NULL
);
ALTER TABLE public.xpay_received_sales ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xpay_received_sales FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.xpay_received_sales TO service_role;

CREATE OR REPLACE FUNCTION public.xpay_record_sale(
  p_event_key text, p_seller_id text, p_occurred_at timestamptz, p_body jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target_org uuid;
  order_reference uuid;
  target_pipeline uuid;
  target_stage uuid;
  org_timezone text;
  external_ref text := p_body->>'externalReference';
  linked_lead uuid;
  linked_contact uuid;
  transaction_ref text := p_body->>'transactionId';
  sale_currency text := p_body#>>'{gross,currency}';
  sale_amount text := p_body#>>'{gross,minor}';
  prior public.xpay_received_sales%ROWTYPE;
  saved_id uuid;
BEGIN
  IF jsonb_typeof(p_body) IS DISTINCT FROM 'object'
     OR p_occurred_at IS NULL
     OR p_seller_id IS NULL OR length(p_seller_id) NOT BETWEEN 1 AND 150
     OR transaction_ref IS NULL OR transaction_ref !~ '^[a-zA-Z0-9_.:-]{1,150}$'
     OR p_event_key IS DISTINCT FROM ('payment.approved:' || transaction_ref)
     OR p_body->>'installation' IS DISTINCT FROM 'orbia.live'
     OR coalesce(p_body->>'organizationId','') !~* '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$'
     OR length(coalesce(external_ref,'')) > 150
     OR coalesce(sale_currency,'') !~ '^[A-Z]{3}$'
     OR coalesce(sale_amount,'') !~ '^[1-9][0-9]{0,14}$' THEN
    RAISE EXCEPTION 'Invalid XPAY sales event' USING ERRCODE = '22023';
  END IF;
  target_org := (p_body->>'organizationId')::uuid;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_event_key, 5783));
  SELECT * INTO prior FROM public.xpay_received_sales WHERE event_key=p_event_key;
  IF FOUND THEN
    IF prior.organization_id IS DISTINCT FROM target_org OR prior.seller_id IS DISTINCT FROM p_seller_id OR
       prior.body IS DISTINCT FROM p_body THEN
      RAISE EXCEPTION 'XPAY event conflicts with recorded sale' USING ERRCODE = '23505';
    END IF;
    RETURN prior.venda_id;
  END IF;

  SELECT d.pipeline_id, d.paid_stage_id, coalesce(nullif(o.timezone,''),'UTC')
    INTO target_pipeline,target_stage,org_timezone
    FROM public.xpay_merchant_destinations d
    JOIN public.organizations o ON o.id=d.organization_id AND o.status='active'
    JOIN public.crm_pipelines p ON p.id=d.pipeline_id AND p.organization_id=d.organization_id
    JOIN public.crm_stages s ON s.id=d.paid_stage_id AND s.pipeline_id=p.id AND s.organization_id=d.organization_id
    WHERE d.seller_id=p_seller_id AND d.organization_id=target_org;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No Orbia order destination for this XPAY seller' USING ERRCODE = '23503';
  END IF;

  IF external_ref ~* '^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$' THEN
    order_reference := external_ref::uuid;
    IF EXISTS (SELECT 1 FROM public.crm_leads WHERE id=order_reference AND organization_id<>target_org)
       OR EXISTS (SELECT 1 FROM public.contacts WHERE id=order_reference AND organization_id<>target_org) THEN
      RAISE EXCEPTION 'XPAY order reference belongs to another organization' USING ERRCODE = '23503';
    END IF;
    SELECT id INTO linked_lead FROM public.crm_leads
      WHERE id=order_reference AND organization_id=target_org AND pipeline_id=target_pipeline FOR KEY SHARE;
    IF linked_lead IS NULL THEN
      SELECT id INTO linked_contact FROM public.contacts WHERE id=order_reference AND organization_id=target_org FOR KEY SHARE;
    END IF;
  END IF;
  IF linked_lead IS NULL THEN
    INSERT INTO public.crm_leads(organization_id,pipeline_id,stage_id,contact_id,title,currency)
    VALUES(target_org,target_pipeline,target_stage,linked_contact,'Pagamento XPAY ' || transaction_ref,sale_currency)
    RETURNING id INTO linked_lead;
  ELSE
    UPDATE public.crm_leads SET stage_id=target_stage
    WHERE id=linked_lead AND organization_id=target_org AND pipeline_id=target_pipeline
      AND stage_id IN (SELECT id FROM public.crm_stages WHERE pipeline_id=target_pipeline AND slug='aguardando_pagamento');
  END IF;

  INSERT INTO public.vendas_registradas (
    organization_id, lead_id, contact_id, valor_cents, currency, data, tags, observacao
  ) VALUES (
    target_org, linked_lead, linked_contact, sale_amount::bigint, sale_currency,
    (p_occurred_at AT TIME ZONE org_timezone)::date, ARRAY['XPAY']::text[],
    'Pagamento XPAY ' || transaction_ref
  ) RETURNING id INTO saved_id;

  INSERT INTO public.xpay_received_sales (event_key,organization_id,venda_id,seller_id,body)
  VALUES (p_event_key,target_org,saved_id,p_seller_id,p_body);
  RETURN saved_id;
END;
$$;
REVOKE ALL ON FUNCTION public.xpay_record_sale(text,text,timestamptz,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.xpay_record_sale(text,text,timestamptz,jsonb) TO service_role;
