-- Add temp user policies for requirement_sets to enable development without auth
CREATE POLICY "Allow temp user requirement sets inserts"
ON public.requirement_sets
FOR INSERT
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Allow temp user requirement sets selects"
ON public.requirement_sets
FOR SELECT
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Allow temp user requirement sets updates"
ON public.requirement_sets
FOR UPDATE
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Allow temp user requirement sets deletes"
ON public.requirement_sets
FOR DELETE
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Add temp user policies for requirements table
CREATE POLICY "Allow temp user requirements inserts"
ON public.requirements
FOR INSERT
WITH CHECK (requirement_set_id IN (
  SELECT id FROM requirement_sets WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
));

CREATE POLICY "Allow temp user requirements selects"
ON public.requirements
FOR SELECT
USING (requirement_set_id IN (
  SELECT id FROM requirement_sets WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
));

CREATE POLICY "Allow temp user requirements updates"
ON public.requirements
FOR UPDATE
USING (requirement_set_id IN (
  SELECT id FROM requirement_sets WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
));

CREATE POLICY "Allow temp user requirements deletes"
ON public.requirements
FOR DELETE
USING (requirement_set_id IN (
  SELECT id FROM requirement_sets WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
));