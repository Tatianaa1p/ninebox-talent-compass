-- Fix security issue: Add INSERT policy for user_roles to prevent privilege escalation
-- Only HRBP and admin users can assign roles

CREATE POLICY "Only admins and HRBP can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'hrbp')
  )
);
