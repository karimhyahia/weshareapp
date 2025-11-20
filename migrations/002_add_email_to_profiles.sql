-- Migration: Add email column to profiles
-- Run this script in your Supabase SQL Editor

ALTER TABLE public.profiles
ADD COLUMN email text;
