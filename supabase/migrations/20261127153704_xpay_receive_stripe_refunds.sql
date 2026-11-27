CREATE TABLE public.xpay_received_stripe_refunds (
  event_key text PRIMARY KEY,
  sale_event_key text NOT NULL REFERENCES public.xpay_received_sales(event_key) ON DELETE CASCADE,
  gross_minor bigint NOT NULL CHECK (gross_minor > 0),
  currency text NOT NULL CHECK (currency = 'EUR'),
  received_at timestamptz NOT NULL DEFAULT now(),
  body jsonb NOT NULL
);
CREATE INDEX ON public.xpay_received_stripe_refunds (sale_event_key);
ALTER TABLE public.xpay_received_stripe_refunds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xpay_received_stripe_refunds FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.xpay_received_stripe_refunds TO service_role;

CREATE FUNCTION public.xpay_record_stripe_refund(p_event_key text,p_seller_id text,p_body jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO pg_catalog, public
AS $$
DECLARE
  tx_ref text := p_body->>'transactionId';
  refund_ref text := p_body->>'refundId';
  amount text := p_body#>>'{gross,minor}';
  sale_event text := 'payment.approved:' || tx_ref;
  sale public.xpay_received_sales%ROWTYPE;
  prior public.xpay_received_stripe_refunds%ROWTYPE;
  total bigint;
  original bigint;
BEGIN
  IF jsonb_typeof(p_body) IS DISTINCT FROM 'object' OR
     p_body->>'installation' IS DISTINCT FROM 'orbia.live' OR
     p_body->>'billingSource' IS DISTINCT FROM 'stripe_subscription' OR
     coalesce(tx_ref,'') !~ '^stripe-invoice:in_[a-zA-Z0-9]{1,125}$' OR
     coalesce(refund_ref,'') !~ '^re_[a-zA-Z0-9]{1,125}$' OR
     p_event_key IS DISTINCT FROM 'payment.refunded:' || tx_ref || ':' || refund_ref OR
     p_body#>>'{gross,currency}' IS DISTINCT FROM 'EUR' OR
     coalesce(amount,'') !~ '^[1-9][0-9]{0,14}$' THEN
    RAISE EXCEPTION 'Invalid XPAY refund event' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(sale_event,5783));
  SELECT * INTO STRICT sale FROM public.xpay_received_sales WHERE event_key=sale_event;
  IF sale.seller_id IS DISTINCT FROM p_seller_id OR
     sale.organization_id::text IS DISTINCT FROM p_body->>'organizationId' OR
     sale.body->>'billingSource' IS DISTINCT FROM 'stripe_subscription' OR
     sale.body#>>'{gross,currency}' IS DISTINCT FROM 'EUR' THEN
    RAISE EXCEPTION 'XPAY refund does not belong to the sale' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO prior FROM public.xpay_received_stripe_refunds WHERE event_key=p_event_key;
  IF FOUND THEN
    IF prior.sale_event_key IS DISTINCT FROM sale_event OR prior.body IS DISTINCT FROM p_body THEN
      RAISE EXCEPTION 'XPAY refund conflicts with the recorded adjustment' USING ERRCODE = '23505';
    END IF;
    RETURN sale.venda_id;
  END IF;

  original := (sale.body#>>'{gross,minor}')::bigint;
  INSERT INTO public.xpay_received_stripe_refunds(event_key,sale_event_key,gross_minor,currency,body)
    VALUES(p_event_key,sale_event,amount::bigint,'EUR',p_body);
  SELECT sum(gross_minor) INTO total FROM public.xpay_received_stripe_refunds WHERE sale_event_key=sale_event;
  IF original IS NULL OR total > original THEN
    RAISE EXCEPTION 'XPAY refunds exceed the sale' USING ERRCODE = '23514';
  END IF;

  UPDATE public.vendas_registradas
  SET tags=array_remove(array_remove(coalesce(tags,'{}'::text[]),'XPAY Reembolso parcial'),'XPAY Reembolso total')
           || (CASE WHEN total=original THEN 'XPAY Reembolso total' ELSE 'XPAY Reembolso parcial' END)
  WHERE id=sale.venda_id AND organization_id=sale.organization_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'XPAY sale could not be updated' USING ERRCODE = '23503';
  END IF;
  RETURN sale.venda_id;
END;
$$;
REVOKE ALL ON FUNCTION public.xpay_record_stripe_refund(text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.xpay_record_stripe_refund(text,text,jsonb) TO service_role;
