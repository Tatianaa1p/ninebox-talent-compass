-- Step 1: Add 'hrbp' role to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hrbp';