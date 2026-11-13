-- =============================================================================
-- ngantuqan — 0001: extensions and enumerated domains
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Role on a profile. ADMIN may access /admin; CUSTOMER is a buyer.
CREATE TYPE public.profile_role AS ENUM ('ADMIN', 'CUSTOMER');

-- What a category classifies.
CREATE TYPE public.category_type AS ENUM ('PORTFOLIO', 'SERVICE', 'PRODUCT');

-- Lifecycle of a service order (spec §5.D).
CREATE TYPE public.service_order_status AS ENUM (
  'NEW_INQUIRY',
  'CONTACTED',
  'QUOTED',
  'WAITING_FOR_PAYMENT',
  'IN_PROGRESS',
  'REVISION',
  'COMPLETED',
  'CANCELLED'
);

-- Payment state. Shared by service_orders and digital_orders (spec §6).
CREATE TYPE public.payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- Contact form inquiry types (spec §4.I).
CREATE TYPE public.inquiry_type AS ENUM (
  'GENERAL',
  'DESIGN_SERVICE',
  'COLLABORATION',
  'PARTNERSHIP',
  'OTHER'
);

-- Inquiry workflow (spec §5.G).
CREATE TYPE public.inquiry_status AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM');
