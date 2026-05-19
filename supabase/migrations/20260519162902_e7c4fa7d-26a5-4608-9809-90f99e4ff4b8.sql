-- Extend app_role with new workflow roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'shooting_moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tech_supply';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';