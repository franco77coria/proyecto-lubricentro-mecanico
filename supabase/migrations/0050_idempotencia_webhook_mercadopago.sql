-- ============================================================================
-- 0050 — Idempotencia del webhook de Mercado Pago
--
-- Mercado Pago reintrega webhooks "al menos una vez": el mismo evento de pago
-- puede llegar duplicado por una demora de red, no por un bug. El código del
-- webhook sumaba 30 días de vigencia cada vez que procesaba un evento
-- `payment_approved`, sin chequear si ese pago ya se había aplicado — un
-- reintento normal de MP duplicaba la vigencia otorgada por un solo pago.
--
-- La regla ("no aplicar el mismo pago dos veces") vive acá, en la base, para
-- que no dependa de que el código del webhook se acuerde de chequearlo: es el
-- único lugar que no se puede esquivar ni con una reescritura futura del
-- endpoint.
-- ============================================================================

alter table public.taller_suscripcion_evento
  add constraint taller_suscripcion_evento_mp_id_tipo_key
  unique (mp_id, tipo);
