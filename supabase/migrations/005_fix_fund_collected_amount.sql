CREATE OR REPLACE FUNCTION update_fund_collected_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'completed'
       AND OLD.deleted_at IS NULL
       AND OLD.fund_id IS NOT NULL THEN
      UPDATE public.donation_funds
      SET collected_amount = COALESCE(collected_amount, 0) - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.fund_id;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed'
       AND NEW.deleted_at IS NULL
       AND NEW.fund_id IS NOT NULL THEN
      UPDATE public.donation_funds
      SET collected_amount = COALESCE(collected_amount, 0) + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.fund_id;
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'completed'
     AND OLD.deleted_at IS NULL
     AND OLD.fund_id IS NOT NULL
     AND (
       OLD.fund_id IS DISTINCT FROM NEW.fund_id
       OR OLD.amount IS DISTINCT FROM NEW.amount
       OR OLD.status IS DISTINCT FROM NEW.status
       OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
     ) THEN
    UPDATE public.donation_funds
    SET collected_amount = COALESCE(collected_amount, 0) - OLD.amount,
        updated_at = NOW()
    WHERE id = OLD.fund_id;
  END IF;

  IF NEW.status = 'completed'
     AND NEW.deleted_at IS NULL
     AND NEW.fund_id IS NOT NULL
     AND (
       OLD.fund_id IS DISTINCT FROM NEW.fund_id
       OR OLD.amount IS DISTINCT FROM NEW.amount
       OR OLD.status IS DISTINCT FROM NEW.status
       OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
     ) THEN
    UPDATE public.donation_funds
    SET collected_amount = COALESCE(collected_amount, 0) + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.fund_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_update_fund_amount ON public.donations;
CREATE TRIGGER trg_update_fund_amount
  AFTER INSERT OR UPDATE OR DELETE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_fund_collected_amount();

UPDATE public.donation_funds AS fund
SET collected_amount = COALESCE((
      SELECT SUM(donation.amount)
      FROM public.donations AS donation
      WHERE donation.fund_id = fund.id
        AND donation.status = 'completed'
        AND donation.deleted_at IS NULL
    ), 0),
    updated_at = NOW();
