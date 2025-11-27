-- Create enum for comparison operators
CREATE TYPE public.comparison_operator AS ENUM (
  'greater_than',
  'less_than',
  'equal_to',
  'not_equal_to',
  'greater_than_or_equal',
  'less_than_or_equal',
  'contains',
  'not_contains'
);

-- Create enum for logical operators
CREATE TYPE public.logical_operator AS ENUM (
  'and',
  'or',
  'not'
);

-- Add new columns to requirements table for flexible field-level validation
ALTER TABLE public.requirements
ADD COLUMN field_name TEXT,
ADD COLUMN expected_value TEXT,
ADD COLUMN comparison_operator comparison_operator,
ADD COLUMN logical_operator logical_operator DEFAULT 'and';

-- Create index for faster lookups by requirement_set_id and field_name
CREATE INDEX idx_requirements_set_field ON public.requirements(requirement_set_id, field_name);

-- Add helpful comment
COMMENT ON TABLE public.requirements IS 'Stores validation rules for certificate fields. Each rule defines a field name, expected value, comparison operator, and logical operator for combining with other rules.';