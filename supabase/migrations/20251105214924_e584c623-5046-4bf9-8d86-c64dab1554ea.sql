-- First, add new enum values if they don't exist (this will be committed)
DO $$ 
BEGIN
  -- Add hrbp if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hrbp' AND enumtypid = 'gauss_role'::regtype) THEN
    ALTER TYPE gauss_role ADD VALUE 'hrbp';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Add manager if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'manager' AND enumtypid = 'gauss_role'::regtype) THEN
    ALTER TYPE gauss_role ADD VALUE 'manager';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Add hrbp_cl if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hrbp_cl' AND enumtypid = 'gauss_role'::regtype) THEN
    ALTER TYPE gauss_role ADD VALUE 'hrbp_cl';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Add manager_cl if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'manager_cl' AND enumtypid = 'gauss_role'::regtype) THEN
    ALTER TYPE gauss_role ADD VALUE 'manager_cl';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Add hrbp_apu if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hrbp_apu' AND enumtypid = 'gauss_role'::regtype) THEN
    ALTER TYPE gauss_role ADD VALUE 'hrbp_apu';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Add manager_apu if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'manager_apu' AND enumtypid = 'gauss_role'::regtype) THEN
    ALTER TYPE gauss_role ADD VALUE 'manager_apu';
  END IF;
END $$;