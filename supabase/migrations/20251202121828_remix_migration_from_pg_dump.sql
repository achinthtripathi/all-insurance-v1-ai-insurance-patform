CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: comparison_operator; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.comparison_operator AS ENUM (
    'greater_than',
    'less_than',
    'equal_to',
    'not_equal_to',
    'greater_than_or_equal',
    'less_than_or_equal',
    'contains',
    'not_contains',
    'within_days'
);


--
-- Name: logical_operator; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.logical_operator AS ENUM (
    'and',
    'or',
    'not'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    "timestamp" timestamp with time zone DEFAULT now()
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    upload_date timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: extracted_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extracted_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    named_insured text,
    certificate_holder text,
    additional_insured text,
    cancellation_notice_period text,
    form_type text,
    coverages jsonb DEFAULT '[]'::jsonb,
    extraction_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: requirement_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requirement_sets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requirements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requirement_set_id uuid NOT NULL,
    coverage_type text NOT NULL,
    minimum_limit numeric,
    limit_currency text DEFAULT 'USD'::text,
    required_endorsements text[],
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    field_name text,
    expected_value text,
    comparison_operator public.comparison_operator,
    logical_operator public.logical_operator DEFAULT 'and'::public.logical_operator
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL
);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: extracted_data extracted_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extracted_data
    ADD CONSTRAINT extracted_data_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: requirement_sets requirement_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requirement_sets
    ADD CONSTRAINT requirement_sets_pkey PRIMARY KEY (id);


--
-- Name: requirements requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requirements
    ADD CONSTRAINT requirements_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_requirements_set_field; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requirements_set_field ON public.requirements USING btree (requirement_set_id, field_name);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: requirement_sets update_requirement_sets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_requirement_sets_updated_at BEFORE UPDATE ON public.requirement_sets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: extracted_data extracted_data_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extracted_data
    ADD CONSTRAINT extracted_data_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: requirements requirements_requirement_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requirements
    ADD CONSTRAINT requirements_requirement_set_id_fkey FOREIGN KEY (requirement_set_id) REFERENCES public.requirement_sets(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: documents Allow temp user document deletes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user document deletes" ON public.documents FOR DELETE USING ((user_id = '00000000-0000-0000-0000-000000000000'::uuid));


--
-- Name: documents Allow temp user document inserts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user document inserts" ON public.documents FOR INSERT WITH CHECK ((user_id = '00000000-0000-0000-0000-000000000000'::uuid));


--
-- Name: documents Allow temp user document selects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user document selects" ON public.documents FOR SELECT USING ((user_id = '00000000-0000-0000-0000-000000000000'::uuid));


--
-- Name: documents Allow temp user document updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user document updates" ON public.documents FOR UPDATE USING ((user_id = '00000000-0000-0000-0000-000000000000'::uuid));


--
-- Name: extracted_data Allow temp user extracted data deletes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user extracted data deletes" ON public.extracted_data FOR DELETE USING ((document_id IN ( SELECT documents.id
   FROM public.documents
  WHERE (documents.user_id = '00000000-0000-0000-0000-000000000000'::uuid))));


--
-- Name: extracted_data Allow temp user extracted data inserts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user extracted data inserts" ON public.extracted_data FOR INSERT WITH CHECK ((document_id IN ( SELECT documents.id
   FROM public.documents
  WHERE (documents.user_id = '00000000-0000-0000-0000-000000000000'::uuid))));


--
-- Name: extracted_data Allow temp user extracted data selects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user extracted data selects" ON public.extracted_data FOR SELECT USING ((document_id IN ( SELECT documents.id
   FROM public.documents
  WHERE (documents.user_id = '00000000-0000-0000-0000-000000000000'::uuid))));


--
-- Name: extracted_data Allow temp user extracted data updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user extracted data updates" ON public.extracted_data FOR UPDATE USING ((document_id IN ( SELECT documents.id
   FROM public.documents
  WHERE (documents.user_id = '00000000-0000-0000-0000-000000000000'::uuid))));


--
-- Name: requirement_sets Allow temp user requirement sets deletes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user requirement sets deletes" ON public.requirement_sets FOR DELETE USING ((user_id = '00000000-0000-0000-0000-000000000000'::uuid));


--
-- Name: requirement_sets Allow temp user requirement sets inserts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user requirement sets inserts" ON public.requirement_sets FOR INSERT WITH CHECK ((user_id = '00000000-0000-0000-0000-000000000000'::uuid));


--
-- Name: requirement_sets Allow temp user requirement sets selects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user requirement sets selects" ON public.requirement_sets FOR SELECT USING ((user_id = '00000000-0000-0000-0000-000000000000'::uuid));


--
-- Name: requirement_sets Allow temp user requirement sets updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user requirement sets updates" ON public.requirement_sets FOR UPDATE USING ((user_id = '00000000-0000-0000-0000-000000000000'::uuid));


--
-- Name: requirements Allow temp user requirements deletes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user requirements deletes" ON public.requirements FOR DELETE USING ((requirement_set_id IN ( SELECT requirement_sets.id
   FROM public.requirement_sets
  WHERE (requirement_sets.user_id = '00000000-0000-0000-0000-000000000000'::uuid))));


--
-- Name: requirements Allow temp user requirements inserts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user requirements inserts" ON public.requirements FOR INSERT WITH CHECK ((requirement_set_id IN ( SELECT requirement_sets.id
   FROM public.requirement_sets
  WHERE (requirement_sets.user_id = '00000000-0000-0000-0000-000000000000'::uuid))));


--
-- Name: requirements Allow temp user requirements selects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user requirements selects" ON public.requirements FOR SELECT USING ((requirement_set_id IN ( SELECT requirement_sets.id
   FROM public.requirement_sets
  WHERE (requirement_sets.user_id = '00000000-0000-0000-0000-000000000000'::uuid))));


--
-- Name: requirements Allow temp user requirements updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow temp user requirements updates" ON public.requirements FOR UPDATE USING ((requirement_set_id IN ( SELECT requirement_sets.id
   FROM public.requirement_sets
  WHERE (requirement_sets.user_id = '00000000-0000-0000-0000-000000000000'::uuid))));


--
-- Name: documents Users can delete own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: requirement_sets Users can delete own requirement sets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own requirement sets" ON public.requirement_sets FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: requirements Users can delete own requirements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own requirements" ON public.requirements FOR DELETE USING ((auth.uid() IN ( SELECT requirement_sets.user_id
   FROM public.requirement_sets
  WHERE (requirement_sets.id = requirements.requirement_set_id))));


--
-- Name: audit_logs Users can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: documents Users can insert own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: extracted_data Users can insert own extracted data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own extracted data" ON public.extracted_data FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT documents.user_id
   FROM public.documents
  WHERE (documents.id = extracted_data.document_id))));


--
-- Name: requirement_sets Users can insert own requirement sets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own requirement sets" ON public.requirement_sets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: requirements Users can insert own requirements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own requirements" ON public.requirements FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT requirement_sets.user_id
   FROM public.requirement_sets
  WHERE (requirement_sets.id = requirements.requirement_set_id))));


--
-- Name: documents Users can update own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: requirement_sets Users can update own requirement sets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own requirement sets" ON public.requirement_sets FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: requirements Users can update own requirements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own requirements" ON public.requirements FOR UPDATE USING ((auth.uid() IN ( SELECT requirement_sets.user_id
   FROM public.requirement_sets
  WHERE (requirement_sets.id = requirements.requirement_set_id))));


--
-- Name: audit_logs Users can view own audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: documents Users can view own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: extracted_data Users can view own extracted data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own extracted data" ON public.extracted_data FOR SELECT USING ((auth.uid() IN ( SELECT documents.user_id
   FROM public.documents
  WHERE (documents.id = extracted_data.document_id))));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: requirement_sets Users can view own requirement sets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own requirement sets" ON public.requirement_sets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: requirements Users can view own requirements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own requirements" ON public.requirements FOR SELECT USING ((auth.uid() IN ( SELECT requirement_sets.user_id
   FROM public.requirement_sets
  WHERE (requirement_sets.id = requirements.requirement_set_id))));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: extracted_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extracted_data ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: requirement_sets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.requirement_sets ENABLE ROW LEVEL SECURITY;

--
-- Name: requirements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


