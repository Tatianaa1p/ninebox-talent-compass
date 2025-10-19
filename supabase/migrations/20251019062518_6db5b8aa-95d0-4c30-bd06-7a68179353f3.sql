-- Enable RLS on empleados table for demo mode
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to view empleados
CREATE POLICY "Anonymous users can view empleados (demo mode)"
ON empleados
FOR SELECT
USING (true);

-- Allow anonymous users to insert empleados
CREATE POLICY "Anonymous users can insert empleados (demo mode)"
ON empleados
FOR INSERT
WITH CHECK (true);

-- Allow anonymous users to update empleados
CREATE POLICY "Anonymous users can update empleados (demo mode)"
ON empleados
FOR UPDATE
USING (true);

-- Allow anonymous users to delete empleados
CREATE POLICY "Anonymous users can delete empleados (demo mode)"
ON empleados
FOR DELETE
USING (true);