-- Update RLS policies for tableros to allow país-based creation
DROP POLICY IF EXISTS "tableros_insert_members" ON public.tableros;

CREATE POLICY "tableros_insert_authenticated"
ON public.tableros
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow insert if user has gauss role
  has_any_gauss_role(auth.uid())
);